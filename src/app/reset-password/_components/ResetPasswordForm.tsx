"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="new-password" className="fz-label">
          Contraseña nueva
        </label>
        <input
          id="new-password"
          type="password"
          required
          autoFocus
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="fz-input"
        />
      </div>

      <div>
        <label htmlFor="confirm-password" className="fz-label">
          Repetir contraseña
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="fz-input"
        />
      </div>

      {error && (
        <p className="text-sm text-fz-negative bg-fz-negative-soft rounded-2xl px-3 py-2">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="fz-btn-primary w-full">
        {loading ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}
