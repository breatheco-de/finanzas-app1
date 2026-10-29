import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import ExpenseForm from "@/components/ExpenseForm";
import { fetchShareGroupsWithMembers } from "@/lib/queries/shareGroups";
import type { Account, Category } from "@/types";

// Ruta optimizada para el Action Button de iPhone (iOS Shortcuts).
export default async function NuevoGastoDirectoPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: accounts }, { data: categories }, shareGroups] = await Promise.all([
    supabase.from("accounts").select("*").order("name"),
    supabase.from("categories").select("*").order("name"),
    fetchShareGroupsWithMembers(),
  ]);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-fz-text pt-2 mb-6">Nuevo gasto</h1>
      <ExpenseForm
        accounts={(accounts ?? []) as Account[]}
        categories={(categories ?? []) as Category[]}
        shareGroups={shareGroups}
        redirectTo="/"
      />
    </div>
  );
}
