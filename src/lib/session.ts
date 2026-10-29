import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export type AppUser = {
  id: string;
  email: string;
  name?: string | null;
};

/** Sesión actual (Auth.js). null si no hay login. */
export async function getAppUser(): Promise<AppUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  const email = session?.user?.email;
  if (!id || !email) return null;
  return {
    id,
    email,
    name: session.user.name,
  };
}

/** Exige sesión; redirige a /login si no hay. Usar en RSC y Server Actions. */
export async function requireUser(): Promise<AppUser> {
  const user = await getAppUser();
  if (!user) redirect("/login");
  return user;
}
