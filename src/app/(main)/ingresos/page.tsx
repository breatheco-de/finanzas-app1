import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import type { Income } from "@/types";

export default async function IngresosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: incomesData } = await supabase
    .from("incomes")
    .select("*")
    .order("date", { ascending: false })
    .limit(100);

  const incomes = (incomesData ?? []) as Income[];

  return (
    <div className="px-4 pt-3 max-w-lg mx-auto space-y-5 bg-fz-bg min-h-[100dvh]">
      <PageHeader title="Ingresos">
        <Link
          href="/ingresos/nuevo"
          className="text-[14px] font-semibold text-fz-accent-text bg-fz-accent rounded-full px-4 min-h-[44px] inline-flex items-center"
        >
          + Ingreso
        </Link>
      </PageHeader>

      {incomes.length === 0 ? (
        <div className="bg-fz-surface border border-fz-border rounded-2xl p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-fz-accent-soft flex items-center justify-center mx-auto">
            <Wallet size={26} className="text-fz-accent" />
          </div>
          <p className="text-sm font-medium text-fz-text">Sin ingresos registrados</p>
          <Link
            href="/ingresos/nuevo"
            className="inline-flex min-h-[44px] items-center text-sm font-semibold text-fz-accent"
          >
            Registrar primer ingreso
          </Link>
        </div>
      ) : (
        <div className="bg-fz-surface border border-fz-border rounded-2xl overflow-hidden divide-y divide-fz-border">
          {incomes.map((income) => {
            const dateStr = new Date(income.date + "T00:00:00").toLocaleDateString(
              "es-AR",
              { day: "numeric", month: "short", year: "numeric" }
            );
            const typeLabel =
              income.type === "sueldo"
                ? "Sueldo"
                : income.type === "freelance"
                  ? "Freelance"
                  : "Otro";

            return (
              <Link
                key={income.id}
                href={`/ingresos/${income.id}/editar`}
                className="flex items-center justify-between px-4 py-3.5 active:bg-fz-surface-high min-h-[64px]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fz-text truncate">
                    {typeLabel}
                    {income.note ? ` · ${income.note}` : ""}
                  </p>
                  <p className="text-xs text-fz-text-tertiary mt-0.5">
                    {dateStr}
                    {income.distributed ? (
                      <span className="ml-2 text-fz-accent font-medium">✓ distribuido</span>
                    ) : (
                      <span className="ml-2 text-amber-700 font-medium">sin distribuir</span>
                    )}
                  </p>
                </div>
                <p className="text-sm font-semibold text-fz-accent tabular-nums font-mono ml-3 shrink-0">
                  +{formatCurrency(Number(income.amount), income.currency)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
