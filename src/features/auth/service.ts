import {
  getAdminEmail,
  getAdminPassword,
} from "../../server/auth/config";
import {
  clearAdminSessionCookie,
  setAdminSessionCookie,
} from "../../server/auth/session";
import type { AdminCredentials, AdminSession } from "./types";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

type ResolvedAdminRecord = {
  id: string;
  email: string;
  password: string;
  isActive: boolean;
};

function resolveAdminRecord(email: string): ResolvedAdminRecord | null {
  const normalizedEmail = normalizeEmail(email);
  const fallbackEmail = getAdminEmail();
  const fallbackPassword = getAdminPassword();

  if (
    fallbackEmail &&
    fallbackPassword &&
    fallbackEmail === normalizedEmail
  ) {
    return {
      id: "env-admin",
      email: fallbackEmail,
      password: fallbackPassword,
      isActive: true,
    };
  }

  return null;
}

export async function loginAdmin(credentials: AdminCredentials): Promise<AdminSession> {
  const email = normalizeEmail(credentials.email);
  const password = credentials.password;
  const adminUser = resolveAdminRecord(email);

  if (!adminUser || !adminUser.isActive) {
    throw new Error("Invalid admin credentials");
  }

  const isValidPassword = password === adminUser.password;
  if (!isValidPassword) {
    throw new Error("Invalid admin credentials");
  }

  const session: AdminSession = {
    userId: adminUser.id,
    email: adminUser.email,
    issuedAt: new Date().toISOString(),
  };

  await setAdminSessionCookie(session);

  return session;
}

export async function logoutAdmin(): Promise<void> {
  await clearAdminSessionCookie();
}
