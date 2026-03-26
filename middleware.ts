import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { routing } from "./src/i18n/routing";
import { getAuthSecret } from "./src/server/auth/config";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "./src/server/auth/token";

const ADMIN_LOGIN_PATH = "/admin/login";
const EXCLUDED_PREFIXES = ["/_next", "/api"];
const EXCLUDED_PATHS = new Set(["/icon", "/robots.txt", "/sitemap.xml", "/favicon.ico"]);
const intlMiddleware = createIntlMiddleware(routing);

function shouldSkipIntl(pathname: string): boolean {
  if (EXCLUDED_PATHS.has(pathname)) {
    return true;
  }

  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return /\.[^/]+$/.test(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    if (pathname === ADMIN_LOGIN_PATH) {
      return NextResponse.next();
    }

    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const claims = await verifyAdminSessionToken(token, getAuthSecret());
    if (!claims) {
      const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
      loginUrl.searchParams.set("next", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(ADMIN_SESSION_COOKIE);
      return response;
    }

    return NextResponse.next();
  }

  if (shouldSkipIntl(pathname)) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
