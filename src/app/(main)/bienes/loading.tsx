export default function BienesLoading() {
  return (
    <div className="p-4 max-w-lg mx-auto space-y-6 animate-pulse">
      <div className="h-8 bg-fz-surface-high rounded-lg w-32 mt-2" />
      <div className="h-24 bg-fz-surface-high rounded-2xl" />
      <div className="space-y-px">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-fz-surface-high rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
