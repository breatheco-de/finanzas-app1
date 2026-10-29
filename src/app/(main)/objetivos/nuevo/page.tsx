import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import GoalForm from "./_components/GoalForm";
import type { Account } from "@/types";

export default async function NuevoObjetivoPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: accountsData } = await supabase
    .from("accounts")
    .select("*")
    .order("name");

  const accounts = (accountsData ?? []) as Account[];

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 pt-2 mb-6">
        <Link href="/objetivos" className="text-sm text-fz-text-tertiary hover:text-fz-text">
          ← Metas
        </Link>
        <h1 className="text-xl font-semibold text-fz-text">Nuevo objetivo</h1>
      </div>
      <div className="bg-fz-surface rounded-2xl shadow-[var(--fz-shadow)] p-5">
        <GoalForm accounts={accounts} />
      </div>
    </div>
  );
}
