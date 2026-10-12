import Link from "next/link";
import { BrandLink } from "@/components/brand-link";
import { PasswordRecoveryForm } from "@/components/password-recovery-form";
import { recoveryClient } from "@/lib/supabase/recovery";
import { RECOVERY_ERROR } from "@/lib/password-recovery";
export const dynamic = "force-dynamic";
export default async function UpdatePasswordPage() {
  const eligible = await recoveryClient();
  return (
    <main className="connected-wrap">
      <BrandLink className="login-logo" href="/" variant="primary" />
      <div className="page-heading">
        <div>
          <span className="eyebrow">Your real clubhouse</span>
          <h1>Update your password</h1>
        </div>
      </div>
      {eligible ? (
        <PasswordRecoveryForm updating />
      ) : (
        <section className="card detail-card auth-card">
          <p role="alert">{RECOVERY_ERROR}</p>
          <Link className="text-link" href="/forgot-password">
            Request a new reset link
          </Link>
        </section>
      )}
    </main>
  );
}
