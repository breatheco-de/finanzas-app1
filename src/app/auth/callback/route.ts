import { NextResponse } from "next/server";

/**
 * Callback legacy de Supabase Auth.
 * Fase 2 usa Auth.js (`/api/auth/*`). Redirige a login por si queda algún link viejo.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}
