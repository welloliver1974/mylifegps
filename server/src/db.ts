import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Habilita modo WAL (Write-Ahead Logging) no SQLite para alta performance em leituras/escritas concorrentes
export async function initDb() {
  await prisma.$queryRawUnsafe('PRAGMA journal_mode = WAL;');
  await prisma.$queryRawUnsafe('PRAGMA synchronous = NORMAL;');
}
