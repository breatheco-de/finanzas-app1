import type postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

/**
 * Llama una función PL/pgSQL con app.current_user_id (SET LOCAL).
 * Contrato compatible con supabase.rpc → { data, error }.
 */
export async function callRpc<T = unknown>(
  sql: Sql,
  userId: string,
  fnName: string,
  args: Record<string, unknown> = {}
): Promise<{ data: T | null; error: { message: string } | null }> {
  if (!/^[a-z][a-z0-9_]*$/i.test(fnName)) {
    return { data: null, error: { message: `RPC inválida: ${fnName}` } };
  }

  const keys = Object.keys(args);
  for (const k of keys) {
    if (!/^[a-z][a-z0-9_]*$/i.test(k)) {
      return { data: null, error: { message: `Arg RPC inválido: ${k}` } };
    }
  }

  try {
    const rows = await sql.begin(async (tx) => {
      await tx`SELECT set_config('app.current_user_id', ${userId}, true)`;

      if (keys.length === 0) {
        return tx.unsafe(`SELECT ${fnName}() AS result`);
      }

      const placeholders = keys
        .map((k, i) => {
          const v = args[k];
          if (Array.isArray(v)) {
            const asUuid = v.every(
              (x) => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)
            );
            return `${k} := $${i + 1}::${asUuid ? "uuid[]" : "text[]"}`;
          }
          if (v !== null && typeof v === "object") {
            return `${k} := $${i + 1}::jsonb`;
          }
          return `${k} := $${i + 1}`;
        })
        .join(", ");

      const values = keys.map((k) => {
        const v = args[k];
        if (Array.isArray(v)) return v;
        if (v !== null && typeof v === "object") return JSON.stringify(v);
        return v;
      });

      return tx.unsafe(
        `SELECT ${fnName}(${placeholders}) AS result`,
        values as never[]
      );
    });

    const row = rows[0] as { result?: T } | undefined;
    return { data: (row?.result ?? null) as T | null, error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: { message } };
  }
}
