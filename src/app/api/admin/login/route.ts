import { NextResponse } from "next/server";

import { loginAdmin } from "@/features";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectTo(pathname: string): NextResponse {
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: pathname,
    },
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = getString(formData, "email");
  const password = getString(formData, "password");
  const next = getString(formData, "next");
  const safeNext = next.startsWith("/") ? next : "/admin";

  try {
    await loginAdmin({ email, password });
  } catch {
    return redirectTo(`/admin/login?error=invalid&next=${encodeURIComponent(safeNext)}`);
  }

  return redirectTo(safeNext);
}
