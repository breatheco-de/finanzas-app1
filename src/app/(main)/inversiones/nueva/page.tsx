import { requireUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import HoldingForm from "./_components/HoldingForm";
import { fetchCedearQuotes } from "@/lib/cedearCatalog";

export default async function NuevaInversionPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: accounts }, cedearQuotes] = await Promise.all([
    supabase.from("accounts").select("id, name, parent_id").order("name"),
    fetchCedearQuotes(),
  ]);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 pt-2 mb-6">
        <Link
          href="/inversiones"
          className="text-fz-text-tertiary hover:text-fz-text transition-colors"
        >
          ←
        </Link>
        <h1 className="text-xl font-semibold text-fz-text">Nueva posición</h1>
      </div>
      <HoldingForm accounts={accounts ?? []} cedearQuotes={cedearQuotes} />
    </div>
  );
}
