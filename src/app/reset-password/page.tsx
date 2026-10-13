import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { BrandLink } from "@/components/brand-link";
import { PasswordResetForm } from "@/components/password-reset-form";

export const dynamic = "force-dynamic";
export default async function ResetPasswordPage() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/forgot-password?error=expired");
  return (
    <main className="connected-wrap">
      <BrandLink className="login-logo" href="/" variant="primary" />
      <h1>Choose a new password</h1>
      <PasswordResetForm updating />
      <Link className="text-link" href="/club">
        Return to clubhouse
      </Link>
    </main>
  );
}
