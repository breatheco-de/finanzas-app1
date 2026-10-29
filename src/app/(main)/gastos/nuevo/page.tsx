import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ExpenseForm from "@/components/ExpenseForm";
import { fetchShareGroupsWithMembers } from "@/lib/queries/shareGroups";
import type { Account, Category } from "@/types";
import { ChevronLeft } from "lucide-react";

export default async function NuevoGastoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: accounts }, { data: categories }, { data: merchantRows }, shareGroups] =
    await Promise.all([
      supabase.from("accounts").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
      supabase
        .from("expenses")
        .select("merchant")
        .not("merchant", "is", null)
        .order("merchant"),
      fetchShareGroupsWithMembers(),
    ]);

  const merchants = [
    ...new Set(
      (merchantRows ?? []).map((r) => r.merchant).filter(Boolean) as string[]
    ),
  ];

  return (
    <div className="px-4 pt-2 max-w-lg mx-auto bg-fz-bg min-h-[100dvh]">
      <div className="flex items-center gap-2 mb-5 min-h-[48px]">
        <Link
          href="/movimientos"
          className="flex h-11 w-11 items-center justify-center rounded-xl text-fz-text-secondary active:bg-fz-surface-high"
          aria-label="Volver"
        >
          <ChevronLeft size={26} />
        </Link>
        <h1 className="text-[22px] font-bold text-fz-text">Nuevo gasto</h1>
      </div>
      <ExpenseForm
        accounts={(accounts ?? []) as Account[]}
        categories={(categories ?? []) as Category[]}
        merchants={merchants}
        shareGroups={shareGroups}
        redirectTo="/movimientos"
      />
    </div>
  );
}
