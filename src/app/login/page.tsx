import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { BrandLink } from "@/components/brand-link";
import { authCaptchaSiteKey } from "@/lib/auth-captcha";
import { phoneSignInEnabled } from "@/lib/phone-sign-in";

export const dynamic = "force-dynamic";
export default function LoginPage() {
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
      <AuthForm phoneEnabled={phoneSignInEnabled()} captchaSiteKey={authCaptchaSiteKey()} />
      <Link className="text-link" href="/">
        Explore the sample shell instead
      </Link>
    </main>
  );
}
