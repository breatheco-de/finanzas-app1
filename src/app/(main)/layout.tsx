import { SideMenuProvider } from "@/components/SideMenu";
import QuickAddFab from "@/components/QuickAddFab";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SideMenuProvider>
      <main className="pb-[calc(5rem+env(safe-area-inset-bottom))]">{children}</main>
      <QuickAddFab />
    </SideMenuProvider>
  );
}
