"use server";

import { randomBytes, createHash } from "node:crypto";
import { hash } from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { getDb, passwordResetTokens, users } from "@/lib/db";

const MIN_PASSWORD = 6;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export type AuthActionResult = { ok: true } | { ok: false; error: string };

export async function registerUser(
  emailRaw: string,
  password: string
): Promise<AuthActionResult> {
  const email = normalizeEmail(emailRaw);
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Email inválido" };
  }
  if (password.length < MIN_PASSWORD) {
    return { ok: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres` };
  }

  const db = getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    return { ok: false, error: "Ya existe una cuenta con ese email" };
  }

  const passwordHash = await hash(password, 12);
  await db.insert(users).values({
    email,
    passwordHash,
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Cuenta creada, pero no se pudo iniciar sesión. Probá ingresar." };
    }
    throw err;
  }

  return { ok: true };
}

export async function loginUser(
  emailRaw: string,
  password: string
): Promise<AuthActionResult> {
  const email = normalizeEmail(emailRaw);
  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: "Email o contraseña incorrectos" };
    }
    throw err;
  }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Crea un token de reset. Sin proveedor de email (costo cero):
 * si AUTH_RESET_LOG_LINKS=1, loguea el link en el server (útil en Railway logs).
 * Siempre responde igual al cliente (no filtra si el email existe).
 */
export async function requestPasswordReset(
  emailRaw: string
): Promise<AuthActionResult & { resetUrl?: string }> {
  const email = normalizeEmail(emailRaw);
  const db = getDb();
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Misma respuesta aunque no exista (anti-enumeración)
  if (!user) {
    return { ok: true };
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const base =
    process.env.AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  const resetUrl = `${base.replace(/\/$/, "")}/reset-password?token=${token}`;

  if (process.env.AUTH_RESET_LOG_LINKS === "1") {
    console.info("[auth] reset link:", resetUrl);
  }

  // En desarrollo devolvemos el link para no depender de email todavía
  if (process.env.NODE_ENV === "development" || process.env.AUTH_RESET_LOG_LINKS === "1") {
    return { ok: true, resetUrl };
  }

  return { ok: true };
}

export async function resetPasswordWithToken(
  token: string,
  newPassword: string
): Promise<AuthActionResult> {
  if (!token || newPassword.length < MIN_PASSWORD) {
    return { ok: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres` };
  }

  const db = getDb();
  const tokenHash = hashToken(token);
  const now = new Date();

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!row) {
    return { ok: false, error: "El link expiró o no es válido. Pedí uno nuevo." };
  }

  const passwordHash = await hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, row.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(eq(passwordResetTokens.id, row.id));

  return { ok: true };
}
