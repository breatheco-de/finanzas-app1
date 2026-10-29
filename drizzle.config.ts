import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit — introspección / studio contra Railway Postgres.
 * El DDL de producción se aplica con los SQL de railway/migrations/
 * (no usamos drizzle-kit push como fuente de verdad todavía).
 */
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
