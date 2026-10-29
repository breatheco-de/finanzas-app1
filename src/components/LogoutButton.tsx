"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

interface Props {
  /** "link" = texto chico gris (Inicio). "block" = botón rojo en Configuración. */
  variant?: "link" | "block";
}

export default function LogoutButton({ variant = "link" }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await signOut({ redirect: false });
    router.push("/login");
    router.refresh();
  }

  if (variant === "block") {
    return (
      <button
        onClick={handleLogout}
        className="text-sm font-semibold text-fz-negative py-3"
      >
        Cerrar sesión
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-fz-text-secondary hover:text-fz-text transition-colors"
    >
      Cerrar sesión
    </button>
  );
}
