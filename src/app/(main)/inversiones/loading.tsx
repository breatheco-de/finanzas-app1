export default function Loading() {
  return (
    <div className="p-4 max-w-lg mx-auto animate-pulse">
      <div className="flex items-center justify-between pt-2 mb-6">
        <div className="h-7 w-28 bg-fz-border rounded-lg" />
        <div className="h-8 w-24 bg-fz-border rounded-lg" />
      </div>
      <div className="bg-fz-surface rounded-2xl p-4 shadow-[var(--fz-shadow)] mb-6 space-y-2">
        <div className="h-3 w-24 bg-fz-border rounded" />
        <div className="h-8 w-44 bg-fz-border rounded" />
        <div className="h-4 w-32 bg-fz-surface-high rounded" />
      </div>
      <div className="bg-fz-surface rounded-2xl shadow-[var(--fz-shadow)] overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between px-4 py-4 border-t first:border-t-0 border-fz-border">
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <div className="h-5 w-12 bg-fz-border rounded" />
                <div className="h-5 w-28 bg-fz-border rounded" />
              </div>
              <div className="h-3 w-36 bg-fz-surface-high rounded" />
            </div>
            <div className="text-right space-y-1">
              <div className="h-4 w-20 bg-fz-border rounded" />
              <div className="h-3 w-14 bg-fz-surface-high rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
