/**
 * Database environment configuration
 * Reads and validates DATABASE_URL from environment variables
 */

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL environment variable. " +
        "Please set it in your .env file. " +
        "Format: mysql://user:password@host:port/database",
    );
  }
  return url;
}

/**
 * Validates that required database environment variables are set
 */
export function validateDatabaseConfig(): void {
  try {
    getDatabaseUrl();
  } catch (error) {
    console.error("❌ Database configuration error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
