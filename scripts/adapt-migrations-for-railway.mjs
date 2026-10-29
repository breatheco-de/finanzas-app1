#!/usr/bin/env node
/**
 * Adapta supabase/migrations/*.sql → railway/migrations/generated/
 * Reemplaza auth.users → users y auth.uid() → app_current_user_id().
 *
 * Uso: npm run db:adapt-migrations
 * Luego aplicar en orden: 000 → generated/001 → 002_schema_missing → generated/004+
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcDir = path.join(root, "supabase", "migrations");
const outDir = path.join(root, "railway", "migrations", "generated");

fs.mkdirSync(outDir, { recursive: true });

const files = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let count = 0;
for (const file of files) {
  const raw = fs.readFileSync(path.join(srcDir, file), "utf8");
  const adapted = raw
    .replace(/auth\.uid\s*\(\s*\)/gi, "app_current_user_id()")
    .replace(/REFERENCES\s+auth\.users\s*\(\s*id\s*\)/gi, "REFERENCES users(id)")
    .replace(/auth\.users/gi, "users");

  const leftover = adapted.match(/\bauth\./gi);
  if (leftover) {
    console.warn(`⚠ quedan ${leftover.length} referencia(s) auth.* en ${file}`);
  }

  const header =
    `-- AUTO-GENERADO por scripts/adapt-migrations-for-railway.mjs\n` +
    `-- Fuente: supabase/migrations/${file}\n` +
    `-- NO editar a mano — regenerar con npm run db:adapt-migrations.\n\n`;

  fs.writeFileSync(path.join(outDir, file), header + adapted);
  count++;
}

const readme = `# Migraciones adaptadas para Railway Postgres

Generadas desde \`supabase/migrations/\`. No editar a mano.

## Orden de aplicación

1. \`../000_bootstrap.sql\` — users + \`app_current_user_id()\`
2. \`001_initial_schema.sql\` (este folder)
3. \`../002_schema_missing.sql\` — tablas que solo existían en Supabase vivo
4. El resto de este folder en orden (\`004\` … \`030\`)

\`\`\`bash
npm run db:adapt-migrations
\`\`\`
`;

fs.writeFileSync(path.join(outDir, "README.md"), readme);
console.log(`OK: ${count} migraciones → railway/migrations/generated/`);
