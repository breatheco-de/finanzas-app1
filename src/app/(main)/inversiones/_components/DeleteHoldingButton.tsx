"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteHolding } from "../actions";

interface Props {
  holdingId: string;
  linkedAccountName: string | null;
}

export default function DeleteHoldingButton({ holdingId, linkedAccountName }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (linkedAccountName) {
    return (
      <p className="text-[11px] text-fz-text-tertiary">
        Vinculado a &quot;{linkedAccountName}&quot; — desvinculalo en /cuentas para poder eliminar
      </p>
    );
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={async () => {
            setDeleting(true);
            const result = await deleteHolding(holdingId);
            if (result.error) {
              alert(result.error);
              setDeleting(false);
              setConfirming(false);
            } else {
              router.refresh();
            }
          }}
          disabled={deleting}
          className="text-[11px] text-fz-negative font-medium disabled:opacity-40"
        >
          {deleting ? "Eliminando…" : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-[11px] text-fz-text-tertiary"
        >
          Cancelar
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-[11px] text-fz-text-tertiary hover:text-fz-negative"
    >
      Eliminar
    </button>
  );
}
