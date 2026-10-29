"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createCategoriesBulk } from "@/app/(main)/categorias/actions";
import { DEFAULT_CATEGORIES } from "@/lib/categories-defaults";

export default function CategoriesOnboarding() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(DEFAULT_CATEGORIES.map((c) => c.name))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleCreate() {
    if (selected.size === 0) return;
    setLoading(true);
    setError(null);
    const cats = DEFAULT_CATEGORIES.filter((c) => selected.has(c.name));
    const result = await createCategoriesBulk(cats);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/categorias");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-fz-text-secondary">
        Elegí las categorías iniciales. Después podés agregar más.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {DEFAULT_CATEGORIES.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => toggle(c.name)}
            className={`text-left px-3 py-2 rounded-xl border text-sm ${
              selected.has(c.name)
                ? "border-fz-accent bg-fz-accent-soft"
                : "border-fz-border bg-fz-surface"
            }`}
          >
            <span className="mr-1">{c.icon}</span>
            {c.name}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-fz-negative bg-fz-negative-soft rounded-xl px-3 py-2">{error}</p>
      )}
      <button
        type="button"
        disabled={loading || selected.size === 0}
        onClick={handleCreate}
        className="fz-btn-primary w-full"
      >
        {loading ? "Guardando…" : "Crear categorías"}
      </button>
      <Link href="/" className="fz-btn-ghost w-full inline-flex justify-center">
        Saltear
      </Link>
    </div>
  );
}
