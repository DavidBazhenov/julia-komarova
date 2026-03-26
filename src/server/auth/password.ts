import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, derived] = storedHash.split(':');
  if (!salt || !derived) return false;

  const actual = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(derived, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
