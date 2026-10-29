"use client";

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/auth-actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await requestPasswordReset(email);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDevLink(result.resetUrl ?? null);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-fz-bg px-5">
        <div className="fz-card w-full max-w-sm p-8 space-y-4 text-center">
          <h1 className="font-display font-bold text-2xl tracking-tight text-fz-text">
            Revisá tu email
          </h1>
          <p className="text-[15px] text-fz-text-secondary leading-relaxed">
            Si <span className="font-semibold text-fz-text">{email}</span> tiene una
            cuenta, generamos un link de recuperación.
          </p>
          {devLink && (
            <p className="text-left text-[13px] break-all bg-fz-surface-high rounded-xl p-3 text-fz-text">
              <span className="block text-fz-text-tertiary mb-1">
                Modo sin email (dev / AUTH_RESET_LOG_LINKS):
              </span>
              <Link href={devLink} className="text-fz-accent font-medium underline">
                Abrir link de reset
              </Link>
            </p>
          )}
          <Link href="/login" className="fz-btn-ghost w-full inline-flex">
            Volver al login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-fz-bg px-5">
      <div className="fz-card w-full max-w-sm p-8 space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-fz-text">
            Recuperar contraseña
          </h1>
          <p className="text-[15px] text-fz-text-secondary mt-2 leading-snug">
            Ingresá tu email. Por ahora el link se muestra acá en desarrollo (sin
            servicio de email de pago).
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="forgot-email" className="fz-label">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="fz-input"
            />
          </div>

          {error && (
            <p className="text-[14px] text-fz-negative bg-fz-negative-soft rounded-2xl px-3 py-2.5">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="fz-btn-primary w-full">
            {loading ? "Enviando…" : "Continuar"}
          </button>
        </form>

        <Link href="/login" className="fz-btn-ghost w-full inline-flex">
          Volver al login
        </Link>
      </div>
    </div>
  );
}
