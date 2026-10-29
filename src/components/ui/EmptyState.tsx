import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="fz-card p-8 text-center space-y-3">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-fz-accent-soft">
        <Icon size={26} className="text-fz-accent" />
      </div>
      <p className="text-[15px] font-semibold text-fz-text">{title}</p>
      {description && (
        <p className="text-sm text-fz-text-secondary leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  );
}
