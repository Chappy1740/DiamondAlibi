import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { BrandLink } from "@/components/brand-link";
import { ProfileMenu } from "@/components/profile-menu";
import { ClubForm } from "@/components/club-form";
import { RoastClubControls } from "@/components/roast-club-controls";
export const dynamic = "force-dynamic";
export default async function Page() {
  const client = await supabaseServer();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const profile = await client.from("player_profiles").select("nickname").eq("user_id", user.id).maybeSingle();
  const [teamRows, memberRows] = await Promise.all([
    client.from("teams").select("id,name").order("created_at"),
    client.from("team_memberships").select("team_id").eq("user_id", user.id).eq("active", true),
  ]);
  const teamsError = Boolean(teamRows.error || memberRows.error);
  const memberOf = new Set((memberRows.data ?? []).map((m) => m.team_id));
  const teams = (teamRows.data ?? []).filter((t) => memberOf.has(t.id));
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
    <section className="card detail-card" aria-labelledby="roast-club-heading">
      <h2 id="roast-club-heading">Roast Club</h2>
      <p className="micro">Optional, and off until you turn it on. Each team has its own choice, so check the team name below.</p>
      {teamsError && <p role="alert">Could not load your teams. Refresh to retry.</p>}
      {!teamsError && teams.length === 0 && <p>Join a team to see Roast Club.</p>}
      {teams.map((t) => <RoastClubControls key={t.id} teamId={t.id} teamName={t.name} />)}
    </section>
  </main>;
}
