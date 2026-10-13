import Link from "next/link";
import { BrandLink } from "@/components/brand-link";
import { PasswordResetForm } from "@/components/password-reset-form";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="connected-wrap">
      <BrandLink className="login-logo" href="/" variant="primary" />
      <h1>Reset your password</h1>
      <p>Enter the email for your existing player account.</p>
      {error && (
        <p role="alert" className="form-error">
          That reset link is invalid or expired. Request a fresh link and open
          it in the same browser.
        </p>
      )}
      <PasswordResetForm />
      <Link className="text-link" href="/login">
        Back to sign in
      </Link>
    </main>
  );
}
