"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAppUser } from "@/lib/session";

export async function createCategory(input: {
  name: string;
  icon: string;
}): Promise<{ id: string } | { error: string }> {
  const user = await getAppUser();
  if (!user) return { error: "No autenticado" };
  const name = input.name.trim();
  if (!name) return { error: "Ingresá un nombre" };

  const db = await createClient();
  const { data, error } = await db
    .from("categories")
    .insert({ user_id: user.id, name, icon: input.icon })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/categorias");
  return { id: (data as { id: string }).id };
}

export async function createCategoriesBulk(
  cats: { name: string; icon: string }[]
): Promise<{ error?: string }> {
  const user = await getAppUser();
  if (!user) return { error: "No autenticado" };
  if (cats.length === 0) return { error: "Elegí al menos una" };

  const db = await createClient();
  const { error } = await db.from("categories").insert(
    cats.map((c) => ({ user_id: user.id, name: c.name, icon: c.icon }))
  );
  if (error) return { error: error.message };
  revalidatePath("/categorias");
  return {};
}
