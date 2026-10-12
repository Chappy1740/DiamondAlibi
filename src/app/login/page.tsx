import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { BrandLink } from "@/components/brand-link";
export default async function LoginPage({
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
          <h1>Good stats start here.</h1>
          <p>Sign in to manage your own teams and seasons.</p>
        </div>
      </div>
      {notice === "password-updated" && (
        <p role="status">
          Your password was updated. Sign in with your new password.
        </p>
      )}
      {notice === "password-updated-signout-failed" && (
        <p role="status">
          Your password was updated, but we could not sign out all sessions.
          Sign in with your new password and sign out other devices.
        </p>
      )}
      <AuthForm />
      <Link className="text-link" href="/">
        Explore the sample shell instead
      </Link>
    </main>
  );
}
