import { PrismaClient } from '@prisma/client/index';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  databaseBypassUntil?: number;
};

function isBuildProcess(): boolean {
  return process.argv.some((arg) => arg === 'build' || arg.endsWith('/build'));
}

export function shouldBypassDatabase(): boolean {
  if (process.env.SKIP_DATABASE_DURING_BUILD === '1' || isBuildProcess()) {
    return true;
  }

  return Boolean(globalForPrisma.databaseBypassUntil && globalForPrisma.databaseBypassUntil > Date.now());
}

export function markDatabaseUnavailable(cooldownMs = 30_000): void {
  globalForPrisma.databaseBypassUntil = Date.now() + cooldownMs;
}

export function markDatabaseHealthy(): void {
  globalForPrisma.databaseBypassUntil = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
