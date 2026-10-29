"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const EMOJI_OPTIONS = [
  "🛒", "🚌", "🏠", "💊", "⛽", "🍕", "💡", "👕",
  "🎬", "📱", "🐾", "📚", "🏋️", "🎁", "✈️", "🐷",
  "💼", "🎮", "🍺", "☕", "💅", "🏥", "🚗", "🎵",
  "📦", "🌿", "🔧", "💻", "📷", "🏪", "🎓", "🧴",
];

export default function NuevaCategoriaPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷️");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sesión expirada. Recargá la página."); setLoading(false); return; }

    const { error } = await supabase.from("categories").insert({
      user_id: user.id,
      name: name.trim(),
      icon,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/categorias");
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 pt-2 mb-6">
        <Link href="/categorias" className="text-fz-text-tertiary hover:text-fz-text transition-colors">
          ←
        </Link>
        <h1 className="text-xl font-semibold text-fz-text">Nueva categoría</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-fz-text mb-1">Nombre</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Supermercado"
            className="w-full border border-fz-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fz-accent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-fz-text mb-3">
            Ícono{" "}
            <span className="text-fz-text-tertiary font-normal">— seleccionado: {icon}</span>
          </label>
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setIcon(emoji)}
                className={`text-2xl aspect-square flex items-center justify-center rounded-lg transition-colors ${
                  icon === emoji ? "bg-fz-accent" : "hover:bg-fz-surface-high"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-fz-negative bg-fz-negative-soft rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full bg-fz-accent text-fz-accent-text rounded-xl py-3 text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-colors"
        >
          {loading ? "Guardando..." : "Guardar categoría"}
        </button>
      </form>
    </div>
  );
}
