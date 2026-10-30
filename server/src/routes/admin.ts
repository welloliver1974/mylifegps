import { FastifyInstance } from 'fastify';
import { createBackup, listBackups, pruneOldBackups, backupConfig } from '../services/backup.js';
import {
  listAccessLogs,
  getAccessSummary,
  pruneAccessLogs,
  auditConfig,
} from '../services/audit.js';
import {
  sendWeeklySummaryToAllMembers,
  sendWeeklySummaryToUser,
  getWeeklySummaryStatus,
} from '../services/weeklySummary.js';

/**
 * Só o administrador do círculo pode disparar backup, ver logs e mexer em aparelhos.
 */
function requireAdmin(request: any, reply: any): boolean {
  const user = request.authUser || request.user;
  if (!user) {
    reply.status(401).send({ error: 'Não autenticado.' });
    return false;
  }
  if (user.role !== 'admin') {
    reply.status(403).send({ error: 'Apenas o administrador do círculo pode executar esta ação.' });
    return false;
  }
  return true;
}

export async function adminRoutes(fastify: FastifyInstance) {
  // ---- Backup do banco ----

  fastify.post('/api/admin/backup', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    try {
      const result = await createBackup();
      const filename = result.file.split(/[\\/]/).pop();
      return reply.send({
        success: true,
        backup: {
          file: filename,
          filename,
          path: result.file,
          sizeBytes: result.sizeBytes,
          sizeMb: Number((result.sizeBytes / (1024 * 1024)).toFixed(2)),
          method: result.method,
        },
        config: backupConfig,
        message: 'Backup criado com sucesso.',
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err?.message || 'Falha ao criar backup' });
    }
  });

  fastify.get('/api/admin/backups', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const backups = await listBackups();
    return reply.send({
      backups: backups.map((b) => ({ ...b, sizeMb: Number((b.sizeBytes / (1024 * 1024)).toFixed(2)) })),
      config: backupConfig,
    });
  });

  fastify.post('/api/admin/backups/prune', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const removed = await pruneOldBackups();
    return reply.send({ success: true, removed });
  });

  // ---- Log de acessos ----

  fastify.get('/api/admin/logs', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;

    const query = request.query as any;
    const logs = await listAccessLogs({
      limit: query.limit ? parseInt(query.limit, 10) : 100,
      userId: query.userId,
      statusCode: query.statusCode ? parseInt(query.statusCode, 10) : undefined,
      onlyErrors: query.onlyErrors === 'true',
    });

    return reply.send({ logs, config: auditConfig });
  });

  fastify.get('/api/admin/logs/summary', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const summary = await getAccessSummary();
    return reply.send(summary);
  });

  fastify.post('/api/admin/logs/prune', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const removed = await pruneAccessLogs();
    return reply.send({ success: true, removed });
  });

  // ---- Resumo Semanal Push de Direção (Life360 Weekly Summary - Etapa 10.4) ----

  fastify.get('/api/admin/driving/weekly-summary-status', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const status = getWeeklySummaryStatus();
    return reply.send(status);
  });

  fastify.post('/api/admin/driving/send-weekly-summary', async (request, reply) => {
    if (!requireAdmin(request, reply)) return;
    const { userId, force = true, skipIfNoTrips = false } = (request.body as any) || {};

    try {
      if (userId) {
        const result = await sendWeeklySummaryToUser(userId, { force, skipIfNoTrips });
        return reply.send({
          success: result.success,
          pushedCount: result.pushedCount,
          summary: result.summary,
          message: result.message,
        });
      }

      const result = await sendWeeklySummaryToAllMembers({
        force,
        skipIfNoTrips,
        runType: 'manual',
      });

      return reply.send({
        success: true,
        week: result.week,
        totalUsers: result.totalUsers,
        notifiedCount: result.notifiedCount,
        results: result.results,
        message: `Resumo semanal disparado para ${result.notifiedCount}/${result.totalUsers} membros.`,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({ error: err?.message || 'Falha ao disparar resumo semanal' });
    }
  });
}