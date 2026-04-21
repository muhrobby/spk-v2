import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

const LOGIN_ROUTE = "/auth/login";
const DASHBOARD_ROUTE = "/dashboard";

export async function getAuthSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireAuthSession(redirectTo = LOGIN_ROUTE) {
  const session = await getAuthSession();

  if (!session) {
    redirect(redirectTo);
  }

  return session;
}

export async function redirectIfAuthenticated(redirectTo = DASHBOARD_ROUTE) {
  const session = await getAuthSession();
  if (session) {
    redirect(redirectTo);
  }
}
