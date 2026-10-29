"use client";

import type { ReactNode } from "react";
import { MenuButton } from "@/components/SideMenu";

/** Header móvil: hamburguesa + título + acciones a la derecha. */
export default function PageHeader({
  title,
  children,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <div className="flex items-center gap-3 min-w-0">
        <MenuButton />
        <div className="min-w-0">
          <h1 className="font-display font-bold text-[22px] leading-tight tracking-tight text-fz-text truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-fz-text-tertiary truncate leading-snug">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {children ? (
        <div className="flex items-center gap-2 shrink-0">{children}</div>
      ) : null}
    </div>
  );
}
