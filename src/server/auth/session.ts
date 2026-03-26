import { cookies } from "next/headers";

import { getAuthSecret, ADMIN_SESSION_MAX_AGE_SECONDS } from "./config";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionClaims,
  signAdminSessionToken,
  verifyAdminSessionToken,
} from "./token";
import type { AdminSession } from "../../features/auth/types";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;

export async function readAdminSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? null;
}

export async function createAdminSessionToken(session: AdminSession): Promise<string> {
  const claims = createAdminSessionClaims(
    { userId: session.userId, email: session.email },
    ADMIN_SESSION_MAX_AGE_SECONDS,
  );

  return signAdminSessionToken(claims, getAuthSecret());
}

export async function setAdminSessionCookie(session: AdminSession): Promise<void> {
  const cookieStore = await cookies();
  const token = await createAdminSessionToken(session);

  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    ...cookieOptions,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function readAdminSession(): Promise<AdminSession | null> {
  const token = await readAdminSessionToken();
  if (!token) {
    return null;
  }

  const claims = await verifyAdminSessionToken(token, getAuthSecret());
  if (!claims) {
    return null;
  }

  return {
    userId: claims.sub,
    email: claims.email,
    issuedAt: new Date(claims.iat * 1000).toISOString(),
  };
}
