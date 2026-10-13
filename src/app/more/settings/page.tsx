import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { BrandLink } from "@/components/brand-link";
import { ProfileMenu } from "@/components/profile-menu";
export const dynamic = "force-dynamic";
export default async function Page() {
  const client = await supabaseServer();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  return <main className="connected-wrap">
    <header className="connected-header"><BrandLink href="/" /><ProfileMenu /></header>
    <Link className="text-link" href="/">Home</Link>
    <div className="page-heading"><h1>Account settings</h1></div>
    <section className="card detail-card"><h2>Your account</h2>
      <p>{user.email}</p><p>{user.email_confirmed_at ? "Email confirmed" : "Email confirmation pending"}</p>
      <Link className="button secondary" href="/forgot-password">Reset password</Link>
      <Link className="button secondary" href="/more/profile">Edit bio & profile</Link>
    </section>
  </main>;
}
