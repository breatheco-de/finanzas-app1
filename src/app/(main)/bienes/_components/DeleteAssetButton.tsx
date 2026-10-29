"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteAsset } from "../actions";

interface Props {
  assetId: string;
  assetName: string;
}

export default function DeleteAssetButton({ assetId, assetName }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (confirming) {
    return (
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={async () => {
            setDeleting(true);
            const result = await deleteAsset(assetId);
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
