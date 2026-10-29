"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Plus, X, Receipt, Wallet, ArrowLeftRight } from "lucide-react";

const ACTIONS = [
  {
    href: "/gastos/nuevo",
    label: "Gasto",
    hint: "Lo más usado",
    icon: Receipt,
  },
  {
    href: "/ingresos/nuevo",
    label: "Ingreso",
    hint: "Sueldo u otro",
    icon: Wallet,
  },
  {
    href: "/cuentas/transferencia",
    label: "Transferencia",
    hint: "Entre tus cuentas",
    icon: ArrowLeftRight,
  },
] as const;

function shouldHide(pathname: string) {
  if (pathname.includes("/nuevo")) return true;
  if (pathname.includes("/editar")) return true;
  if (pathname.includes("/distribuir")) return true;
  if (pathname.includes("/transferencia")) return true;
  if (pathname.startsWith("/login")) return true;
  return false;
}

export default function QuickAddFab() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (shouldHide(pathname)) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[75] flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative z-10 mx-auto w-full max-w-lg rounded-t-[28px] bg-fz-surface border-t border-fz-border px-4 pt-3 shadow-[var(--fz-shadow-lg)]"
            style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-fz-border" />
            <p className="mb-3 text-center text-[15px] font-semibold tracking-tight text-fz-text">
              ¿Qué querés hacer?
            </p>
            <div className="space-y-2">
              {ACTIONS.map((action) => (
                <button
                  key={action.href}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(action.href);
                  }}
                  className="flex w-full min-h-[64px] items-center gap-4 rounded-[18px] border border-fz-border bg-fz-bg px-4 py-3 text-left active:bg-fz-surface-high transition-colors duration-150"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-fz-accent text-fz-accent-text">
                    <action.icon size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[17px] font-semibold tracking-tight text-fz-text">
                      {action.label}
                    </span>
                    <span className="block text-sm text-fz-text-tertiary">
                      {action.hint}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 flex w-full min-h-[52px] items-center justify-center rounded-[16px] text-[16px] font-medium text-fz-text-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar" : "Agregar"}
        aria-expanded={open}
        className={`fixed z-[76] flex h-[3.5rem] w-[3.5rem] items-center justify-center rounded-full transition-all duration-150 active:scale-95 ${
          open
            ? "bg-fz-text text-fz-bg shadow-[var(--fz-shadow)]"
            : "bg-fz-accent text-fz-accent-text shadow-[var(--fz-shadow-lg)]"
        }`}
        style={{
          right: "max(1rem, env(safe-area-inset-right))",
          bottom: "max(1.25rem, env(safe-area-inset-bottom))",
        }}
      >
        {open ? <X size={24} /> : <Plus size={28} strokeWidth={2.5} />}
      </button>
    </>
  );
}
