/**
 * BetterAuth configuration file
 * This file will be extended with:
 * - Auth instance setup
 * - Strategy configuration (email/password)
 * - Database adapter setup
 */

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

// TODO: Initialize BetterAuth instance here in Task 4
