"use client";

import Link from "next/link";
import {
  TrendingUp,
  CreditCard,
  Target,
  Home,
  HandCoins,
  Users,
  Settings,
  ChevronRight,
  PanelLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { useSideMenu } from "@/components/SideMenu";

const LINKS: { href: string; label: string; desc: string; icon: LucideIcon }[] = [
  {
    href: "/inversiones",
    label: "Inversiones",
    desc: "CEDEARs, FCI, bonos",
    icon: TrendingUp,
  },
  {
    href: "/cuotas",
    label: "Cuotas",
    desc: "Tarjetas y vencimientos",
    icon: CreditCard,
  },
  {
    href: "/objetivos",
    label: "Metas de ahorro",
    desc: "Objetivos y aportes",
    icon: Target,
  },
  {
    href: "/bienes",
    label: "Bienes",
    desc: "Autos, electro, fondos",
    icon: Home,
  },
  {
    href: "/compartidos",
    label: "Gastos compartidos",
    desc: "Quién te debe qué",
    icon: HandCoins,
  },
  {
    href: "/grupos",
    label: "Grupos",
    desc: "Familiares, amigos…",
    icon: Users,
  },
  {
    href: "/configuracion",
    label: "Configuración",
    desc: "Tema, saldos, sesión",
    icon: Settings,
  },
];

export default function MasPage() {
  const { openMenu } = useSideMenu();

  return (
    <div className="px-4 pt-3 max-w-lg mx-auto bg-fz-bg min-h-[100dvh]">
      <PageHeader title="Más" subtitle="Tocá el ☰ arriba a la izquierda en cualquier pantalla." />

      <button
        type="button"
        onClick={openMenu}
        className="mt-5 mb-5 flex w-full min-h-[64px] items-center gap-3 rounded-2xl border border-fz-accent bg-fz-accent-soft px-4 text-left active:opacity-90"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fz-accent text-fz-accent-text">
          <PanelLeft size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-semibold text-fz-text">
            Abrir menú lateral
          </span>
          <span className="block text-[13px] text-fz-text-secondary">
            Todas las secciones + cerrar sesión
          </span>
        </span>
        <ChevronRight size={20} className="text-fz-accent shrink-0" />
      </button>

      <div className="bg-fz-surface border border-fz-border rounded-2xl overflow-hidden divide-y divide-fz-border">
        {LINKS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 min-h-[64px] active:bg-fz-surface-high"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fz-accent-soft">
              <item.icon size={22} className="text-fz-accent" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold text-fz-text">
                {item.label}
              </span>
              <span className="block text-[13px] text-fz-text-tertiary">
                {item.desc}
              </span>
            </span>
            <ChevronRight size={20} className="text-fz-text-tertiary shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
