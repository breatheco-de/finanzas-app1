export default function Loading() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
      <div className="flex items-center justify-between pt-2">
        <div className="h-8 w-40 bg-fz-border rounded animate-pulse" />
        <div className="h-8 w-24 bg-fz-border rounded-full animate-pulse" />
      </div>
      <div className="h-12 bg-fz-surface rounded-2xl shadow-[var(--fz-shadow)] animate-pulse" />
      <div className="grid grid-cols-2 gap-2">
        <div className="h-14 bg-fz-negative-soft rounded-xl animate-pulse" />
        <div className="h-14 bg-fz-accent-soft rounded-xl animate-pulse" />
      </div>
      <div className="bg-fz-surface rounded-2xl shadow-[var(--fz-shadow)] overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-fz-border" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-fz-border animate-pulse shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-fz-border rounded animate-pulse w-2/3" />
              <div className="h-3 bg-fz-surface-high rounded animate-pulse w-1/3" />
            </div>
            <div className="h-4 w-16 bg-fz-border rounded animate-pulse shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
