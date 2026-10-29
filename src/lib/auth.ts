import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { eq } from "drizzle-orm";
import { authConfig } from "@/lib/auth.config";
import { getDb, users } from "@/lib/db";

/**
 * Auth.js (NextAuth v5) — credenciales contra tabla `users` en Railway Postgres.
 * Reemplaza Supabase Auth (Fase 2). Google OAuth queda fuera de esta fase.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) return null;

        const db = getDb();
        const [row] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (!row?.passwordHash) return null;

        const ok = await compare(password, row.passwordHash);
        if (!ok) return null;

        return {
          id: row.id,
          email: row.email,
          name: row.name,
        };
      },
    }),
  ],
});
