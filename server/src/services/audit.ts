import { prisma } from '../db.js';

// Retenção do log de acessos (dias)
const LOG_RETENTION_DAYS = Math.max(parseInt(process.env.ACCESS_LOG_RETENTION_DAYS || '30', 10) || 30, 1);

// Rotas que não geram ruído no log de auditoria
const IGNORED_PATH_PREFIXES = ['/api/health'];
// Assets estáticos e o próprio log não poluem a auditoria
const IGNORED_STATIC_EXTENSIONS = [
  '.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp', '.gif',
  '.woff', '.woff2', '.ttf', '.map', '.json', '.html', '.webmanifest',
];

export interface AccessLogEntry {
  userId?: string | null;
  userName?: string | null;
  method: string;
  path: string;
  statusCode: number;
  ip?: string | null;
  userAgent?: string | null;
  durationMs?: number | null;
}

function shouldLog(pathname: string, statusCode: number): boolean {
  if (IGNORED_PATH_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  // Só interessa o tráfego de API (o resto é estático e não é superfície de ataque relevante)
  if (!pathname.startsWith('/api/')) return false;
  // Uploads servidos estaticamente
  const lower = pathname.toLowerCase();
  if (IGNORED_STATIC_EXTENSIONS.some((ext) => lower.endsWith(ext))) return false;
  // Telemetria bem-sucedida chega a cada poucos segundos por aparelho: só registramos falhas
  if (pathname.startsWith('/api/telemetry') && statusCode < 400) return false;
  return true;
}

/**
 * Grava uma entrada de auditoria. Nunca lança: falha de auditoria não pode
 * derrubar a requisição do usuário.
 */
export async function recordAccess(entry: AccessLogEntry): Promise<void> {
  try {
    const pathname = entry.path.split('?')[0] || entry.path;
    if (!shouldLog(pathname, entry.statusCode)) return;

    // Trunca o path para evitar linhas gigantes (tokens nunca devem virar log)
    const safePath = pathname.slice(0, 300);

    await prisma.accessLog.create({
      data: {
        userId: entry.userId || null,
        userName: entry.userName || null,
        method: entry.method.slice(0, 10),
        path: safePath,
        statusCode: entry.statusCode,
        ip: entry.ip ? String(entry.ip).slice(0, 60) : null,
        userAgent: entry.userAgent ? String(entry.userAgent).slice(0, 250) : null,
        durationMs: entry.durationMs != null ? Math.round(entry.durationMs) : null,
      },
    });
  } catch (err) {
    console.error('[Audit] Falha ao gravar log de acesso:', err);
  }
}

/**
 * Lista os acessos mais recentes, com filtros opcionais.
 */
export async function listAccessLogs(options: {
  limit?: number;
  userId?: string;
  statusCode?: number;
  onlyErrors?: boolean;
} = {}) {
  const take = Math.min(Math.max(options.limit ?? 100, 1), 500);

  const where: any = {};
  if (options.userId) where.userId = options.userId;
  if (options.statusCode) where.statusCode = options.statusCode;
  if (options.onlyErrors) where.statusCode = { gte: 400 };

  return prisma.accessLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
  });
}

/**
 * Remove registros mais antigos que a retenção configurada.
 */
export async function pruneAccessLogs(): Promise<number> {
  const cutoff = new Date(Date.now() - LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const result = await prisma.accessLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  if (result.count > 0) {
    console.log(`🧹 ${result.count} registro(s) de auditoria com mais de ${LOG_RETENTION_DAYS} dias removido(s).`);
  }
  return result.count;
}

/**
 * Resumo agregado para o painel: total de acessos, erros e últimos logins.
 */
export async function getAccessSummary() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [total24h, errors24h, failedLogins24h] = await Promise.all([
    prisma.accessLog.count({ where: { createdAt: { gte: since } } }),
    prisma.accessLog.count({ where: { createdAt: { gte: since }, statusCode: { gte: 400 } } }),
    prisma.accessLog.count({
      where: { createdAt: { gte: since }, path: { contains: '/api/auth/login' }, statusCode: { gte: 400 } },
    }),
  ]);

  return {
    total24h,
    errors24h,
    failedLogins24h,
    retentionDays: LOG_RETENTION_DAYS,
  };
}

export const auditConfig = { retentionDays: LOG_RETENTION_DAYS };