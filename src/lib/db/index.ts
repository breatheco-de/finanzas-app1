/**
 * Cliente Postgres (Railway) vía Drizzle + data-client (compat PostgREST).
 * Solo server-side. NUNCA importar desde Client Components.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import { getSql } from "@/lib/db/sql";
import * as schema from "./schema";

export { getSql } from "@/lib/db/sql";
export { createDataClient } from "@/lib/db/data-client";
export type { DataClient } from "@/lib/db/data-client";

export function getDb() {
  return drizzle(getSql(), { schema });
}

export type Db = ReturnType<typeof getDb>;

export async function pingDatabase(): Promise<boolean> {
  const sql = getSql();
  const rows = await sql`SELECT 1 AS ok`;
  return rows[0]?.ok === 1;
}

export * from "./schema";
