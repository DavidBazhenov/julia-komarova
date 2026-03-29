import { getOptionalEnv, getRequiredEnv } from "../config/env";

export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function getAuthSecret(): string {
  return getRequiredEnv("AUTH_SECRET");
}

export function getAdminEmail(): string | null {
  const value = getOptionalEnv("ADMIN_EMAIL", "").trim().toLowerCase();
  return value.length > 0 ? value : null;
}

export function getAdminPassword(): string | null {
  const value = getOptionalEnv("ADMIN_PASSWORD", "").trim();
  return value.length > 0 ? value : null;
}
