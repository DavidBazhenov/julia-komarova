import { getOptionalEnv, getRequiredEnv } from "../config/env";

export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function getAuthSecret(): string {
  return getRequiredEnv("AUTH_SECRET");
}

export function getFallbackAdminEmail(): string | null {
  const value = getOptionalEnv("ADMIN_EMAIL", "").trim().toLowerCase();
  return value.length > 0 ? value : null;
}

export function getFallbackAdminPasswordHash(): string | null {
  const value = getOptionalEnv("ADMIN_PASSWORD_HASH", "").trim();
  return value.length > 0 ? value : null;
}
