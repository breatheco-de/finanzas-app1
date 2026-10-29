import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Home, Target } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { getAllSavingsTargets } from "@/lib/finance/savingsGoals";
import PageHeader from "@/components/PageHeader";
import AportarButton from "./_components/AportarButton";
import DeleteGoalButton from "./_components/DeleteGoalButton";
import type { Asset, SavingsGoal, SavingsContribution, Account, Currency } from "@/types";

export default async function ObjetivosPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [
    { data: assetsData },
    { data: goalsData },
    { data: contribsData },
    { data: accountsData },
  ] = await Promise.all([
    supabase.from("assets").select("*").order("created_at", { ascending: false }),
    supabase.from("savings_goals").select("*").eq("archived", false).order("created_at", { ascending: false }),
    supabase.from("savings_contributions").select("*"),
    supabase.from("accounts").select("*").order("name"),
  ]);

  const assets = (assetsData ?? []) as Asset[];
  const goals = (goalsData ?? []) as SavingsGoal[];
  const contributions = (contribsData ?? []) as SavingsContribution[];
  const accounts = (accountsData ?? []) as Account[];

  const today = new Date();
  const targets = getAllSavingsTargets(assets, goals, contributions, today);

  const totals: Record<string, number> = {};
  for (const t of targets) {
    if (!totals[t.currency]) totals[t.currency] = 0;
    totals[t.currency] += t.monthlyContribution;
  }

  const isEmpty = targets.length === 0;

  return (
    <div className="px-4 pt-3 max-w-lg mx-auto space-y-5 bg-fz-bg min-h-[100dvh]">
      <PageHeader title="Metas">
        <Link
          href="/bienes/nuevo"
          className="text-[13px] font-semibold border border-fz-border text-fz-text rounded-full px-3 min-h-[44px] inline-flex items-center"
        >
          + Bien
        </Link>
        <Link
          href="/objetivos/nuevo"
          className="text-[13px] font-semibold text-fz-accent-text bg-fz-accent rounded-full px-3 min-h-[44px] inline-flex items-center"
        >
          + Objetivo
        </Link>
      </PageHeader>

      {isEmpty ? (
        <div className="bg-fz-surface border border-fz-border rounded-2xl p-6 space-y-4">
          <p className="text-sm text-fz-text-secondary text-center">
            Un <span className="font-semibold text-fz-text">Bien</span> (auto, heladera) la app calcula cuánto apartar.
            Un <span className="font-semibold text-fz-text">Objetivo</span> (viaje, mudanza) lo definís vos.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/bienes/nuevo"
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-fz-border bg-fz-surface-high active:opacity-90 text-center min-h-[120px]"
            >
              <Home size={22} className="text-fz-accent" />
              <span className="text-sm font-semibold text-fz-text">Registrar un bien</span>
              <span className="text-xs text-fz-text-tertiary">Auto, heladera…</span>
            </Link>
            <Link
              href="/objetivos/nuevo"
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-fz-border bg-fz-surface-high active:opacity-90 text-center min-h-[120px]"
            >
              <Target size={22} className="text-fz-accent" />
              <span className="text-sm font-semibold text-fz-text">Crear objetivo</span>
              <span className="text-xs text-fz-text-tertiary">Viaje, mudanza…</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {Object.entries(totals).map(([cur, total]) => (
            <section
              key={cur}
              className="bg-fz-surface-high border border-fz-border rounded-[22px] p-4 space-y-1"
            >
              <p className="text-[11px] font-semibold text-fz-text-tertiary uppercase tracking-wide">
                A apartar este mes ({cur})
              </p>
              <p className="font-display font-extrabold text-3xl text-fz-text tabular-nums font-mono">
                {formatCurrency(total, cur as Currency)}
                <span className="text-base font-medium text-fz-text-tertiary">/mes</span>
              </p>
            </section>
          ))}

          <section className="bg-fz-surface border border-fz-border rounded-2xl overflow-hidden divide-y divide-fz-border">
            {targets.map((target) => {
              const yr = Math.floor(target.monthsRemaining / 12);
              const mo = target.monthsRemaining % 12;
              const timeLabel =
                target.monthsRemaining === 0
                  ? "Vencida"
                  : [
                      yr > 0 && `${yr} año${yr !== 1 ? "s" : ""}`,
                      mo > 0 && `${mo} mes${mo !== 1 ? "es" : ""}`,
                    ]
                      .filter(Boolean)
                      .join(" ");

              return (
                <div key={target.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-fz-text truncate">
                          {target.name}
                        </p>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            target.kind === "goal"
                              ? "bg-fz-accent-soft text-fz-accent"
                              : "bg-fz-surface-high text-fz-text-secondary"
                          }`}
                        >
                          {target.kind === "goal" ? "Objetivo" : "Bien"}
                        </span>
                      </div>

                      <div className="mt-1.5 mb-1">
                        <div className="h-1.5 bg-fz-surface-high rounded-full overflow-hidden">
                          <div
                            className="h-full bg-fz-accent rounded-full transition-all"
                            style={{ width: `${Math.min(100, target.progressPct)}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-fz-text-tertiary mt-0.5 font-mono tabular-nums">
                          {formatCurrency(target.accumulated, target.currency)} de{" "}
                          {formatCurrency(target.targetAmount, target.currency)}{" "}
                          ({Math.round(target.progressPct)}%)
                        </p>
                      </div>

                      {timeLabel && (
                        <p className="text-[11px] text-fz-text-tertiary">
                          {timeLabel === "Vencida" ? (
                            <span className="text-amber-700 font-medium">Vencida</span>
                          ) : (
                            `${timeLabel} restantes`
                          )}
                        </p>
                      )}

                      <div className="flex gap-3 mt-2 flex-wrap items-center">
                        <AportarButton
                          targetKind={target.kind}
                          targetId={target.id}
                          targetName={target.name}
                          targetCurrency={target.currency}
                          destAccountId={target.accountId}
                          suggestedAmount={target.monthlyContribution}
                          accounts={accounts}
                        />
                        {target.kind === "asset" ? (
                          <Link
                            href={`/bienes/${target.id}/editar`}
                            className="text-[12px] font-medium text-fz-text-secondary min-h-[32px] inline-flex items-center"
                          >
                            Editar bien
                          </Link>
                        ) : (
                          <>
                            <Link
                              href={`/objetivos/${target.id}/editar`}
                              className="text-[12px] font-medium text-fz-text-secondary min-h-[32px] inline-flex items-center"
                            >
                              Editar
                            </Link>
                            <DeleteGoalButton goalId={target.id} goalName={target.name} />
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-fz-text tabular-nums font-mono">
                        {formatCurrency(target.monthlyContribution, target.currency)}
                        <span className="text-[11px] font-normal text-fz-text-tertiary">/mes</span>
                      </p>
                      <p className="text-[11px] text-fz-text-tertiary font-mono tabular-nums">
                        Meta {formatCurrency(target.targetAmount, target.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <Link
            href="/bienes"
            className="block text-center text-sm font-medium text-fz-accent py-2 min-h-[44px]"
          >
            Ver todos los bienes →
          </Link>
        </>
      )}
    </div>
  );
}
