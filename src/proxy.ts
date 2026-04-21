import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DASHBOARD_ROUTE_PREFIX = "/dashboard";
const LOGIN_ROUTE = "/auth/login";
const SESSION_COOKIE_NAMES = ["better-auth.session_token", "__Secure-better-auth.session_token"];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((cookieName) => Boolean(request.cookies.get(cookieName)?.value));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = hasSessionCookie(request);

  if (pathname.startsWith(DASHBOARD_ROUTE_PREFIX) && !hasSession) {
    const loginUrl = new URL(LOGIN_ROUTE, request.url);
    loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/:path*"],
};
