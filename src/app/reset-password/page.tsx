import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ResetPasswordForm from "./_components/ResetPasswordForm";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/forgot-password");

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
        <ResetPasswordForm />
      </div>
    </div>
  );
}
