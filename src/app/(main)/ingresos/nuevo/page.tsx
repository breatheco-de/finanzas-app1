import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import IncomeForm from "./_components/IncomeForm";
import type { Account } from "@/types";

export default async function NuevoIngresoPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("accounts")
    .select("*")
    .order("name");

  const accounts = (data ?? []) as Account[];

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 pt-2 mb-6">
        <Link href="/" className="text-sm text-fz-text-tertiary hover:text-fz-text">
          ← Inicio
        </Link>
        <h1 className="text-xl font-semibold text-fz-text">Registrar ingreso</h1>
      </div>
      <IncomeForm accounts={accounts} />
    </div>
  );
}
