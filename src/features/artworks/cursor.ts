export type CursorPageInput = {
  cursor?: string;
  limit?: number;
};

export function clampLimit(limit: number | undefined, fallback = 12, max = 24): number {
  if (!Number.isFinite(limit ?? NaN)) {
    return fallback;
  }

  const numericLimit = Math.trunc(limit ?? fallback);
  return Math.min(Math.max(numericLimit, 1), max);
}

export function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;

  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = Number.parseInt(decoded, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    return 0;
  }
}
