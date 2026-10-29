import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import TransferenciaForm from "./_components/TransferenciaForm";
import type { Account } from "@/types";

export default async function TransferenciaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("accounts").select("*").order("name");

  const accounts = (data ?? []) as Account[];

  return (
    <div className="px-4 pt-3 max-w-lg mx-auto space-y-5 bg-fz-bg min-h-[100dvh]">
      <PageHeader title="Transferencia">
        <Link
          href="/cuentas"
          className="text-[13px] font-semibold text-fz-text-secondary min-h-[44px] inline-flex items-center"
        >
          Cuentas
        </Link>
      </PageHeader>
      {accounts.length < 2 ? (
        <div className="bg-fz-surface border border-fz-border rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm text-fz-text-secondary">
            Necesitás al menos dos cuentas para transferir.
          </p>
          <Link
            href="/cuentas/nueva"
            className="inline-flex min-h-[44px] items-center text-sm font-semibold text-fz-accent"
          >
            Crear cuenta
          </Link>
        </div>
      ) : (
        <TransferenciaForm accounts={accounts} />
      )}
    </div>
  );
}
