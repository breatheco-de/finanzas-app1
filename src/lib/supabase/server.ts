/**
 * Compat: antes era el cliente Supabase SSR.
 * Fase 3 — delega a Postgres Railway con filtro por user de Auth.js.
 */
import { createDataClient, type DataClient } from "@/lib/db/data-client";
import { getAppUser } from "@/lib/session";

export async function createClient(): Promise<DataClient> {
  const user = await getAppUser();
  if (!user) {
    throw new Error("No autenticado");
  }
  return createDataClient(user.id);
}
