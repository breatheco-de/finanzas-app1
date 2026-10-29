"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCategory } from "@/app/(main)/categorias/actions";

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
    const result = await createCategory({ name: name.trim(), icon });
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
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
        <h1 className="text-xl font-bold text-fz-text">Nueva categoría</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="fz-label">Nombre</label>
          <input
            className="fz-input"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="fz-label">Ícono</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setIcon(e)}
                className={`text-2xl w-11 h-11 rounded-lg border ${
                  icon === e ? "border-fz-accent bg-fz-accent-soft" : "border-fz-border"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <p className="text-sm text-fz-negative bg-fz-negative-soft rounded-xl px-3 py-2">{error}</p>
        )}
        <button type="submit" disabled={loading} className="fz-btn-primary w-full">
          {loading ? "Guardando…" : "Crear"}
        </button>
      </form>
    </div>
  );
}
