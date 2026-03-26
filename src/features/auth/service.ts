import { prisma } from "../../server/db";
import {
  getFallbackAdminEmail,
  getFallbackAdminPasswordHash,
} from "../../server/auth/config";
import { verifyPassword } from "../../server/auth/password";
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
  passwordHash: string;
  isActive: boolean;
};

async function resolveAdminRecord(email: string): Promise<ResolvedAdminRecord | null> {
  const normalizedEmail = normalizeEmail(email);
  const dbUser = await prisma.adminUser.findUnique({
    where: { email: normalizedEmail },
  });

  if (dbUser) {
    return {
      id: dbUser.id,
      email: dbUser.email,
      passwordHash: dbUser.passwordHash,
      isActive: dbUser.isActive,
    };
  }

  const fallbackEmail = getFallbackAdminEmail();
  const fallbackPasswordHash = getFallbackAdminPasswordHash();

  if (
    fallbackEmail &&
    fallbackPasswordHash &&
    fallbackEmail === normalizedEmail
  ) {
    return {
      id: "env-admin",
      email: fallbackEmail,
      passwordHash: fallbackPasswordHash,
      isActive: true,
    };
  }

  return null;
}

export async function loginAdmin(credentials: AdminCredentials): Promise<AdminSession> {
  const email = normalizeEmail(credentials.email);
  const password = credentials.password;
  const adminUser = await resolveAdminRecord(email);

  if (!adminUser || !adminUser.isActive) {
    throw new Error("Invalid admin credentials");
  }

  const isValidPassword = verifyPassword(password, adminUser.passwordHash);
  if (!isValidPassword) {
    throw new Error("Invalid admin credentials");
  }

  const session: AdminSession = {
    userId: adminUser.id,
    email: adminUser.email,
    issuedAt: new Date().toISOString(),
  };

  await setAdminSessionCookie(session);

  if (adminUser.id !== "env-admin") {
    await prisma.adminUser.update({
      where: { id: adminUser.id },
      data: { lastLoginAt: new Date() },
    });
  }

  return session;
}

export async function logoutAdmin(): Promise<void> {
  await clearAdminSessionCookie();
}
