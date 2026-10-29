/**
 * Cliente de datos compatible con el subset de supabase-js que usa esta app.
 * Traduce from/select/insert/update/delete/rpc → Postgres (Railway).
 * Siempre filtra por user_id en tablas que lo tienen (reemplazo de RLS).
 *
 * Solo server-side. NUNCA al browser (lleva DATABASE_URL).
 */
import { callRpc } from "@/lib/db/rpc";
import { getSql } from "@/lib/db/sql";

const USER_SCOPED = new Set([
  "accounts",
  "categories",
  "expenses",
  "incomes",
  "assets",
  "funds",
  "holdings",
  "account_earmarks",
  "account_transfers",
  "savings_goals",
  "savings_contributions",
  "income_distribution_rules",
  "share_groups",
]);

/** Compat supabase: data es any a propósito (mismas call sites). */
export type QueryResult = {
  data: any;
  error: { message: string; code?: string } | null;
  count?: number | null;
};

type Filter =
  | { type: "eq"; col: string; val: unknown }
  | { type: "neq"; col: string; val: unknown }
  | { type: "gte"; col: string; val: unknown }
  | { type: "lte"; col: string; val: unknown }
  | { type: "gt"; col: string; val: unknown }
  | { type: "lt"; col: string; val: unknown }
  | { type: "in"; col: string; val: unknown[] }
  | { type: "is"; col: string; val: null | boolean }
  | { type: "not_is"; col: string; val: null };

function quoteIdent(id: string) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(id)) throw new Error(`Columna inválida: ${id}`);
  return `"${id}"`;
}

function parseSelect(select: string): {
  columns: string;
  embeds: { alias: string; table: string; cols: string; inner: boolean; fkHint?: string }[];
} {
  // Soporta: "*", "a, b", "a, categories(name, icon)", "expenses!inner(currency)",
  // "accounts!holdings_account_id_fkey(name)", "account:accounts!account_id(name)"
  const embeds: {
    alias: string;
    table: string;
    cols: string;
    inner: boolean;
    fkHint?: string;
  }[] = [];
  let rest = select.trim();
  const embedRe =
    /(?:(\w+)\s*:\s*)?(\w+)(!inner)?(?:!(\w+))?\(([^)]*)\)/g;
  rest = rest.replace(embedRe, (_m, alias, table, inner, fkHint, cols) => {
    embeds.push({
      alias: alias ?? table,
      table,
      cols: cols.trim() || "*",
      inner: Boolean(inner),
      fkHint: fkHint || undefined,
    });
    return "";
  });
  const columns =
    rest
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ") || "*";
  return { columns, embeds };
}

/** FK heurística padre → hijo para embeds comunes */
function embedFk(
  parentTable: string,
  embedTable: string,
  fkHint?: string
): { parentCol: string; childCol: string; direction: "child-of-parent" | "parent-of-child" } {
  // hint estilo PostgREST: holdings_account_id_fkey → account_id en holdings apunta a accounts
  if (fkHint === "holdings_account_id_fkey") {
    return { parentCol: "id", childCol: "account_id", direction: "parent-of-child" };
  }
  if (fkHint === "account_id" || embedTable === "accounts") {
    // expense.account_id → accounts, o income.account_id
    return { parentCol: "account_id", childCol: "id", direction: "child-of-parent" };
  }
  if (embedTable === "categories") {
    return { parentCol: "category_id", childCol: "id", direction: "child-of-parent" };
  }
  if (embedTable === "expenses") {
    // expense_participants → expenses
    return { parentCol: "expense_id", childCol: "id", direction: "child-of-parent" };
  }
  if (parentTable === "installments" && embedTable === "expenses") {
    return { parentCol: "expense_id", childCol: "id", direction: "child-of-parent" };
  }
  // default: parent has embedTable_id
  return {
    parentCol: `${embedTable.replace(/s$/, "")}_id`,
    childCol: "id",
    direction: "child-of-parent",
  };
}

class QueryBuilder {
  private filters: Filter[] = [];
  private orGroups: Filter[][] = [];
  private orderClauses: { col: string; asc: boolean }[] = [];
  private limitN: number | null = null;
  private wantSingle = false;
  private wantMaybeSingle = false;
  private selectStr = "*";
  private countOnly = false;
  private insertPayload: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private updatePayload: Record<string, unknown> | null = null;
  private deleteMode = false;
  private upsertPayload: Record<string, unknown> | Record<string, unknown>[] | null = null;
  private upsertOnConflict: string | null = null;

  constructor(
    private userId: string,
    private table: string
  ) {
    if (!/^[a-z_][a-z0-9_]*$/i.test(table)) {
      throw new Error(`Tabla inválida: ${table}`);
    }
  }

  select(columns = "*", opts?: { count?: string; head?: boolean }) {
    this.selectStr = columns;
    if (opts?.head && opts?.count) this.countOnly = true;
    return this;
  }

  insert(payload: object | object[]) {
    this.insertPayload = payload as Record<string, unknown> | Record<string, unknown>[];
    return this;
  }

  update(payload: object) {
    this.updatePayload = payload as Record<string, unknown>;
    return this;
  }

  upsert(
    payload: Record<string, unknown> | Record<string, unknown>[],
    opts?: { onConflict?: string }
  ) {
    this.upsertPayload = payload;
    this.upsertOnConflict = opts?.onConflict ?? null;
    return this;
  }

  delete() {
    this.deleteMode = true;
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ type: "eq", col, val });
    return this;
  }
  neq(col: string, val: unknown) {
    this.filters.push({ type: "neq", col, val });
    return this;
  }
  gte(col: string, val: unknown) {
    this.filters.push({ type: "gte", col, val });
    return this;
  }
  lte(col: string, val: unknown) {
    this.filters.push({ type: "lte", col, val });
    return this;
  }
  gt(col: string, val: unknown) {
    this.filters.push({ type: "gt", col, val });
    return this;
  }
  lt(col: string, val: unknown) {
    this.filters.push({ type: "lt", col, val });
    return this;
  }
  in(col: string, val: unknown[]) {
    this.filters.push({ type: "in", col, val });
    return this;
  }
  is(col: string, val: null | boolean) {
    this.filters.push({ type: "is", col, val });
    return this;
  }
  not(col: string, op: string, val: unknown) {
    if (op === "is" && val === null) {
      this.filters.push({ type: "not_is", col, val: null });
    } else {
      throw new Error(`not(${op}) no soportado todavía`);
    }
    return this;
  }

  /** PostgREST: `or('a.eq.x,b.eq.y')` */
  or(expr: string) {
    const parts = expr.split(",").map((p) => p.trim()).filter(Boolean);
    const group: Filter[] = [];
    for (const part of parts) {
      const m = part.match(/^(\w+)\.(eq|neq|gte|lte|gt|lt|is)\.(.*)$/);
      if (!m) throw new Error(`or() no parsea: ${part}`);
      const [, col, op, raw] = m;
      const val = raw === "null" ? null : raw;
      if (op === "is") group.push({ type: "is", col, val: val as null });
      else group.push({ type: op as "eq", col, val });
    }
    this.orGroups.push(group);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderClauses.push({ col, asc: opts?.ascending !== false });
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  single() {
    this.wantSingle = true;
    return this;
  }
  maybeSingle() {
    this.wantMaybeSingle = true;
    return this;
  }

  private filterSql(
    f: Filter,
    i: { n: number },
    values: unknown[]
  ): string {
    const c = quoteIdent(f.col);
    switch (f.type) {
      case "eq":
        values.push(f.val);
        return `${c} = $${i.n++}`;
      case "neq":
        values.push(f.val);
        return `${c} <> $${i.n++}`;
      case "gte":
        values.push(f.val);
        return `${c} >= $${i.n++}`;
      case "lte":
        values.push(f.val);
        return `${c} <= $${i.n++}`;
      case "gt":
        values.push(f.val);
        return `${c} > $${i.n++}`;
      case "lt":
        values.push(f.val);
        return `${c} < $${i.n++}`;
      case "in": {
        const ph = f.val.map(() => `$${i.n++}`).join(", ");
        values.push(...f.val);
        return `${c} IN (${ph})`;
      }
      case "is":
        if (f.val === null) return `${c} IS NULL`;
        return `${c} IS ${f.val ? "TRUE" : "FALSE"}`;
      case "not_is":
        return `${c} IS NOT NULL`;
    }
  }

  private buildWhere(startIdx = 1): { sql: string; values: unknown[]; next: number } {
    const values: unknown[] = [];
    const parts: string[] = [];
    const i = { n: startIdx };

    if (USER_SCOPED.has(this.table)) {
      const hasUser = this.filters.some((f) => f.col === "user_id");
      if (!hasUser) {
        parts.push(`${quoteIdent("user_id")} = $${i.n++}`);
        values.push(this.userId);
      }
    }

    for (const f of this.filters) {
      parts.push(this.filterSql(f, i, values));
    }
    for (const group of this.orGroups) {
      const ors = group.map((f) => this.filterSql(f, i, values));
      parts.push(`(${ors.join(" OR ")})`);
    }

    return {
      sql: parts.length ? ` WHERE ${parts.join(" AND ")}` : "",
      values,
      next: i.n,
    };
  }

  then<TResult1 = QueryResult, TResult2 = never>(
    onfulfilled?: ((value: QueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private async execute(): Promise<QueryResult> {
    const sql = getSql();
    try {
      return await sql.begin(async (tx) => {
        await tx`SELECT set_config('app.current_user_id', ${this.userId}, true)`;

        if (this.insertPayload) {
          const rows = Array.isArray(this.insertPayload)
            ? this.insertPayload
            : [this.insertPayload];
          const enriched = rows.map((r) => {
            if (USER_SCOPED.has(this.table) && r.user_id == null) {
              return { ...r, user_id: this.userId };
            }
            return r;
          });
          const cols = Object.keys(enriched[0] ?? {});
          if (cols.length === 0) return { data: null, error: { message: "insert vacío" } };
          const colSql = cols.map(quoteIdent).join(", ");
          const allValues: unknown[] = [];
          const valueGroups: string[] = [];
          let idx = 1;
          for (const row of enriched) {
            const ph = cols.map((c) => {
              allValues.push(row[c] ?? null);
              return `$${idx++}`;
            });
            valueGroups.push(`(${ph.join(", ")})`);
          }
          const result = await tx.unsafe(
            `INSERT INTO ${quoteIdent(this.table)} (${colSql}) VALUES ${valueGroups.join(", ")} RETURNING *`,
            allValues as never[]
          );
          const data = Array.isArray(this.insertPayload) ? result : result[0] ?? null;
          if (this.wantSingle) {
            if (!result[0]) return { data: null, error: { message: "No rows" } };
            return { data: result[0], error: null };
          }
          return { data, error: null };
        }

        if (this.updatePayload) {
          const cols = Object.keys(this.updatePayload);
          let idx = 1;
          const sets = cols.map((c) => `${quoteIdent(c)} = $${idx++}`);
          const values: unknown[] = cols.map((c) => this.updatePayload![c]);
          const where = this.buildWhere(idx);
          const result = await tx.unsafe(
            `UPDATE ${quoteIdent(this.table)} SET ${sets.join(", ")}${where.sql} RETURNING *`,
            [...values, ...where.values] as never[]
          );
          return { data: result, error: null };
        }

        if (this.upsertPayload) {
          const rows = Array.isArray(this.upsertPayload)
            ? this.upsertPayload
            : [this.upsertPayload];
          const out = [];
          for (const row of rows) {
            const enriched =
              USER_SCOPED.has(this.table) && row.user_id == null
                ? { ...row, user_id: this.userId }
                : row;
            const cols = Object.keys(enriched);
            const colSql = cols.map(quoteIdent).join(", ");
            const ph = cols.map((_, i) => `$${i + 1}`).join(", ");
            const vals = cols.map((c) => enriched[c] ?? null);
            const conflictCols =
              this.upsertOnConflict?.split(",").map((c) => c.trim()).filter(Boolean) ??
              (enriched.id ? ["id"] : null);
            if (conflictCols?.length) {
              const conflictSql = conflictCols.map(quoteIdent).join(", ");
              const updates = cols
                .filter((c) => !conflictCols.includes(c))
                .map((c) => `${quoteIdent(c)} = EXCLUDED.${quoteIdent(c)}`)
                .join(", ");
              const r = await tx.unsafe(
                `INSERT INTO ${quoteIdent(this.table)} (${colSql}) VALUES (${ph})
                 ON CONFLICT (${conflictSql}) DO UPDATE SET ${updates} RETURNING *`,
                vals as never[]
              );
              out.push(r[0]);
            } else {
              const r = await tx.unsafe(
                `INSERT INTO ${quoteIdent(this.table)} (${colSql}) VALUES (${ph}) RETURNING *`,
                vals as never[]
              );
              out.push(r[0]);
            }
          }
          return {
            data: Array.isArray(this.upsertPayload) ? out : out[0],
            error: null,
          };
        }

        if (this.deleteMode) {
          const where = this.buildWhere(1);
          if (!where.sql) {
            return { data: null, error: { message: "DELETE sin filtro rechazado" } };
          }
          await tx.unsafe(
            `DELETE FROM ${quoteIdent(this.table)}${where.sql}`,
            where.values as never[]
          );
          return { data: null, error: null };
        }

        // SELECT
        const where = this.buildWhere(1);

        if (this.countOnly) {
          const countRows = await tx.unsafe(
            `SELECT COUNT(*)::int AS c FROM ${quoteIdent(this.table)}${where.sql}`,
            where.values as never[]
          );
          const count = Number((countRows[0] as unknown as { c: number })?.c ?? 0);
          return { data: null, error: null, count };
        }

        const { columns, embeds } = parseSelect(this.selectStr);
        const colSql =
          columns === "*"
            ? "*"
            : columns
                .split(",")
                .map((c) => quoteIdent(c.trim()))
                .join(", ");

        let q = `SELECT ${colSql} FROM ${quoteIdent(this.table)}${where.sql}`;
        if (this.orderClauses.length) {
          q +=
            " ORDER BY " +
            this.orderClauses
              .map((o) => `${quoteIdent(o.col)} ${o.asc ? "ASC" : "DESC"}`)
              .join(", ");
        }
        if (this.limitN != null) q += ` LIMIT ${Number(this.limitN)}`;

        let data = (await tx.unsafe(q, where.values as never[])) as Record<
          string,
          unknown
        >[];

        // Embeds: N+1 simple (suficiente para single-user)
        for (const emb of embeds) {
          const fk = embedFk(this.table, emb.table, emb.fkHint);
          if (fk.direction === "child-of-parent") {
            // fila padre tiene parentCol (ej category_id) → buscar emb.table.id
            const ids = [
              ...new Set(
                data
                  .map((r) => r[fk.parentCol])
                  .filter((v) => v != null)
                  .map(String)
              ),
            ];
            let childRows: Record<string, unknown>[] = [];
            if (ids.length) {
              const ph = ids.map((_, i) => `$${i + 1}`).join(", ");
              const childCols =
                emb.cols === "*"
                  ? "*"
                  : emb.cols
                      .split(",")
                      .map((c) => quoteIdent(c.trim()))
                      .concat([quoteIdent("id")])
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .join(", ");
              childRows = (await tx.unsafe(
                `SELECT ${childCols} FROM ${quoteIdent(emb.table)} WHERE ${quoteIdent(fk.childCol)} IN (${ph})`,
                ids as never[]
              )) as Record<string, unknown>[];
            }
            const byId = new Map(childRows.map((c) => [String(c.id), c]));
            data = data
              .map((r) => {
                const child = r[fk.parentCol] != null ? byId.get(String(r[fk.parentCol])) : null;
                if (emb.inner && !child) return null;
                // strip id-only helper cols if needed — leave as object
                const nested = child
                  ? Object.fromEntries(
                      Object.entries(child).filter(([k]) =>
                        emb.cols === "*" ? true : emb.cols.split(",").map((x) => x.trim()).includes(k) || k === "id"
                      )
                    )
                  : null;
                return { ...r, [emb.alias]: nested };
              })
              .filter(Boolean) as Record<string, unknown>[];
          } else {
            // parent-of-child: ej holdings.account_id → accounts (accounts!holdings_account_id_fkey)
            // data is holdings; want accounts nested where accounts.id = holdings.account_id
            const ids = [
              ...new Set(
                data
                  .map((r) => r["account_id"])
                  .filter((v) => v != null)
                  .map(String)
              ),
            ];
            let childRows: Record<string, unknown>[] = [];
            if (ids.length) {
              const ph = ids.map((_, i) => `$${i + 1}`).join(", ");
              const childCols =
                emb.cols === "*"
                  ? "*"
                  : emb.cols
                      .split(",")
                      .map((c) => quoteIdent(c.trim()))
                      .concat([quoteIdent("id")])
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .join(", ");
              childRows = (await tx.unsafe(
                `SELECT ${childCols} FROM ${quoteIdent(emb.table)} WHERE id IN (${ph})`,
                ids as never[]
              )) as Record<string, unknown>[];
            }
            const byId = new Map(childRows.map((c) => [String(c.id), c]));
            data = data.map((r) => ({
              ...r,
              [emb.alias]:
                r["account_id"] != null ? byId.get(String(r["account_id"])) ?? null : null,
            }));
          }
        }

        if (this.wantSingle) {
          if (data.length === 0) return { data: null, error: { message: "No rows" } };
          if (data.length > 1) return { data: null, error: { message: "Multiple rows" } };
          return { data: data[0], error: null };
        }
        if (this.wantMaybeSingle) {
          return { data: data[0] ?? null, error: null };
        }
        return { data, error: null };
      });
    } catch (e) {
      return {
        data: null,
        error: { message: e instanceof Error ? e.message : String(e) },
      };
    }
  }
}

export type DataClient = {
  from: (table: string) => QueryBuilder;
  rpc: <T = unknown>(
    fnName: string,
    args?: Record<string, unknown>
  ) => Promise<{ data: T | null; error: { message: string; code?: string } | null }>;
};

export function createDataClient(userId: string): DataClient {
  const sql = getSql();
  return {
    from(table: string) {
      return new QueryBuilder(userId, table);
    },
    rpc<T = unknown>(fnName: string, args: Record<string, unknown> = {}) {
      return callRpc<T>(sql, userId, fnName, args);
    },
  };
}
