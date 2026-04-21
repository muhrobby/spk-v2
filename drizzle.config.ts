import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL ?? "mysql://root:password@localhost:3306/spk";

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
