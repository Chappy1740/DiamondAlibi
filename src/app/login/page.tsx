import Link from "next/link";
import { connection } from "next/server";
import { AuthForm } from "@/components/auth-form";
import { BrandLink } from "@/components/brand-link";
import { authCaptchaSiteKey } from "@/lib/auth-captcha";
import { phoneSignInEnabled } from "@/lib/phone-sign-in";

export default async function LoginPage() {
  await connection();
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
      <AuthForm
        passwordOnly={Boolean(process.env.DA_SANDBOX_ORIGIN)}
        phoneEnabled={phoneSignInEnabled()}
        captchaSiteKey={authCaptchaSiteKey()}
      />
      <Link className="text-link" href="/">
        Explore the sample shell instead
      </Link>
    </main>
  );
}
