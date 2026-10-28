"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Receipt,
  Landmark,
  LayoutGrid,
  Plus,
  X,
  ArrowLeftRight,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TABS: {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (p: string) => boolean;
}[] = [
  { href: "/", label: "Inicio", icon: Home, match: (p) => p === "/" },
  {
    href: "/movimientos",
    label: "Movs",
    icon: Receipt,
    match: (p) =>
      p.startsWith("/movimientos") ||
      p.startsWith("/gastos") ||
      p.startsWith("/ingresos"),
  },
  {
    href: "/cuentas",
    label: "Cuentas",
    icon: Landmark,
    match: (p) => p.startsWith("/cuentas"),
  },
  {
    href: "/mas",
    label: "Más",
    icon: LayoutGrid,
    match: (p) =>
      p.startsWith("/mas") ||
      p.startsWith("/inversiones") ||
      p.startsWith("/cuotas") ||
      p.startsWith("/objetivos") ||
      p.startsWith("/bienes") ||
      p.startsWith("/compartidos") ||
      p.startsWith("/grupos") ||
      p.startsWith("/configuracion") ||
      p.startsWith("/seed-demo"),
  },
];

const QUICK_ADD: {
  href: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
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
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function isActive(tab: (typeof TABS)[0]) {
    return tab.match ? tab.match(pathname) : pathname.startsWith(tab.href);
  }

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

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 mx-auto w-full max-w-lg rounded-t-[28px] bg-fz-surface px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_40px_rgba(0,0,0,0.2)]">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-fz-border" />
            <p className="mb-3 text-center text-sm font-semibold text-fz-text">
              ¿Qué querés hacer?
            </p>
            <div className="space-y-2">
              {QUICK_ADD.map((action) => (
                <button
                  key={action.href}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.push(action.href);
                  }}
                  className="flex w-full min-h-[64px] items-center gap-4 rounded-2xl bg-fz-surface-high px-4 py-3 text-left active:opacity-80"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fz-accent text-fz-accent-text">
                    <action.icon size={22} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[17px] font-semibold text-fz-text">
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
              className="mt-3 flex w-full min-h-[52px] items-center justify-center rounded-2xl text-[17px] font-medium text-fz-text-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-fz-border bg-fz-nav-bg pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex h-16 max-w-lg items-stretch">
          {TABS.slice(0, 2).map((tab) => (
            <TabLink key={tab.href} tab={tab} active={isActive(tab)} />
          ))}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex flex-1 flex-col items-center justify-center"
            aria-label={open ? "Cerrar" : "Agregar"}
            aria-expanded={open}
          >
            <span
              className={`-mt-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors ${
                open
                  ? "bg-fz-text text-fz-bg"
                  : "bg-fz-accent text-fz-accent-text"
              }`}
            >
              {open ? <X size={26} /> : <Plus size={28} strokeWidth={2.5} />}
            </span>
            <span className="mt-0.5 text-[10px] font-medium text-fz-text-tertiary">
              Nuevo
            </span>
          </button>

          {TABS.slice(2).map((tab) => (
            <TabLink key={tab.href} tab={tab} active={isActive(tab)} />
          ))}
        </div>
      </nav>
    </>
  );
}

function TabLink({
  tab,
  active,
}: {
  tab: (typeof TABS)[0];
  active: boolean;
}) {
  return (
    <Link
      href={tab.href}
      className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] ${
        active ? "font-semibold text-fz-accent" : "text-fz-text-tertiary"
      }`}
    >
      <tab.icon size={24} strokeWidth={active ? 2.5 : 2} />
      <span className="leading-none">{tab.label}</span>
    </Link>
  );
}
