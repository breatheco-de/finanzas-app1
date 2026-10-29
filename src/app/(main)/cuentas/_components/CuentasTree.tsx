"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format";
import CuentaActions from "./CuentaActions";
import type { FciHoldingOption } from "./CuentaActions";
import type { FciFundOption } from "./FciFundSelector";
import { convertAccountToParent, createChildAccount } from "../actions";
import type { AccountType, Currency } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AccountNode {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  parent_id: string | null;
  earmarksTotal: number;
  earmarksCuotas: number;
  earmarksMetas: number;
  earns_yield: boolean;
  hasExpenseDeps: boolean;
  // Migración 021: holding vinculado para sync de balance (B-sync)
  holding_id: string | null;
  linkedHoldingName: string | null;
  // Sesión J.1.11: rendimiento 30d del holding ya vinculado (holding_price_history,
  // migración 022). null explícito si no hay suficiente histórico todavía.
  linkedHoldingReturn30d: number | null;
  // Sesión J.1.7: catálogo de fondos de la institución (vacío si no se detectó
  // ninguna de las 5 instituciones verificadas — ver lecciones-aprendidas §21)
  fciCatalog: FciFundOption[];
  // Solo relevante para type="credito" — Sesión J.1.13, TAREA 2: ahora también
  // editables desde CuentaActions, no solo al crear la cuenta.
  closing_day: number | null;
  due_day: number | null;
}

interface Props {
  accounts: AccountNode[];
  fciHoldings: FciHoldingOption[];
}

// ─── Tree computation helpers ─────────────────────────────────────────────────

function buildChildrenMap(accounts: AccountNode[]): Map<string, AccountNode[]> {
  const map = new Map<string, AccountNode[]>();
  for (const a of accounts) {
    if (a.parent_id) {
      const arr = map.get(a.parent_id) ?? [];
      arr.push(a);
      map.set(a.parent_id, arr);
    }
  }
  return map;
}

function getConsolidatedTotals(
  nodeId: string,
  childrenMap: Map<string, AccountNode[]>,
  accountMap: Map<string, AccountNode>
): Map<string, number> {
  const children = childrenMap.get(nodeId) ?? [];
  if (children.length === 0) {
    const acct = accountMap.get(nodeId);
    if (!acct) return new Map();
    return new Map([[acct.currency, acct.balance]]);
  }
  const totals = new Map<string, number>();
  for (const child of children) {
    if (child.type === "credito") continue;
    const childTotals = getConsolidatedTotals(child.id, childrenMap, accountMap);
    for (const [cur, amt] of childTotals) {
      totals.set(cur, (totals.get(cur) ?? 0) + amt);
    }
  }
  return totals;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DiscriminatedBalance({
  balance,
  currency,
  earmarksTotal,
  earmarksCuotas,
  earmarksMetas,
}: {
  balance: number;
  currency: Currency;
  earmarksTotal: number;
  earmarksCuotas: number;
  earmarksMetas: number;
}) {
  if (earmarksTotal === 0) {
    return (
      <p className="text-sm text-fz-text-secondary tabular-nums">
        {formatCurrency(balance, currency)}
      </p>
    );
  }
  const libre = balance - earmarksTotal;
  return (
    <div className="text-right space-y-0.5">
      <p className="text-xs text-fz-text-tertiary tabular-nums">
        Total: {formatCurrency(balance, currency)}
      </p>
      {earmarksCuotas > 0 && (
        <p className="text-[10px] text-amber-600 tabular-nums">
          Cuotas: −{formatCurrency(earmarksCuotas, currency)}
        </p>
      )}
      {earmarksMetas > 0 && (
        <p className="text-[10px] text-blue-600 tabular-nums">
          Metas: −{formatCurrency(earmarksMetas, currency)}
        </p>
      )}
      <p className="text-sm font-semibold text-fz-text tabular-nums">
        Libre: {formatCurrency(libre, currency)}
      </p>
    </div>
  );
}

// ─── AddChildInline ───────────────────────────────────────────────────────────

function AddChildInline({
  parentId,
  parentCurrency,
  parentBalance,
  hasChildren,
  onSuccess,
}: {
  parentId: string;
  parentCurrency: Currency;
  parentBalance: number;
  hasChildren: boolean;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [childName, setChildName] = useState("");
  const [currency, setCurrency] = useState<Currency>(parentCurrency);
  const [balance, setBalance] = useState(
    !hasChildren && parentBalance > 0 ? String(parentBalance) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setChildName("");
    setCurrency(parentCurrency);
    setBalance(!hasChildren && parentBalance > 0 ? String(parentBalance) : "");
    setError(null);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] text-fz-text-secondary hover:text-fz-accent border border-dashed border-fz-border rounded-lg px-2.5 py-1 transition-colors w-full text-center mt-2"
      >
        + Agregar subdivisión
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 border border-fz-border bg-fz-accent-soft rounded-xl space-y-2">
      {!hasChildren && parentBalance > 0 && (
        <p className="text-[10px] text-fz-accent leading-snug">
          ⚠ Tu saldo de {formatCurrency(parentBalance, parentCurrency)} se moverá
          a este bolsillo. Los gastos y reservas existentes también se reasignarán.
        </p>
      )}
      <input
        type="text"
        autoFocus
        value={childName}
        onChange={(e) => setChildName(e.target.value)}
        placeholder="Nombre del bolsillo"
        className="w-full border border-fz-border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-fz-accent bg-fz-surface"
      />
      <div className="flex items-center gap-1.5">
        {(["ARS", "USD"] as Currency[]).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
              currency === c
                ? "bg-fz-accent text-fz-accent-text border-fz-accent"
                : "bg-fz-surface text-fz-text border-fz-border hover:border-gray-400"
            }`}
          >
            {c}
          </button>
        ))}
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="Saldo (opcional)"
          className="flex-1 border border-fz-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-fz-accent bg-fz-surface"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={saving || !childName.trim()}
          onClick={async () => {
            setSaving(true);
            setError(null);
            let result: { error?: string };
            if (!hasChildren) {
              result = await convertAccountToParent(parentId, childName.trim());
            } else {
              result = await createChildAccount(parentId, {
                name: childName.trim(),
                currency,
                balance: parseFloat(balance) || 0,
              });
            }
            if (result.error) {
              setError(result.error);
              setSaving(false);
            } else {
              reset();
              onSuccess();
            }
          }}
          className="text-[11px] font-medium text-fz-accent disabled:opacity-40"
        >
          {saving ? "Guardando…" : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={reset}
          className="text-[11px] text-fz-text-tertiary"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-[10px] text-fz-negative">{error}</p>}
    </div>
  );
}

// ─── TreeNode ─────────────────────────────────────────────────────────────────

function TreeNode({
  account,
  depth,
  childrenMap,
  accountMap,
  expandedIds,
  onToggle,
  onRefresh,
  fciHoldings,
}: {
  account: AccountNode;
  depth: number;
  childrenMap: Map<string, AccountNode[]>;
  accountMap: Map<string, AccountNode>;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onRefresh: () => void;
  fciHoldings: FciHoldingOption[];
}) {
  const router = useRouter();
  const allChildren = childrenMap.get(account.id) ?? [];
  const bolsilloChildren = allChildren.filter((c) => c.type !== "credito");
  const creditChildren = allChildren.filter((c) => c.type === "credito");
  const hasChildren = allChildren.length > 0;
  const isExpanded = expandedIds.has(account.id);
  const isChild = account.parent_id !== null;
  const canChangeType = !account.hasExpenseDeps && !isChild;
  const canHaveChildren = account.type !== "credito";

  if (hasChildren) {
    const consolidatedTotals = getConsolidatedTotals(
      account.id,
      childrenMap,
      accountMap
    );
    const indent = depth * 16;
    const headerBg =
      depth === 0 ? "bg-fz-bg" : depth === 1 ? "bg-fz-bg/60" : "bg-fz-surface";

    return (
      <div className="bg-fz-surface rounded-2xl shadow-[var(--fz-shadow)] overflow-hidden">
        <div
          className={`flex items-start gap-3 px-4 py-3 ${headerBg}`}
          style={{ paddingLeft: `${16 + indent}px` }}
        >
          <button
            type="button"
            onClick={() => onToggle(account.id)}
            className="mt-0.5 text-fz-text-tertiary hover:text-fz-text shrink-0 transition-colors"
            aria-label={isExpanded ? "Colapsar" : "Expandir"}
          >
            <span className="text-xs">{isExpanded ? "▾" : "▸"}</span>
          </button>
          <div className="flex-1 min-w-0">
            <p
              className={`font-semibold text-fz-text ${
                depth === 0 ? "text-sm" : "text-xs"
              }`}
            >
              {account.name}
            </p>
            <CuentaActions
              accountId={account.id}
              accountName={account.name}
              accountType={account.type}
              currentBalance={account.balance}
              currency={account.currency}
              earnsYield={account.earns_yield}
              canChangeType={canChangeType}
              isChild={isChild}
              holdingId={account.holding_id}
              linkedHoldingName={account.linkedHoldingName}
              linkedHoldingReturn30d={account.linkedHoldingReturn30d}
              fciHoldings={fciHoldings}
              fciCatalog={account.fciCatalog}
              closingDay={account.closing_day}
              dueDay={account.due_day}
            />
          </div>
          <div className="text-right shrink-0">
            {Array.from(consolidatedTotals.entries()).map(([cur, total]) => (
              <p
                key={cur}
                className="text-xs font-medium text-fz-text-secondary tabular-nums"
              >
                {formatCurrency(total, cur as Currency)}
              </p>
            ))}
            {consolidatedTotals.size === 0 && (
              <p className="text-xs text-fz-text-tertiary">—</p>
            )}
          </div>
        </div>

        {isExpanded && (
          <>
            {bolsilloChildren.map((child) => (
              <div
                key={child.id}
                className="border-t border-fz-border"
                style={{ paddingLeft: `${indent}px` }}
              >
                <TreeNode
                  account={child}
                  depth={depth + 1}
                  childrenMap={childrenMap}
                  accountMap={accountMap}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                  onRefresh={onRefresh}
                  fciHoldings={fciHoldings}
                />
              </div>
            ))}

            {creditChildren.length > 0 && (
              <>
                <div className="px-4 pt-2 pb-1 border-t border-fz-border">
                  <p className="text-[10px] font-medium text-fz-text-tertiary uppercase tracking-wide">
                    Tarjetas de crédito
                  </p>
                </div>
                {creditChildren.map((card) => (
                  <div key={card.id} className="border-t border-fz-border">
                    <TreeNode
                      account={card}
                      depth={depth + 1}
                      childrenMap={childrenMap}
                      accountMap={accountMap}
                      expandedIds={expandedIds}
                      onToggle={onToggle}
                      onRefresh={onRefresh}
                      fciHoldings={fciHoldings}
                    />
                  </div>
                ))}
              </>
            )}

            {canHaveChildren && (
              <div className="px-4 pb-3 border-t border-gray-50">
                <AddChildInline
                  parentId={account.id}
                  parentCurrency={account.currency}
                  parentBalance={account.balance}
                  hasChildren={hasChildren}
                  onSuccess={() => {
                    onRefresh();
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Leaf node
  const indent = depth * 16;
  const isTopLevel = depth === 0;

  if (isTopLevel) {
    return (
      <div className="bg-fz-surface rounded-2xl shadow-[var(--fz-shadow)] overflow-hidden">
        <div className="flex items-start justify-between px-4 py-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-fz-text">{account.name}</p>
            {account.type === "credito" && (
              <span className="text-[10px] text-fz-text-tertiary">Deuda</span>
            )}
            <CuentaActions
              accountId={account.id}
              accountName={account.name}
              accountType={account.type}
              currentBalance={account.balance}
              currency={account.currency}
              earnsYield={account.earns_yield}
              canChangeType={canChangeType}
              isChild={isChild}
              holdingId={account.holding_id}
              linkedHoldingName={account.linkedHoldingName}
              linkedHoldingReturn30d={account.linkedHoldingReturn30d}
              fciHoldings={fciHoldings}
              fciCatalog={account.fciCatalog}
              closingDay={account.closing_day}
              dueDay={account.due_day}
            />
          </div>
          <DiscriminatedBalance
            balance={account.balance}
            currency={account.currency}
            earmarksTotal={account.earmarksTotal}
            earmarksCuotas={account.earmarksCuotas}
            earmarksMetas={account.earmarksMetas}
          />
        </div>
        {canHaveChildren && (
          <div className="px-4 pb-3 border-t border-gray-50">
            <AddChildInline
              parentId={account.id}
              parentCurrency={account.currency}
              parentBalance={account.balance}
              hasChildren={false}
              onSuccess={() => onRefresh()}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="flex items-start justify-between py-2.5 px-4"
      style={{ paddingLeft: `${16 + indent}px` }}
    >
      <div className="min-w-0">
        <p
          className={`text-fz-text ${
            depth === 1 ? "text-sm" : "text-xs"
          }`}
        >
          {account.name}
          {account.type === "credito" && (
            <span className="ml-1 text-[10px] text-fz-text-tertiary">(Deuda)</span>
          )}
        </p>
        <CuentaActions
          accountId={account.id}
          accountName={account.name}
          accountType={account.type}
          currentBalance={account.balance}
          currency={account.currency}
          earnsYield={account.earns_yield}
          canChangeType={canChangeType}
          isChild={isChild}
          holdingId={account.holding_id}
          linkedHoldingName={account.linkedHoldingName}
          linkedHoldingReturn30d={account.linkedHoldingReturn30d}
          fciHoldings={fciHoldings}
          fciCatalog={account.fciCatalog}
          closingDay={account.closing_day}
          dueDay={account.due_day}
        />
        {canHaveChildren && (
          <AddChildInline
            parentId={account.id}
            parentCurrency={account.currency}
            parentBalance={account.balance}
            hasChildren={false}
            onSuccess={() => onRefresh()}
          />
        )}
      </div>
      <DiscriminatedBalance
        balance={account.balance}
        currency={account.currency}
        earmarksTotal={account.earmarksTotal}
        earmarksCuotas={account.earmarksCuotas}
        earmarksMetas={account.earmarksMetas}
      />
    </div>
  );
}

// ─── CuentasTree (main export) ────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  banco: "Bancos y billeteras",
  efectivo: "Efectivo",
  inversion: "Inversiones",
  usd_reserva: "Dólares / Reservas USD",
};
const TYPE_ORDER = ["banco", "efectivo", "inversion", "usd_reserva"];

export default function CuentasTree({ accounts, fciHoldings }: Props) {
  const router = useRouter();

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const childrenMap = buildChildrenMap(accounts);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(accounts.map((a) => a.id))
  );

  useEffect(() => {
    setExpandedIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const a of accounts) {
        if (!next.has(a.id)) {
          next.add(a.id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [accounts]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleRefresh() {
    router.refresh();
  }

  const roots = accounts.filter((a) => !a.parent_id);

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: roots.filter((a) => a.type === type),
  })).filter((g) => g.items.length > 0);

  const orphanCreditCards = roots.filter((a) => a.type === "credito");

  return (
    <div className="space-y-6">
      {grouped.map(({ type, label, items }) => (
        <section key={type}>
          <h2 className="text-xs font-medium text-fz-text-tertiary uppercase tracking-wide mb-2">
            {label}
          </h2>
          <div className="space-y-3">
            {items.map((account) => (
              <TreeNode
                key={account.id}
                account={account}
                depth={0}
                childrenMap={childrenMap}
                accountMap={accountMap}
                expandedIds={expandedIds}
                onToggle={toggleExpand}
                onRefresh={handleRefresh}
                fciHoldings={fciHoldings}
              />
            ))}
          </div>
        </section>
      ))}

      {orphanCreditCards.length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-fz-text-tertiary uppercase tracking-wide mb-2">
            Tarjetas de crédito
          </h2>
          <div className="space-y-3">
            {orphanCreditCards.map((card) => (
              <TreeNode
                key={card.id}
                account={card}
                depth={0}
                childrenMap={childrenMap}
                accountMap={accountMap}
                expandedIds={expandedIds}
                onToggle={toggleExpand}
                onRefresh={handleRefresh}
                fciHoldings={fciHoldings}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
