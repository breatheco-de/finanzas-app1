import type { NextAuthConfig } from "next-auth";

/**
 * Config Edge-safe (sin bcrypt / Drizzle).
 * Usada por proxy.ts. La authorize de Credentials vive en auth.ts (Node).
 */
export const authConfig = {
  providers: [],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      // La lógica de redirect la maneja proxy.ts; acá solo exponemos la sesión.
      void auth;
      void request;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string;
        session.user.email = (token.email as string) ?? session.user.email ?? "";
      }
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
