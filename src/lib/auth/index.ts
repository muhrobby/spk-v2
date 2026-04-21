import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db, schema } from "@/db";

export function getAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) {
    throw new Error("Missing BETTER_AUTH_SECRET environment variable. Generate one with: openssl rand -hex 32");
  }
  return secret;
}

export function getAuthUrl(): string {
  const url = process.env.BETTER_AUTH_URL;
  if (!url) {
    throw new Error(
      "Missing BETTER_AUTH_URL environment variable. " +
        "Set it to your application base URL (e.g., http://localhost:3000)",
    );
  }
  return url;
}

/**
 * Validates that required auth environment variables are set
 */
export function validateAuthConfig(): void {
  try {
    getAuthSecret();
    getAuthUrl();
  } catch (error) {
    console.error("❌ Auth configuration error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

export const auth = betterAuth({
  baseURL: getAuthUrl(),
  secret: getAuthSecret(),
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  disabledPaths: ["/sign-up/email"],
});
