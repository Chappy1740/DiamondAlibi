import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { BrandLink } from "@/components/brand-link";
import { ProfileMenu } from "@/components/profile-menu";
import { ClubForm } from "@/components/club-form";
import { navigationContext } from "@/lib/app-navigation";

export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; season?: string; scope?: string }>;
}) {
  const client = await supabaseServer();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const [profile, query] = await Promise.all([
    client.from("player_profiles").select("nickname").eq("user_id", user.id).maybeSingle(),
    searchParams,
  ]);
  const context = new URLSearchParams();
  for (const key of ["team", "season", "scope"] as const) {
    if (typeof query[key] === "string") context.set(key, query[key]);
  }
  const returnContext = navigationContext("", context.toString(), "/more/profile");
  const homeHref = returnContext ? `/?${returnContext}` : "/";
  const bio = typeof user.user_metadata?.bio === "string" ? user.user_metadata.bio : "";
  return <main className="connected-wrap">
    <header className="connected-header"><BrandLink href={homeHref} /><ProfileMenu context={returnContext} /></header>
    <Link className="text-link" href={homeHref}>Home</Link>
    <div className="page-heading"><h1>Bio & profile</h1></div>
    {profile.error && <p role="alert">Could not load your nickname. Refresh to retry.</p>}
    <section className="card detail-card">
      <h2>Your nickname</h2><p className="micro">Your private profile. Team roster aliases stay with their teams.</p>
      {!profile.error && <ClubForm operation="profile" label="Save nickname"><label>Nickname<input name="nickname" maxLength={40} defaultValue={profile.data?.nickname ?? ""} required /></label></ClubForm>}
      <h2>Your bio</h2>
      <ClubForm operation="bio" label="Save bio"><label htmlFor="profile-bio">Bio</label><textarea id="profile-bio" name="bio" maxLength={400} rows={4} defaultValue={bio} /></ClubForm>
    </section>
  </main>;
}
