"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTransfer } from "../../actions";
import { accountDisplayName } from "@/lib/accounts";
import { formatCurrency } from "@/lib/format";
import type { Account, Currency } from "@/types";

interface Props {
  accounts: Account[];
}

const INPUT =
  "w-full min-h-[52px] border border-fz-border rounded-2xl px-4 text-[16px] text-fz-text bg-fz-bg focus:outline-none focus:ring-2 focus:ring-fz-accent";

export default function TransferenciaForm({ accounts }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [fromId, setFromId] = useState(accounts[0]?.id ?? "");
  const [toId, setToId] = useState(accounts[1]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fromAccount = accounts.find((a) => a.id === fromId);
  const toAccount = accounts.find((a) => a.id === toId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(amount.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) {
      setError("Ingresá un monto válido mayor a 0");
      return;
    }
    if (fromId === toId) {
      setError("La cuenta origen y destino no pueden ser la misma");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const result = await createTransfer({
        from_account_id: fromId,
        to_account_id: toId,
        amount: parsed,
        currency: (fromAccount?.currency ?? "ARS") as Currency,
        date,
        note: note.trim() || null,
      });

      if (result.error) {
        setError(result.error);
        setSaving(false);
      } else {
        router.push("/cuentas");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-8">
      <section className="bg-fz-surface border border-fz-border rounded-2xl p-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-fz-text">Cuenta origen</label>
          <select
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            className={INPUT}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {accountDisplayName(a, accounts)} ({a.currency}) —{" "}
                {formatCurrency(Number(a.balance), a.currency)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-fz-text">Cuenta destino</label>
          <select
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            className={INPUT}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {accountDisplayName(a, accounts)} ({a.currency}) —{" "}
                {formatCurrency(Number(a.balance), a.currency)}
              </option>
            ))}
          </select>
          {fromAccount &&
            toAccount &&
            fromAccount.currency !== toAccount.currency && (
              <p className="text-[12px] text-amber-700 mt-1">
                Monedas distintas: el monto se mueve tal cual, sin conversión.
              </p>
            )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-fz-text">
            Monto ({fromAccount?.currency ?? "ARS"})
          </label>
          <input
            type="text"
            inputMode="decimal"
            required
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${INPUT} font-mono`}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-fz-text">Fecha</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={INPUT}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-fz-text">
            Nota <span className="text-fz-text-tertiary font-normal">(opcional)</span>
          </label>
          <input
            type="text"
            placeholder="ej: Paso de banco a inversiones"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={INPUT}
          />
        </div>
      </section>

      {error && (
        <p className="text-sm text-fz-negative bg-fz-negative-soft rounded-2xl px-3 py-2 text-center">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={saving || !amount || fromId === toId}
        className="w-full min-h-[56px] bg-fz-accent text-fz-accent-text rounded-2xl text-[17px] font-semibold disabled:opacity-40 active:opacity-90"
      >
        {saving ? "Transfiriendo…" : "Confirmar transferencia"}
      </button>
    </form>
  );
}
