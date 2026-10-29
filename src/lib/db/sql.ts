import postgres from "postgres";

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Falta DATABASE_URL. En Railway: Variables del Postgres. " +
        "En local: .env.local (sin NEXT_PUBLIC_)."
    );
  }
  return url;
}

const globalForDb = globalThis as unknown as {
  __finanzasSql?: ReturnType<typeof postgres>;
};

/** Conexión postgres.js compartida (server-only). */
export function getSql() {
  if (!globalForDb.__finanzasSql) {
    globalForDb.__finanzasSql = postgres(requireDatabaseUrl(), {
      max: 5,
      prepare: false,
    });
  }
  return globalForDb.__finanzasSql;
}
