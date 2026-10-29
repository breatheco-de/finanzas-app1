"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Receipt,
  Landmark,
  TrendingUp,
  CreditCard,
  Target,
  House,
  HandCoins,
  Users,
  Settings,
  X,
  Menu,
  ArrowLeftRight,
  Wallet,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

type NavItem = { href: string; label: string; desc?: string; icon: LucideIcon };

const PRIMARY: NavItem[] = [
  { href: "/", label: "Inicio", desc: "Resumen y saldo", icon: Home },
  { href: "/movimientos", label: "Movimientos", desc: "Gastos e ingresos", icon: Receipt },
  { href: "/cuentas", label: "Cuentas", desc: "Saldos y tarjetas", icon: Landmark },
];

const MONEY: NavItem[] = [
  { href: "/gastos/nuevo", label: "Nuevo gasto", icon: Plus },
  { href: "/ingresos/nuevo", label: "Nuevo ingreso", icon: Wallet },
  { href: "/cuentas/transferencia", label: "Transferencia", icon: ArrowLeftRight },
  { href: "/cuotas", label: "Cuotas", desc: "Vencimientos", icon: CreditCard },
];

const PLANNING: NavItem[] = [
  { href: "/inversiones", label: "Inversiones", desc: "CEDEARs, FCI, bonos", icon: TrendingUp },
  { href: "/objetivos", label: "Metas", desc: "Ahorro e objetivos", icon: Target },
  { href: "/bienes", label: "Bienes", desc: "Auto, electro…", icon: House },
  { href: "/compartidos", label: "Compartidos", desc: "Quién te debe", icon: HandCoins },
  { href: "/grupos", label: "Grupos", desc: "Familiares, amigos", icon: Users },
];

const ACCOUNT: NavItem[] = [
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

type SideMenuCtx = {
  open: boolean;
  openMenu: () => void;
  closeMenu: () => void;
  toggleMenu: () => void;
};

const SideMenuContext = createContext<SideMenuCtx | null>(null);

export function useSideMenu() {
  const ctx = useContext(SideMenuContext);
  if (!ctx) {
    throw new Error("useSideMenu debe usarse dentro de SideMenuProvider");
  }
  return ctx;
}

/** Abre el menú sin tirar si todavía no hay provider (SSR / edge). */
export function openSideMenu() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("finanzas:openSideMenu"));
  }
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function MenuButton({ className }: { className?: string }) {
  const { openMenu } = useSideMenu();
  return (
    <button
      type="button"
      onClick={openMenu}
      aria-label="Abrir menú"
      className={
        className ??
        "flex h-11 w-11 items-center justify-center rounded-[14px] bg-fz-surface border border-fz-border text-fz-text shadow-[var(--fz-shadow)] active:bg-fz-surface-high transition-colors duration-150"
      }
    >
      <Menu size={20} strokeWidth={2.25} />
    </button>
  );
}

export function SideMenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const openMenu = useCallback(() => setOpen(true), []);
  const closeMenu = useCallback(() => setOpen(false), []);
  const toggleMenu = useCallback(() => setOpen((v) => !v), []);

  const value = useMemo(
    () => ({ open, openMenu, closeMenu, toggleMenu }),
    [open, openMenu, closeMenu, toggleMenu]
  );

  // Cerrar al navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // API global (botones fuera del árbol / /mas)
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("finanzas:openSideMenu", onOpen);
    return () => window.removeEventListener("finanzas:openSideMenu", onOpen);
  }, []);

  // Bloquear scroll + Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Swipe desde el borde
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking: "edge" | "drawer" | null = null;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      if (!open && startX <= 28) tracking = "edge";
      else if (open && startX < Math.min(window.innerWidth * 0.86, 352))
        tracking = "drawer";
      else tracking = null;
    };

    const onEnd = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dy > 70) {
        tracking = null;
        return;
      }
      if (tracking === "edge" && dx > 50) setOpen(true);
      if (tracking === "drawer" && dx < -50) setOpen(false);
      tracking = null;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [open]);

  return (
    <SideMenuContext.Provider value={value}>
      {children}
      <Drawer open={open} pathname={pathname} onClose={closeMenu} />
    </SideMenuContext.Provider>
  );
}

function Drawer({
  open,
  pathname,
  onClose,
}: {
  open: boolean;
  pathname: string;
  onClose: () => void;
}) {
  return (
    <div
      className={`fixed inset-0 z-[80] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Cerrar menú"
        onClick={onClose}
        className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={`absolute inset-y-0 left-0 flex w-[min(88vw,22rem)] max-w-full flex-col bg-fz-surface shadow-[var(--fz-shadow-lg)] transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-fz-border px-4 py-4">
          <div>
            <p className="font-display text-[22px] font-bold tracking-tight text-fz-text">
              Menú
            </p>
            <p className="text-[13px] text-fz-text-tertiary mt-0.5">
              Toda la app en un lugar
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-fz-surface-high text-fz-text-secondary active:opacity-80"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Section title="Principal" items={PRIMARY} pathname={pathname} onNavigate={onClose} />
          <Section title="Cargar / pagar" items={MONEY} pathname={pathname} onNavigate={onClose} />
          <Section title="Planificar" items={PLANNING} pathname={pathname} onNavigate={onClose} />
          <Section title="Cuenta" items={ACCOUNT} pathname={pathname} onNavigate={onClose} />

          <div className="mt-4 rounded-2xl border border-fz-border bg-fz-surface-high px-3 py-2 text-center">
            <LogoutButton variant="block" />
          </div>
        </nav>
      </aside>
    </div>
  );
}

function Section({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <div className="mb-5">
      <p className="fz-section-label mb-2 px-2">{title}</p>
      <div className="space-y-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex min-h-[54px] items-center gap-3 rounded-[16px] px-3 transition-colors duration-150 ${
                active
                  ? "bg-fz-accent-soft text-fz-accent"
                  : "text-fz-text active:bg-fz-surface-high"
              }`}
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
                  active
                    ? "bg-fz-accent text-fz-accent-text"
                    : "bg-fz-surface-high text-fz-accent"
                }`}
              >
                <item.icon size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold tracking-tight">
                  {item.label}
                </span>
                {item.desc && (
                  <span className="block text-[12px] text-fz-text-tertiary">
                    {item.desc}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** @deprecated Usar SideMenuProvider — se mantiene por compat. */
export default function SideMenu() {
  return null;
}
