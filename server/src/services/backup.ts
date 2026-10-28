import fs from 'fs';
import path from 'path';
import { prisma } from '../db.js';

const BACKUP_DIR = process.env.BACKUP_DIR
  ? path.resolve(process.env.BACKUP_DIR)
  : path.resolve(process.cwd(), 'backups');

// Retenção padrão: 14 dias de backups diários
const RETENTION_DAYS = Math.max(parseInt(process.env.BACKUP_RETENTION_DAYS || '14', 10) || 14, 1);
// Intervalo padrão: a cada 24 horas
const INTERVAL_HOURS = Math.max(parseFloat(process.env.BACKUP_INTERVAL_HOURS || '24') || 24, 0.5);

let backupTimer: NodeJS.Timeout | null = null;

function timestampSlug(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

/**
 * Cria um snapshot consistente do SQLite.
 *
 * Estratégia: PRAGMA wal_checkpoint(TRUNCATE) esvazia o arquivo -wal aplicando
 * todas as transações pendentes no arquivo principal. Depois disso a cópia do
 * arquivo .db é consistente e não precisa copiar -wal/-shm.
 *
 * Fallback: se o checkpoint falhar (ex.: banco travado por outro processo),
 * tentamos `VACUUM INTO`, que gera um arquivo compactado e consistente.
 */
export function resolveDatabasePath(): string {
  const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
  const dbRelative = dbUrl.startsWith('file:') ? dbUrl.slice(5) : dbUrl;
  if (path.isAbsolute(dbRelative)) return dbRelative;

  // Prisma no SQLite resolve caminhos relativos a partir da pasta prisma/
  const candidatePrisma = path.resolve(process.cwd(), 'prisma', dbRelative);
  if (fs.existsSync(candidatePrisma)) return candidatePrisma;

  const candidateCwd = path.resolve(process.cwd(), dbRelative);
  if (fs.existsSync(candidateCwd)) return candidateCwd;

  return candidatePrisma;
}

export async function createBackup(): Promise<{
  file: string;
  sizeBytes: number;
  method: string;
}> {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const dbPath = resolveDatabasePath();

  if (!fs.existsSync(dbPath)) {
    throw new Error(`Banco de dados não encontrado em ${dbPath}`);
  }

  const backupFile = path.join(BACKUP_DIR, `dev-${timestampSlug()}.db`);
  let method = 'checkpoint+copy';

  try {
    await prisma.$executeRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);');
    await fs.promises.copyFile(dbPath, backupFile);
  } catch (err) {
    console.warn('[Backup] Checkpoint falhou, tentando VACUUM INTO:', err);
    method = 'vacuum-into';
    const escaped = backupFile.replace(/'/g, "''");
    await prisma.$executeRawUnsafe(`VACUUM INTO '${escaped}';`);
  }

  const stat = await fs.promises.stat(backupFile);

  // Verificação mínima de integridade: SQLite sempre grava o cabeçalho "SQLite format 3"
  const fd = await fs.promises.open(backupFile, 'r');
  try {
    const header = Buffer.alloc(16);
    await fd.read(header, 0, 16, 0);
    if (!header.toString('utf8').startsWith('SQLite format 3')) {
      await fd.close();
      await fs.promises.unlink(backupFile).catch(() => {});
      throw new Error('Backup corrompido: cabeçalho SQLite inválido');
    }
  } finally {
    await fd.close().catch(() => {});
  }

  // Remove backups acima da retenção
  await pruneOldBackups();

  console.log(`💾 Backup criado: ${path.basename(backupFile)} (${(stat.size / 1024).toFixed(0)} KB, ${method})`);

  return { file: backupFile, sizeBytes: stat.size, method };
}

export async function listBackups(): Promise<
  Array<{ file: string; sizeBytes: number; createdAt: string }>
> {
  if (!fs.existsSync(BACKUP_DIR)) return [];

  const entries = await fs.promises.readdir(BACKUP_DIR);
  const backups = [];

  for (const name of entries) {
    if (!name.endsWith('.db')) continue;
    const full = path.join(BACKUP_DIR, name);
    const stat = await fs.promises.stat(full);
    backups.push({
      file: name,
      sizeBytes: stat.size,
      createdAt: stat.mtime.toISOString(),
    });
  }

  return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function pruneOldBackups(): Promise<number> {
  if (!fs.existsSync(BACKUP_DIR)) return 0;

  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const entries = await fs.promises.readdir(BACKUP_DIR);
  let removed = 0;

  for (const name of entries) {
    if (!name.endsWith('.db')) continue;
    const full = path.join(BACKUP_DIR, name);
    const stat = await fs.promises.stat(full);
    if (stat.mtimeMs < cutoff) {
      await fs.promises.unlink(full).catch(() => {});
      removed++;
    }
  }

  if (removed > 0) {
    console.log(`🧹 ${removed} backup(s) com mais de ${RETENTION_DAYS} dias removido(s).`);
  }

  return removed;
}

export const backupConfig = {
  dir: BACKUP_DIR,
  retentionDays: RETENTION_DAYS,
  intervalHours: INTERVAL_HOURS,
};

/**
 * Agenda o backup automático. Roda uma vez na inicialização e depois
 * a cada INTERVAL_HOURS. Erros nunca derrubam o servidor.
 */
export function startBackupScheduler() {
  if (process.env.BACKUP_ENABLED === 'false') {
    console.log('⏸️ Backup automático desativado por BACKUP_ENABLED=false');
    return;
  }

  const run = () =>
    createBackup().catch((err) => console.error('[Backup] Falha no backup automático:', err));

  // Backup inicial após 30s (deixa o servidor terminar de subir), sem bloquear o boot
  setTimeout(run, 30 * 1000);

  if (backupTimer) clearInterval(backupTimer);
  backupTimer = setInterval(run, INTERVAL_HOURS * 60 * 60 * 1000);

  console.log(
    `💾 Backup automático ativado: ${backupConfig.dir} a cada ${INTERVAL_HOURS}h (retenção ${RETENTION_DAYS} dias)`
  );
}

export function stopBackupScheduler() {
  if (backupTimer) clearInterval(backupTimer);
  backupTimer = null;
}