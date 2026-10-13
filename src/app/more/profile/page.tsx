import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { BrandLink } from "@/components/brand-link";
import { ProfileMenu } from "@/components/profile-menu";
import { ClubForm } from "@/components/club-form";
export const dynamic = "force-dynamic";
export default async function Page() {
  const client = await supabaseServer();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const profile = await client.from("player_profiles").select("nickname").eq("user_id", user.id).maybeSingle();
  const bio = typeof user.user_metadata?.bio === "string" ? user.user_metadata.bio : "";
  return <main className="connected-wrap">
    <header className="connected-header"><BrandLink href="/" /><ProfileMenu /></header>
    <Link className="text-link" href="/">Home</Link>
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
