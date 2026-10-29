import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import EditAssetForm from "./_components/EditAssetForm";
import type { Asset } from "@/types";

export default async function EditarBienPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("assets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!data) notFound();

  const asset = data as Asset;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 pt-2 mb-6">
        <Link href="/bienes" className="text-sm text-fz-text-tertiary hover:text-fz-text">
          ← Bienes
        </Link>
        <h1 className="text-xl font-semibold text-fz-text">Editar bien</h1>
      </div>
      <EditAssetForm asset={asset} />
    </div>
  );
}
