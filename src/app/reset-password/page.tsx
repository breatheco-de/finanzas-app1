import Link from "next/link";
import { redirect } from "next/navigation";
import ResetPasswordForm from "./_components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) redirect("/forgot-password");

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-fz-bg px-5">
      <div className="fz-card w-full max-w-sm p-8 space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl tracking-tight text-fz-text">
            Nueva contraseña
          </h1>
          <p className="text-[15px] text-fz-text-secondary mt-2">
            Elegí una contraseña nueva para tu cuenta.
          </p>
        </div>
        <ResetPasswordForm token={token} />
        <Link href="/login" className="fz-btn-ghost w-full inline-flex">
          Volver al login
        </Link>
      </div>
    </div>
  );
}
