import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { BrandLink } from "@/components/brand-link";
import { ProfileMenu } from "@/components/profile-menu";
import { ClubForm } from "@/components/club-form";
import { PlayerProfileFields } from "@/components/player-profile-fields";
import { ProfilePhoto } from "@/components/profile-photo";
import { navigationContext } from "@/lib/app-navigation";
import { playerDetails, signupDetails } from "@/lib/player-profile";
import { loadActiveTeams, selectActiveTeam } from "@/lib/team-selection";

export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; season?: string; scope?: string; finish?: string }>;
}) {
  const client = await supabaseServer();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  const [profile, { options }, query, jar] = await Promise.all([
    client.from("player_profiles").select("nickname,play_level,fielding_position").eq("user_id", user.id).maybeSingle(),
    loadActiveTeams(client, user.id),
    searchParams,
    cookies(),
  ]);
  const requestedTeam = typeof query.team === "string" ? query.team : undefined;
  const team = selectActiveTeam(options, requestedTeam, jar.get("da-team")?.value);
  const context = new URLSearchParams();
  if (team) context.set("team", team.id);
  if (team && typeof query.season === "string") context.set("season", query.season);
  if (typeof query.scope === "string") context.set("scope", query.scope);
  const returnContext = navigationContext("", context.toString(), "/more/profile");
  const homeHref = returnContext ? `/?${returnContext}` : "/";
  const bio = typeof user.user_metadata?.bio === "string" ? user.user_metadata.bio : "";
  const saved = profile.data;
  const details = saved
    ? playerDetails(saved.nickname, saved.play_level, saved.fielding_position)
    : profile.error ? null : signupDetails(user.user_metadata?.da_signup_profile);
  const name = details?.nickname ?? "";
  return <main className="connected-wrap">
    <header className="connected-header"><BrandLink href={homeHref} /><ProfileMenu context={returnContext} /></header>
    <Link className="text-link" href={homeHref}>Home</Link>
    <div className="page-heading"><h1>Bio & profile</h1></div>
    {query.finish === "1" && <p>Add a photo to finish your profile, or continue to Home.</p>}
    {profile.error && <p role="alert">Could not load your profile details. Refresh to retry.</p>}
    <section className="card detail-card">
      <h2>Your bio</h2>
      <p className="micro">Your private profile. Team roster aliases stay with their teams.</p>
      <ProfilePhoto key={user.id} name={name} />
      {details && <dl>
        <dt>Display name</dt><dd>{name}</dd>
        {details.play_level && <><dt>Slow-pitch level</dt><dd>{details.play_level}</dd></>}
        {details.fielding_position && <><dt>Favorite fielding position</dt><dd>{details.fielding_position}</dd></>}
      </dl>}
      <ClubForm operation="bio" label="Save bio"><label htmlFor="profile-bio">Bio</label><textarea id="profile-bio" name="bio" maxLength={400} rows={4} defaultValue={bio} /></ClubForm>
    </section>
    {!profile.error && <section className="card detail-card">
      <h2>Edit profile details</h2>
      {!saved && details && <p>Save your details to finish setting up your profile.</p>}
      <ClubForm operation="profile" label="Save profile">
        <PlayerProfileFields details={details} />
      </ClubForm>
    </section>}
    {query.finish === "1" && <Link className="button secondary" href={homeHref}>Continue to Home</Link>}
  </main>;
}
