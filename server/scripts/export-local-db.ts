/**
 * Exporta o banco local (dev.db) para um arquivo único e consistente,
 * pronto para ser copiado para a VPS como prod.db.
 *
 * Uso (a partir da raiz do projeto ou da pasta server):
 *   npx tsx server/scripts/export-local-db.ts
 *   cd server && npx tsx scripts/export-local-db.ts
 *
 * Gera: server/prisma/migracao.db
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sempre resolve para server/prisma/migracao.db, independente do CWD
const PRISMA_DIR = path.resolve(__dirname, '..', 'prisma');

const prisma = new PrismaClient();

async function main() {
  const outPath = path.join(PRISMA_DIR, 'migracao.db');
  const outSqlitePath = outPath.split(path.sep).join('/');

  if (fs.existsSync(outPath)) {
    fs.unlinkSync(outPath);
    console.log('Arquivo anterior removido.');
  }

  // Consolida o WAL no arquivo principal antes de copiar
  await prisma.$queryRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);');

  // VACUUM INTO gera uma cópia limpa, sem depender do arquivo -wal
  await prisma.$executeRawUnsafe(`VACUUM INTO '${outSqlitePath}';`);

  await prisma.$disconnect();

  const size = fs.statSync(outPath).size;
  console.log(`✔ Banco exportado: ${outPath}`);
  console.log(`  Tamanho: ${(size / 1024).toFixed(0)} KB`);
  console.log('');
  console.log('Agora envie para a VPS:');
  console.log('  scp server/prisma/migracao.db ubuntu@IP_DO_TAILSCALE:/tmp/prod.db');
  console.log('');
  console.log('Na VPS:');
  console.log('  pm2 stop my-life360-server');
  console.log('  cp /tmp/prod.db ~/my-life360/server/prisma/prod.db');
  console.log('  pm2 start my-life360-server');
}

main().catch((err) => {
  console.error('Falha ao exportar o banco:', err);
  process.exit(1);
});
