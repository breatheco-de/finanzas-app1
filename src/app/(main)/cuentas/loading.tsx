export default function Loading() {
  return (
    <div className="p-4 max-w-lg mx-auto animate-pulse">
      <div className="flex items-center justify-between pt-2 mb-6">
        <div className="h-7 w-24 bg-fz-border rounded-lg" />
        <div className="h-8 w-28 bg-fz-border rounded-lg" />
      </div>
      <div className="space-y-6">
        {[1, 2].map((group) => (
          <div key={group}>
            <div className="h-3 w-20 bg-fz-border rounded mb-3" />
            <div className="bg-fz-surface rounded-2xl shadow-[var(--fz-shadow)] overflow-hidden">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center px-4 py-4 border-t first:border-t-0 border-fz-border">
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-fz-border rounded" />
                    <div className="h-3 w-16 bg-fz-surface-high rounded" />
                  </div>
                  <div className="h-4 w-20 bg-fz-border rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
