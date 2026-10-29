"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "check-email";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loginConGoogle() {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setMode("check-email");
      }
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (mode === "check-email") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-fz-bg px-5 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="fz-card w-full max-w-sm p-8 space-y-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-fz-accent-soft flex items-center justify-center">
            <span className="text-fz-accent text-xl font-bold">✓</span>
          </div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-fz-text">
            Revisá tu email
          </h1>
          <p className="text-[15px] text-fz-text-secondary leading-relaxed">
            Te enviamos un link a{" "}
            <span className="font-semibold text-fz-text">{email}</span>. Tocá el
            link para activar la cuenta.
          </p>
          <button type="button" onClick={() => setMode("login")} className="fz-btn-ghost w-full">
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center bg-fz-bg px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm mx-auto space-y-7">
        <div className="space-y-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-fz-accent text-fz-accent-text font-bold text-lg shadow-[var(--fz-shadow)]">
            F
          </div>
          <div>
            <h1 className="font-display font-bold text-[32px] leading-[1.1] tracking-tight text-fz-text">
              Finanzas
            </h1>
            <p className="mt-1.5 text-[15px] text-fz-text-secondary leading-snug">
              {mode === "login"
                ? "Tu plata, clara. Iniciá sesión."
                : "Creá tu cuenta en segundos."}
            </p>
          </div>
        </div>

        <div className="fz-card p-5 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="fz-label">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="fz-input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <label htmlFor="login-password" className="fz-label mb-0">
                  Contraseña
                </label>
                {mode === "login" && (
                  <Link
                    href="/forgot-password"
                    className="text-[13px] font-semibold text-fz-accent min-h-[32px] inline-flex items-center"
                  >
                    ¿Olvidaste?
                  </Link>
                )}
              </div>
              <input
                id="login-password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="fz-input"
              />
            </div>

            {error && (
              <p className="text-[14px] text-fz-negative bg-fz-negative-soft rounded-2xl px-3 py-2.5">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="fz-btn-primary w-full">
              {loading
                ? "Cargando…"
                : mode === "login"
                  ? "Ingresar"
                  : "Registrarme"}
            </button>
          </form>

          <div className="relative py-0.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-fz-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-fz-surface px-3 text-[12px] text-fz-text-tertiary">
                o continuá con
              </span>
            </div>
          </div>

          <button type="button" onClick={loginConGoogle} className="fz-btn-secondary w-full gap-2.5">
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          className="w-full min-h-[48px] text-[15px] font-medium text-fz-text-secondary"
        >
          {mode === "login"
            ? "¿No tenés cuenta? Registrate"
            : "¿Ya tenés cuenta? Ingresá"}
        </button>
      </div>
    </div>
  );
}
