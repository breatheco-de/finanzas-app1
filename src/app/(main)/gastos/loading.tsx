export default function Loading() {
  return (
    <div className="p-4 max-w-lg mx-auto animate-pulse">
      <div className="flex items-center justify-between pt-2 mb-6">
        <div className="h-7 w-20 bg-fz-border rounded-lg" />
        <div className="h-8 w-28 bg-fz-border rounded-lg" />
      </div>
      <div className="bg-fz-surface rounded-2xl shadow-[var(--fz-shadow)] overflow-hidden">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-t first:border-t-0 border-fz-border">
            <div className="h-8 w-8 bg-fz-border rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-36 bg-fz-border rounded" />
              <div className="h-3 w-20 bg-fz-surface-high rounded" />
            </div>
            <div className="h-4 w-16 bg-fz-border rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
