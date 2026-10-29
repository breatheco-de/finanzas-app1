"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
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
            cuenta, te enviamos un link para restablecer tu contraseña.
          </p>
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
            Te enviamos un link para elegir una nueva.
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
            <p className="text-sm text-fz-negative bg-fz-negative-soft rounded-2xl px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="fz-btn-primary w-full">
            {loading ? "Enviando..." : "Enviar link"}
          </button>
        </form>

        <Link
          href="/login"
          className="block w-full text-center min-h-[44px] leading-[44px] text-[15px] font-medium text-fz-text-secondary"
        >
          Volver al login
        </Link>
      </div>
    </div>
  );
}
