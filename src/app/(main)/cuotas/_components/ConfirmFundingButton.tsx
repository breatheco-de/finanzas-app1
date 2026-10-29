"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { accountDisplayName } from "@/lib/accounts";
import { confirmEarmarkFunding } from "../actions";
import { formatCurrency } from "@/lib/format";
import type { Account, Currency } from "@/types";

interface Props {
  earmarkId: string;
  earmarkAmount: number;
  earmarkCurrency: Currency;
  coveringAccountName: string;
  expenseName: string;
  // Solo cuentas con la misma moneda que el earmark (filtradas en el server)
  leafAccounts: Account[];
  allAccounts: Account[];
}

export default function ConfirmFundingButton({
  earmarkId,
  earmarkAmount,
  earmarkCurrency,
  coveringAccountName,
  expenseName,
  leafAccounts,
  allAccounts,
}: Props) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(leafAccounts[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = leafAccounts.find((a) => a.id === selectedAccountId);
  const isInsufficient = selectedAccount && selectedAccount.balance < earmarkAmount;

  async function handleConfirm() {
    if (!selectedAccountId) return;
    setLoading(true);
    setError(null);
    const result = await confirmEarmarkFunding(earmarkId, selectedAccountId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setShowModal(false);
    router.refresh();
  }

  if (leafAccounts.length === 0) {
    return (
      <span className="text-[10px] text-fz-text-tertiary">Sin cuentas disponibles</span>
    );
  }

  return (
    <>
      <button
        onClick={() => { setShowModal(true); setError(null); }}
        className="text-xs font-medium text-fz-accent border border-fz-border rounded-full px-3 py-1.5 hover:bg-fz-accent-soft transition-colors"
      >
        Confirmar
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40">
          <div className="bg-fz-surface rounded-t-2xl w-full max-w-lg p-5 pb-24 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-fz-text">
                Confirmar transferencia
              </h2>
              <p className="text-sm text-fz-text-secondary mt-0.5">
                {expenseName} · {formatCurrency(earmarkAmount, earmarkCurrency)} →{" "}
                <span className="font-medium">{coveringAccountName}</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-fz-text mb-1">
                ¿De qué cuenta sale la plata?
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => { setSelectedAccountId(e.target.value); setError(null); }}
                className="w-full border border-fz-border rounded-lg px-3 py-2 text-sm bg-fz-surface focus:outline-none focus:ring-2 focus:ring-fz-accent"
              >
                {leafAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {accountDisplayName(acc, allAccounts)} (
                    {formatCurrency(acc.balance, acc.currency)})
                  </option>
                ))}
              </select>
              {isInsufficient && (
                <p className="text-[11px] text-amber-600 mt-1">
                  ⚠ Saldo insuficiente — la cuenta quedaría en{" "}
                  {formatCurrency(selectedAccount.balance - earmarkAmount, earmarkCurrency)}.
                  Podés continuar igualmente.
                </p>
              )}
            </div>

            {error && (
              <p className="text-sm text-fz-negative bg-fz-negative-soft rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-fz-border text-sm text-fz-text-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading || !selectedAccountId}
                className="flex-1 py-2.5 rounded-xl bg-fz-accent text-fz-accent-text text-sm font-medium disabled:opacity-40"
              >
                {loading ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
