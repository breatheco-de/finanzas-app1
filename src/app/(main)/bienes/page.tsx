import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Home } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import PageHeader from "@/components/PageHeader";
import DeleteAssetButton from "./_components/DeleteAssetButton";
import {
  calcAssetFunds,
  calcMaintenance,
  calcCurrentValue,
  getDefaultsForCategory,
  AssetCategory,
  CarSegment,
} from "@/lib/finance/sinkingFund";
import type { Asset, Currency } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  heladera: "Heladera/Freezer",
  lavarropas: "Lavarropas",
  lavavajillas: "Lavavajillas",
  secarropas: "Secarropas",
  microondas: "Microondas",
  horno: "Horno/Cocina",
  tv: "TV",
  notebook: "Notebook/PC",
  smartphone: "Smartphone",
  auto: "Auto",
  vivienda: "Vivienda",
  muebles: "Muebles",
};

export default async function BienesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false });

  const assets = (data ?? []) as Asset[];

  if (assets.length === 0) {
    return (
      <div className="px-4 pt-3 max-w-lg mx-auto bg-fz-bg min-h-[100dvh] space-y-5">
        <PageHeader title="Bienes">
          <Link
            href="/bienes/nuevo"
            className="text-[14px] font-semibold text-fz-accent-text bg-fz-accent rounded-full px-4 min-h-[44px] inline-flex items-center"
          >
            + Agregar
          </Link>
        </PageHeader>
        <div className="bg-fz-surface border border-fz-border rounded-2xl p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-fz-accent-soft flex items-center justify-center mx-auto">
            <Home size={26} className="text-fz-accent" />
          </div>
          <p className="text-sm font-medium text-fz-text">Sin bienes registrados</p>
          <p className="text-sm text-fz-text-tertiary">
            Registrá tus bienes para calcular cuánto reservar cada mes.
          </p>
          <Link
            href="/bienes/nuevo"
            className="inline-flex min-h-[44px] items-center text-sm font-semibold text-fz-accent"
          >
            Agregar primer bien
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date();
  const totals: Record<string, { sinking: number; maintenance: number }> = {};

  const items = assets.map((asset) => {
    const C0 = asset.replacement_cost ?? asset.purchase_price ?? 0;
    const pp = asset.purchase_price ?? C0;
    const pd = asset.purchase_date ?? asset.created_at.split("T")[0];

    let ulm = asset.useful_life_months;
    let rp = asset.residual_pct;
    let mpa = asset.maintenance_pct_annual;

    if (asset.category) {
      const def = getDefaultsForCategory(asset.category as AssetCategory);
      if (ulm == null) ulm = def.useful_life_months;
      if (rp == null) rp = def.residual_pct;
      if (mpa == null) mpa = def.maintenance_pct_annual;
    }

    const isManual =
      asset.savings_goal_mode === "manual" &&
      asset.savings_goal_amount != null &&
      asset.savings_goal_months != null &&
      asset.savings_goal_months > 0;

    let result: {
      sinkingFund: number;
      maintenance: number;
      total: number;
      monthsRemaining: number;
      goalAmount: number;
      residualValue: number;
    };

    if (isManual) {
      const cv = asset.current_value ?? calcCurrentValue(pp, pd, today);
      const maintenance = calcMaintenance(cv, mpa ?? 0);
      const sinkingFund = asset.savings_goal_amount! / asset.savings_goal_months!;
      result = {
        sinkingFund,
        maintenance,
        total: sinkingFund + maintenance,
        monthsRemaining: asset.savings_goal_months!,
        goalAmount: asset.savings_goal_amount!,
        residualValue: 0,
      };
    } else {
      result = calcAssetFunds({
        C0,
        purchasePrice: pp,
        purchaseDate: pd,
        useful_life_months: ulm,
        residual_pct: rp,
        maintenance_pct_annual: mpa ?? 0,
        interest_rate_monthly: asset.interest_rate_monthly ?? 0,
        current_value: asset.current_value,
        replacement_horizon_months: asset.replacement_horizon_months,
        car_segment: asset.car_segment as CarSegment | null,
        bought_used: asset.bought_used,
        today,
      });
    }

    const c = asset.currency;
    if (!totals[c]) totals[c] = { sinking: 0, maintenance: 0 };
    totals[c].sinking += result.sinkingFund;
    totals[c].maintenance += result.maintenance;

    return { asset, result, isManual };
  });

  return (
    <div className="px-4 pt-3 max-w-lg mx-auto space-y-5 bg-fz-bg min-h-[100dvh]">
      <PageHeader title="Bienes">
        <Link
          href="/bienes/nuevo"
          className="text-[14px] font-semibold text-fz-accent-text bg-fz-accent rounded-full px-4 min-h-[44px] inline-flex items-center"
        >
          + Agregar
        </Link>
      </PageHeader>

      {Object.entries(totals).map(([cur, { sinking, maintenance }]) => (
        <section
          key={cur}
          className="bg-fz-surface-high border border-fz-border rounded-[22px] p-4 space-y-2"
        >
          <p className="text-[11px] font-semibold text-fz-text-tertiary uppercase tracking-wide">
            Total a apartar este mes ({cur})
          </p>
          <p className="font-display font-extrabold text-3xl text-fz-text tabular-nums font-mono">
            {formatCurrency(sinking + maintenance, cur as Currency)}
            <span className="text-base font-medium text-fz-text-tertiary">/mes</span>
          </p>
          <div className="flex gap-3 text-xs text-fz-text-secondary font-mono tabular-nums">
            <span>Sinking {formatCurrency(sinking, cur as Currency)}</span>
            <span>·</span>
            <span>Mant. {formatCurrency(maintenance, cur as Currency)}</span>
          </div>
        </section>
      ))}

      <section className="bg-fz-surface border border-fz-border rounded-2xl overflow-hidden divide-y divide-fz-border">
        {items.map(({ asset, result, isManual }) => {
          const yr = Math.floor(result.monthsRemaining / 12);
          const mo = result.monthsRemaining % 12;
          const isExpired =
            result.monthsRemaining === 0 &&
            result.sinkingFund === 0 &&
            asset.category !== "vivienda" &&
            asset.useful_life_months != null;

          return (
            <div key={asset.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-fz-text truncate">{asset.name}</p>
                  <p className="text-xs text-fz-text-tertiary">
                    {asset.category
                      ? CATEGORY_LABELS[asset.category]
                      : "Sin categoría"}
                    {asset.purchase_date &&
                      ` · ${new Date(asset.purchase_date).getFullYear()}`}
                  </p>
                  {result.monthsRemaining > 0 && (
                    <p className="text-xs text-fz-text-tertiary mt-0.5">
                      {asset.replacement_horizon_months
                        ? `${asset.replacement_horizon_months} mes${asset.replacement_horizon_months !== 1 ? "es" : ""} (horizonte manual)`
                        : [
                            yr > 0 && `${yr} año${yr !== 1 ? "s" : ""}`,
                            mo > 0 && `${mo} mes${mo !== 1 ? "es" : ""}`,
                          ]
                            .filter(Boolean)
                            .join(" ")}{" "}
                      para reponer
                    </p>
                  )}
                  {isExpired && (
                    <p className="text-xs text-amber-700 mt-0.5 font-medium">
                      Vida útil cumplida
                    </p>
                  )}
                  <div className="flex gap-3 mt-2 items-center">
                    <Link
                      href={`/bienes/${asset.id}/editar`}
                      className="text-[12px] font-semibold text-fz-accent min-h-[32px] inline-flex items-center"
                    >
                      Editar
                    </Link>
                    <DeleteAssetButton assetId={asset.id} assetName={asset.name} />
                  </div>
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  <p className="text-sm font-bold text-fz-text tabular-nums font-mono">
                    {formatCurrency(result.total, asset.currency)}
                    <span className="text-[11px] font-normal text-fz-text-tertiary">/mes</span>
                  </p>
                  {result.sinkingFund > 0 && (
                    <p className="text-[11px] text-fz-text-tertiary tabular-nums font-mono">
                      Sinking {formatCurrency(result.sinkingFund, asset.currency)}
                    </p>
                  )}
                  <p className="text-[11px] text-fz-text-tertiary tabular-nums font-mono">
                    Mant. {formatCurrency(result.maintenance, asset.currency)}
                  </p>
                  {result.goalAmount > 0 && (
                    <p className="text-[11px] text-fz-accent tabular-nums font-mono mt-0.5">
                      Meta {formatCurrency(result.goalAmount, asset.currency)}
                      {isManual && (
                        <span className="text-fz-text-tertiary ml-1">manual</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
