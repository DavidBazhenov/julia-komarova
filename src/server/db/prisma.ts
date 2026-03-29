import { PrismaClient } from '@prisma/client/index';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function isBuildProcess(): boolean {
  return process.argv.some((arg) => arg === 'build' || arg.endsWith('/build'));
}

export function shouldBypassDatabase(): boolean {
  if (process.env.SKIP_DATABASE_DURING_BUILD === '1' || isBuildProcess()) {
    return true;
  }

  return false;
}

export function markDatabaseUnavailable(): void {
  // Intentionally a no-op in runtime. A transient read error should not suppress
  // unrelated follow-up requests for the next 30 seconds.
}

export function markDatabaseHealthy(): void {
  // No-op for compatibility with existing call sites.
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
