import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getLeafAccounts, accountDisplayName } from "@/lib/accounts";
import PageHeader from "@/components/PageHeader";
import PayInstallmentButton from "./_components/PayInstallmentButton";
import BatchPayButton from "./_components/BatchPayButton";
import ConfirmFundingButton from "./_components/ConfirmFundingButton";
import type { Currency, Account } from "@/types";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${MESES[parseInt(month) - 1]} ${year}`;
}

type PendingFundingRow = {
  id: string;
  account_id: string;
  amount: number;
  currency: Currency;
  reason: string | null;
  expense_id: string;
  expenses: {
    id: string;
    merchant: string | null;
    description: string | null;
    funding_account_id: string | null;
  } | null;
};

type InstallmentRow = {
  id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  expenses: {
    description: string | null;
    merchant: string | null;
    installments_total: number | null;
    currency: string;
    covering_account_id: string | null;
    account_id: string | null;
  } | null;
};

type GroupData = {
  cardId: string | null;
  cardName: string | null;
  closingDay: number | null;
  dueDay: number | null;
  yearMonth: string;
  items: InstallmentRow[];
};

export default async function CuotasPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data }, { data: accountsData }, { data: earmarksRaw }] = await Promise.all([
    supabase
      .from("installments")
      .select(
        "id, installment_number, amount, due_date, expenses ( description, merchant, installments_total, currency, covering_account_id, account_id )"
      )
      .eq("paid", false)
      .order("due_date"),
    supabase.from("accounts").select("*").order("name"),
    supabase
      .from("account_earmarks")
      .select("id, account_id, amount, currency, reason, expense_id, expenses!expense_id ( id, merchant, description, funding_account_id )")
      .eq("released", false)
      .not("expense_id", "is", null),
  ]);

  const installments = (data ?? []) as unknown as InstallmentRow[];
  const allAccounts = (accountsData ?? []) as Account[];
  const leafAccounts = getLeafAccounts(allAccounts);

  const allEarmarks = (earmarksRaw ?? []) as unknown as PendingFundingRow[];
  const pendingFunding = allEarmarks.filter(
    (ae) => !(ae.expenses as PendingFundingRow["expenses"])?.funding_account_id
  );

  const groupMap = new Map<string, GroupData>();
  for (const inst of installments) {
    const cardId = inst.expenses?.account_id ?? null;
    const yearMonth = inst.due_date.slice(0, 7);
    const key = `${cardId ?? "no_card"}::${yearMonth}`;

    if (!groupMap.has(key)) {
      const cardAccount = cardId
        ? allAccounts.find((a) => a.id === cardId) ?? null
        : null;
      groupMap.set(key, {
        cardId,
        cardName: cardAccount?.name ?? null,
        closingDay: cardAccount?.closing_day ?? null,
        dueDay: cardAccount?.due_day ?? null,
        yearMonth,
        items: [],
      });
    }
    groupMap.get(key)!.items.push(inst);
  }

  const groups = Array.from(groupMap.values()).sort((a, b) => {
    const byMonth = a.yearMonth.localeCompare(b.yearMonth);
    if (byMonth !== 0) return byMonth;
    return (a.cardName ?? "").localeCompare(b.cardName ?? "");
  });

  return (
    <div className="px-4 pt-3 max-w-lg mx-auto space-y-5 bg-fz-bg min-h-[100dvh]">
      <PageHeader
        title="Cuotas"
        subtitle={
          installments.length > 0
            ? `${installments.length} cuota${installments.length !== 1 ? "s" : ""} sin pagar`
            : "Nada pendiente por ahora"
        }
      />

      {pendingFunding.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide px-1">
            Transferencias pendientes
          </h2>
          <p className="text-[12px] text-fz-text-tertiary -mt-1 px-1">
            Reservas que todavía no tienen cuenta de origen confirmada.
          </p>
          {pendingFunding.map((ae) => {
            const exp = ae.expenses;
            const expName = exp?.merchant || exp?.description || "Gasto";
            const coveringAccount = allAccounts.find((a) => a.id === ae.account_id);
            const coveringName = coveringAccount
              ? accountDisplayName(coveringAccount, allAccounts)
              : "Cuenta eliminada";
            const compatibleAccounts = leafAccounts.filter(
              (a) => a.currency === ae.currency && a.id !== ae.account_id
            );

            return (
              <div
                key={ae.id}
                className="bg-amber-50 border border-amber-200/80 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fz-text truncate">{expName}</p>
                  <p className="text-xs text-fz-text-secondary">
                    {formatCurrency(ae.amount, ae.currency)} → {coveringName}
                  </p>
                </div>
                <ConfirmFundingButton
                  earmarkId={ae.id}
                  earmarkAmount={ae.amount}
                  earmarkCurrency={ae.currency}
                  coveringAccountName={coveringName}
                  expenseName={expName}
                  leafAccounts={compatibleAccounts}
                  allAccounts={allAccounts}
                />
              </div>
            );
          })}
        </section>
      )}

      {installments.length === 0 ? (
        <div className="bg-fz-surface border border-fz-border rounded-2xl p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-fz-accent-soft flex items-center justify-center mx-auto">
            <CheckCircle2 size={26} className="text-fz-accent" />
          </div>
          <p className="text-sm font-medium text-fz-text">Sin cuotas pendientes</p>
          <p className="text-sm text-fz-text-tertiary">
            Cuando cargues un gasto en cuotas, aparece acá.
          </p>
        </div>
      ) : (
        groups.map((group) => {
          const totalsByCurrency: Record<string, number> = {};
          for (const inst of group.items) {
            const cur = (inst.expenses?.currency ?? "ARS") as Currency;
            totalsByCurrency[cur] = (totalsByCurrency[cur] ?? 0) + Number(inst.amount);
          }
          const missingDays = !group.closingDay || !group.dueDay;

          return (
            <section
              key={`${group.cardId ?? "no_card"}::${group.yearMonth}`}
              className="space-y-2"
            >
              <div className="flex items-start justify-between gap-2 px-1">
                <div className="min-w-0">
                  <h2 className="text-[11px] font-semibold text-fz-text-tertiary uppercase tracking-wide">
                    {group.cardName
                      ? `${group.cardName} · ${formatMonth(group.yearMonth)}`
                      : formatMonth(group.yearMonth)}
                  </h2>
                  {group.dueDay && (
                    <p className="text-[12px] text-fz-text-tertiary mt-0.5">
                      Vence el día {group.dueDay}
                    </p>
                  )}
                  {missingDays && group.cardName && (
                    <p className="text-[12px] text-amber-700 mt-0.5">
                      Sin cierre/vencimiento — fechas aproximadas
                    </p>
                  )}
                </div>
                {group.items.length > 1 && (
                  <BatchPayButton
                    installments={group.items.map((inst) => ({
                      id: inst.id,
                      amount: Number(inst.amount),
                      currency: (inst.expenses?.currency ?? "ARS") as Currency,
                      coveringAccountId: inst.expenses?.covering_account_id ?? null,
                    }))}
                    cardName={group.cardName ?? "Tarjeta"}
                    yearMonth={group.yearMonth}
                    leafAccounts={leafAccounts}
                    allAccounts={allAccounts}
                  />
                )}
              </div>

              <div className="bg-fz-surface border border-fz-border rounded-2xl overflow-hidden divide-y divide-fz-border">
                {group.items.map((inst) => {
                  const exp = inst.expenses;
                  const label = exp?.merchant || exp?.description || "Gasto";
                  const total = exp?.installments_total ?? 1;
                  const instCurrency = (exp?.currency ?? "ARS") as Currency;
                  const [, month, day] = inst.due_date.split("-");
                  return (
                    <div
                      key={inst.id}
                      className="px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-fz-text truncate">{label}</p>
                        <p className="text-xs text-fz-text-tertiary">
                          Cuota {inst.installment_number}/{total} · vence {day}/{month}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-sm font-semibold tabular-nums font-mono text-fz-text">
                          {formatCurrency(Number(inst.amount), instCurrency)}
                        </p>
                        <PayInstallmentButton
                          installmentId={inst.id}
                          amount={Number(inst.amount)}
                          currency={instCurrency}
                          coveringAccountId={inst.expenses?.covering_account_id ?? null}
                          leafAccounts={leafAccounts}
                          allAccounts={allAccounts}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {group.items.length > 1 && (
                <div className="flex justify-end px-1 gap-3">
                  {Object.entries(totalsByCurrency).map(([cur, amt]) => (
                    <p key={cur} className="text-xs text-fz-text-tertiary">
                      Total{" "}
                      <span className="font-semibold text-fz-text tabular-nums font-mono">
                        {formatCurrency(amt, cur as Currency)}
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
