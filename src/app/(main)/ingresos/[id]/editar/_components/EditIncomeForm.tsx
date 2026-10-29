"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateIncome, deleteIncome } from "@/app/(main)/ingresos/actions";
import { getLeafAccounts, accountDisplayName } from "@/lib/accounts";
import { formatCurrency } from "@/lib/format";
import type { Account, Income, Currency, IncomeType } from "@/types";

interface Props {
  income: Income;
  accounts: Account[];
}

const INPUT =
  "w-full border border-fz-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fz-accent bg-fz-surface";

export default function EditIncomeForm({ income, accounts }: Props) {
  const router = useRouter();
  const leafAccounts = getLeafAccounts(accounts);

  const [amount, setAmount] = useState(income.amount.toString());
  const [currency, setCurrency] = useState<Currency>(income.currency);
  const [type, setType] = useState<IncomeType>(income.type ?? "otro");
  const [accountId, setAccountId] = useState(income.account_id ?? "");
  const [date, setDate] = useState(income.date);
  const [note, setNote] = useState(income.note ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filteredAccounts = leafAccounts.filter((a) => a.currency === currency);

  const isDistributed = income.distributed;

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (!isDistributed && (isNaN(parsedAmount) || parsedAmount <= 0)) {
      setError("Ingresá un monto válido mayor a 0");
      return;
    }

    setSaving(true);
    const result = await updateIncome(income.id, {
      ...(isDistributed ? {} : { amount: parsedAmount, currency }),
      type,
      account_id: accountId || null,
      date,
      note: note.trim() || null,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/ingresos");
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const result = await deleteIncome(income.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      setConfirmDelete(false);
      return;
    }
    router.push("/ingresos");
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 pb-8">

      {/* Monto + Moneda */}
      <div>
        <label className="block text-sm font-medium text-fz-text mb-1">Monto</label>
        {isDistributed ? (
          <div className="bg-fz-bg rounded-lg px-3 py-2">
            <p className="text-sm font-semibold text-fz-text">
              {formatCurrency(Number(income.amount), income.currency)}
            </p>
            <p className="text-[11px] text-fz-text-tertiary mt-0.5">
              El monto y la moneda no son editables: el ingreso ya fue distribuido
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min="0.01"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={INPUT}
            />
            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value as Currency);
                setAccountId("");
              }}
              className={INPUT}
            >
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
        )}
      </div>

      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-fz-text mb-1">Tipo</label>
        <select value={type} onChange={(e) => setType(e.target.value as IncomeType)} className={INPUT}>
          <option value="sueldo">Sueldo</option>
          <option value="freelance">Freelance</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      {/* Cuenta */}
      <div>
        <label className="block text-sm font-medium text-fz-text mb-1">
          Cuenta destino <span className="text-fz-text-tertiary font-normal">(opcional)</span>
        </label>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={INPUT}>
          <option value="">Sin cuenta específica</option>
          {filteredAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {accountDisplayName(a, accounts)}
            </option>
          ))}
        </select>
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-fz-text mb-1">Fecha</label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={INPUT}
        />
      </div>

      {/* Nota */}
      <div>
        <label className="block text-sm font-medium text-fz-text mb-1">
          Nota <span className="text-fz-text-tertiary font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ej: Sueldo julio 2026"
          className={INPUT}
        />
      </div>

      {error && (
        <p className="text-sm text-fz-negative bg-fz-negative-soft rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-fz-accent text-fz-accent-text rounded-xl py-3 text-sm font-medium disabled:opacity-40 transition-opacity"
      >
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>

      {/* Si no distribuido: botón Distribuir ahora */}
      {!isDistributed && (
        <button
          type="button"
          onClick={() => router.push(`/ingresos/distribuir?ingreso_id=${income.id}`)}
          className="w-full border border-fz-border text-fz-accent rounded-xl py-3 text-sm font-medium hover:bg-fz-accent-soft transition-colors"
        >
          Distribuir ahora →
        </button>
      )}

      {/* Eliminar */}
      <div className="pt-2">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2.5 rounded-xl border border-red-200 text-fz-negative text-sm hover:bg-fz-negative-soft transition-colors"
          >
            Eliminar ingreso
          </button>
        ) : (
          <div className="space-y-2">
            {isDistributed && (
              <p className="text-sm text-center text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                ⚠ Este ingreso ya fue distribuido. Los saldos de las cuentas NO se revertirán.
              </p>
            )}
            <p className="text-sm text-center text-fz-text-secondary">
              {isDistributed
                ? "¿Eliminar el registro del ingreso?"
                : "¿Confirmar eliminación?"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-fz-border text-sm text-fz-text-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-fz-accent-text text-sm font-medium disabled:opacity-40"
              >
                {deleting ? "…" : "Sí, eliminar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
