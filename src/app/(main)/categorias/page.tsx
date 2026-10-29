import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import CategoriesOnboarding from "./_components/CategoriesOnboarding";

export default async function CategoriasPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .is("parent_id", null)
    .order("name");

  if (!categories || categories.length === 0) {
    return (
      <div className="p-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-semibold text-fz-text pt-2 mb-6">Categorías</h1>
        <CategoriesOnboarding />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-semibold text-fz-text">Categorías</h1>
        <Link
          href="/categorias/nueva"
          className="text-sm font-medium text-fz-text bg-fz-surface-high hover:bg-fz-border rounded-full px-4 py-2 transition-colors"
        >
          + Nueva
        </Link>
      </div>

      <div className="bg-fz-surface rounded-2xl shadow-[var(--fz-shadow)] overflow-hidden">
        {categories.map((cat: any, i: any) => (
          <div
            key={cat.id}
            className={`flex items-center gap-3 px-4 py-3 ${
              i > 0 ? "border-t border-fz-border" : ""
            }`}
          >
            <span className="text-xl w-7 text-center">{cat.icon ?? "🏷️"}</span>
            <p className="text-sm font-medium text-fz-text">{cat.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
