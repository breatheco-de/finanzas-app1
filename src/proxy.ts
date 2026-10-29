import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

/**
 * Gate de sesión con Auth.js (Fase 2). Edge-safe: solo auth.config (sin bcrypt/DB).
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth((request) => {
  const { pathname } = request.nextUrl;
  const user = request.auth?.user;

  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
