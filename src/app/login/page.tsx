"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser, registerUser } from "@/lib/auth-actions";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result =
      mode === "signup"
        ? await registerUser(email, password)
        : await loginUser(email, password);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-[100dvh] flex flex-col justify-center bg-fz-bg px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm mx-auto space-y-7">
        <div className="space-y-3">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-fz-accent text-white font-bold text-lg shadow-[var(--fz-shadow)]">
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
