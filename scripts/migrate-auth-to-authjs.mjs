#!/usr/bin/env node
/**
 * Reemplaza supabase.auth.getUser() por getAppUser/requireUser en archivos server.
 * Los Client Components se migran a mano (useSession).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function mergeSessionImports(s) {
  const needsRequire = s.includes("requireUser(");
  const needsGet = s.includes("getAppUser(");
  if (!needsRequire && !needsGet) return s;

  // Quitar imports previos de session
  s = s.replace(/import \{[^}]*\} from "@\/lib\/session";\n/g, "");

  const names = [];
  if (needsGet) names.push("getAppUser");
  if (needsRequire) names.push("requireUser");
  const line = `import { ${names.join(", ")} } from "@/lib/session";\n`;

  if (/^["']use server["'];?\n/.test(s)) {
    return s.replace(/^["']use server["'];?\n/, (h) => h + line);
  }
  return line + s;
}

function transformServer(src) {
  let s = src;

  s = s.replace(
    /const supabase = await createClient\(\);\s*\n\s*const \{\s*\n\s*data: \{ user \},\s*\n\s*\} = await supabase\.auth\.getUser\(\);\s*\n\s*if \(!user\) redirect\(["']\/login["']\);/g,
    `const user = await requireUser();\n  const supabase = await createClient();`
  );

  s = s.replace(
    /const supabase = await createClient\(\);\s*\n\s*const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);\s*\n\s*if \(!user\) redirect\(["']\/login["']\);/g,
    `const user = await requireUser();\n  const supabase = await createClient();`
  );

  s = s.replace(
    /const supabase = await createClient\(\);\s*\n\s*const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);\s*\n\s*if \(!user\) return \{ error: "[^"]+" \};/g,
    `const user = await getAppUser();\n  if (!user) return { error: "No autenticado" };\n  const supabase = await createClient();`
  );

  s = s.replace(
    /const supabase = await createClient\(\);\s*\n\s*const \{\s*\n\s*data: \{ user \},\s*\n\s*\} = await supabase\.auth\.getUser\(\);\s*\n\s*if \(!user\) return \{ error: "[^"]+" \};/g,
    `const user = await getAppUser();\n  if (!user) return { error: "No autenticado" };\n  const supabase = await createClient();`
  );

  s = s.replace(
    /const supabase = await createClient\(\);\s*\n\s*const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);\s*\n\s*if \(!user\) throw new Error\([^)]+\);/g,
    `const user = await getAppUser();\n  if (!user) throw new Error("No autenticado");\n  const supabase = await createClient();`
  );

  s = s.replace(
    /const supabase = await createClient\(\);\s*\n\s*const \{\s*\n\s*data: \{ user \},\s*\n\s*\} = await supabase\.auth\.getUser\(\);\s*\n\s*if \(!user\) throw new Error\([^)]+\);/g,
    `const user = await getAppUser();\n  if (!user) throw new Error("No autenticado");\n  const supabase = await createClient();`
  );

  // Restos
  s = s.replace(
    /const \{\s*\n\s*data: \{ user \},\s*\n\s*\} = await supabase\.auth\.getUser\(\);/g,
    `const user = await getAppUser();`
  );
  s = s.replace(
    /const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);/g,
    `const user = await getAppUser();`
  );

  return mergeSessionImports(s);
}

let changed = 0;
const leftoverClients = [];
for (const file of walk(root)) {
  let src = fs.readFileSync(file, "utf8");
  if (!src.includes("auth.getUser")) continue;
  if (/["']use client["']/.test(src)) {
    leftoverClients.push(path.relative(root, file));
    continue;
  }
  const next = transformServer(src);
  if (next !== src) {
    fs.writeFileSync(file, next);
    changed++;
    console.log("server", path.relative(root, file));
  }
}
console.log(`Updated ${changed} server files`);
console.log("Client leftovers:", leftoverClients.join(", ") || "(none)");
