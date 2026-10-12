import Link from "next/link";
import { BrandLink } from "@/components/brand-link";
import { PasswordRecoveryForm } from "@/components/password-recovery-form";
export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  return (
    <main className="connected-wrap">
      <BrandLink className="login-logo" href="/" variant="primary" />
      <div className="page-heading">
        <div>
          <span className="eyebrow">Your real clubhouse</span>
          <h1>Reset your password</h1>
          <p>Enter your sign-in email to request a reset link.</p>
        </div>
      </div>
      {notice === "invalid-link" && (
        <p role="alert" className="form-error">
          This reset link is invalid or expired. Request a new password reset
          email.
        </p>
      )}
      <PasswordRecoveryForm />
      <Link className="text-link" href="/login">
        Back to sign in
      </Link>
    </main>
  );
}
