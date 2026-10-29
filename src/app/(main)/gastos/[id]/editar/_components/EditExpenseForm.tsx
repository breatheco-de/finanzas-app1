"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getLeafAccounts, accountDisplayName } from "@/lib/accounts";
import { formatInputAmount } from "@/lib/format";
import AmountInput from "@/components/AmountInput";
import { updateExpense, deleteExpense } from "@/app/(main)/gastos/actions";
import type { Account, Category, Expense } from "@/types";

interface Props {
  expense: Expense;
  accounts: Account[];
  categories: Category[];
}

export default function EditExpenseForm({ expense, accounts, categories }: Props) {
  const router = useRouter();
  const isCredito = expense.payment_method === "credito";
  const leafAccounts = getLeafAccounts(accounts);

  // Sesión J.1.14, TAREA 5: antes redondeaba el monto ARS al abrir el form
  // (asumía enteros); con AmountInput aceptando decimales ahora, redondear acá
  // truncaría centavos reales de gastos ya cargados apenas se abre la edición.
  const [amount, setAmount] = useState(expense.amount.toString());
  const [categoryId, setCategoryId] = useState(expense.category_id ?? "");
  const [merchant, setMerchant] = useState(expense.merchant ?? "");
  const [description, setDescription] = useState(expense.description ?? "");
  const [date, setDate] = useState(expense.date);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const parsed = parseFloat(amount.replace(",", "."));
    if (!isCredito && (isNaN(parsed) || parsed <= 0)) {
      setError("Ingresá un monto válido mayor a 0");
      return;
    }

    setSaving(true);
    const result = await updateExpense(expense.id, {
      amount: isCredito ? undefined : parsed,
      merchant: merchant.trim() || null,
      description: description.trim() || null,
      categoryId: categoryId || null,
      date,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    router.push("/gastos");
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const result = await deleteExpense(expense.id);
    setDeleting(false);
    if (result.error) {
      setError(result.error);
      setConfirmDelete(false);
      return;
    }
    router.push("/gastos");
  }

  const accountName = leafAccounts.find((a) => a.id === expense.account_id);

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {/* Monto */}
      <div>
        <label className="block text-sm font-medium text-fz-text mb-1">Monto</label>
        {isCredito ? (
          <div className="bg-fz-bg rounded-lg px-3 py-2">
            <p className="text-sm font-semibold text-fz-text">
              {formatInputAmount(expense.amount.toString(), "ARS")}
            </p>
            <p className="text-[11px] text-fz-text-tertiary mt-0.5">
              El monto de gastos en cuotas no se puede editar
              ({expense.installments_total} cuota{expense.installments_total !== 1 ? "s" : ""})
            </p>
          </div>
        ) : (
          <div>
            {expense.currency === "ARS" ? (
              <AmountInput
                required
                value={amount}
                onChange={setAmount}
                placeholder="0"
                className="w-full border border-fz-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fz-accent text-right text-lg font-semibold"
              />
            ) : (
              <input
                type="number"
                inputMode="decimal"
                required
                min="0.01"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-fz-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-fz-accent text-right text-lg font-semibold"
              />
            )}
            {amount && expense.currency === "ARS" && (
              <p className="text-[11px] text-fz-text-tertiary text-right mt-0.5">
                {formatInputAmount(amount, "ARS")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Info de pago — read only */}
      <div className="text-sm text-fz-text-secondary bg-fz-bg rounded-lg px-3 py-2 space-y-0.5">
        <p>Método: <span className="font-medium text-fz-text capitalize">{expense.payment_method ?? "—"}</span></p>
        {accountName && (
          <p>Cuenta: <span className="font-medium text-fz-text">{accountDisplayName(accountName, accounts)}</span></p>
        )}
      </div>

      {/* Comercio */}
      <div>
        <label className="block text-sm font-medium text-fz-text mb-1">
          Comercio <span className="text-fz-text-tertiary font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          placeholder="Ej: Carrefour, YPF"
          className="w-full border border-fz-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fz-accent bg-fz-surface text-fz-text"
        />
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-fz-text mb-1">Categoría</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full border border-fz-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fz-accent bg-fz-surface text-fz-text"
        >
          <option value="">Sin categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Nota */}
      <div>
        <label className="block text-sm font-medium text-fz-text mb-1">
          Nota <span className="text-fz-text-tertiary font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-fz-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fz-accent bg-fz-surface text-fz-text"
        />
      </div>

      {/* Fecha */}
      <div>
        <label className="block text-sm font-medium text-fz-text mb-1">Fecha</label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full border border-fz-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fz-accent bg-fz-surface text-fz-text"
        />
      </div>

      {error && (
        <p className="text-sm text-fz-negative bg-fz-negative-soft rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-fz-accent text-fz-accent-text rounded-xl py-3 text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-colors"
      >
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>

      {/* Eliminar */}
      <div className="pt-2">
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2.5 rounded-xl border border-red-200 text-fz-negative text-sm hover:bg-fz-negative-soft transition-colors"
          >
            Eliminar gasto
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-center text-fz-text-secondary">
              ¿Confirmar? El balance de la cuenta se va a revertir.
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
                {deleting ? "..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
