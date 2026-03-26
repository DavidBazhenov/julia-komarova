import type { AdminSession } from "../../features/auth/types";

import { readAdminSession } from "./session";

export async function hasAdminSession(): Promise<boolean> {
  return Boolean(await readAdminSession());
}

export async function assertAdminSession(): Promise<AdminSession> {
  const session = await readAdminSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  return session;
}
