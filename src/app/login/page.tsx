import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
export default function LoginPage() {
  return (
    <main className="connected-wrap">
      <Link className="compact-brand" href="/">
        DIAMOND ALIBI<span className="accent">.</span>
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Your real clubhouse</span>
          <h1>Good stats start here.</h1>
          <p>Sign in to manage your own teams and seasons.</p>
        </div>
      </div>
      <AuthForm />
      <Link className="text-link" href="/">
        Explore the sample shell instead
      </Link>
    </main>
  );
}
