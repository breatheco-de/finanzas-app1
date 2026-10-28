import BottomNav from "@/components/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Padding extra: barra 64px + botón + que sobresale + safe area */}
      <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
