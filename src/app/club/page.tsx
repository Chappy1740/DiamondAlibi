import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { TeamRoster, TeamInvitations } from "@/components/team-roster";
import { SeasonManager } from "@/components/season-manager";
import { ClubForm } from "@/components/club-form";
import { BrandLink } from "@/components/brand-link";
import { ProfileMenu } from "@/components/profile-menu";
export const dynamic = "force-dynamic";
type Team = { id: string; name: string };
type Membership = {
  team_id: string;
  user_id: string;
  is_captain: boolean;
  active: boolean;
};
type Season = { id: string; name: string; archived: boolean };
type Player = { id: string; display_name: string; is_guest: boolean };
type Invite = {
  id: string;
  expires_at: string;
  revoked_at: string | null;
  uses: number;
  max_uses: number;
};
export default async function ClubPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; team?: string; season?: string }>;
}) {
  const supabase = await supabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const query = await searchParams;
  const jar = await cookies();
  const [profileResult, teamsResult, membershipResult] = await Promise.all([
    supabase
      .from("player_profiles")
      .select("nickname")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase.from("teams").select("id,name").order("created_at"),
    supabase
      .from("team_memberships")
      .select("team_id,user_id,is_captain,active")
      .eq("user_id", user.id)
      .eq("active", true),
  ]);
  const failed =
    profileResult.error || teamsResult.error || membershipResult.error;
  const teams = (teamsResult.data ?? []) as Team[];
  const selected =
    teams.find((t) => t.id === (query.team ?? jar.get("da-team")?.value)) ?? teams[0];
  const mine = ((membershipResult.data ?? []) as Membership[]).find(
    (m) => m.team_id === selected?.id,
  );
  const nickname = profileResult.data?.nickname ?? "Player";
  let seasons: Season[] = [];
  let players: Player[] = [];
  let invites: Invite[] = [];
  let playerInvites: {invite_id: string; player_id: string}[] = [];
  let playerInvitesAvailable = false;
  let detailError = false;
  if (selected) {
    const [s, p, i, pi] = await Promise.all([
      supabase
        .from("team_seasons")
        .select("id,name,archived")
        .eq("team_id", selected.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("team_players")
        .select("id,display_name,is_guest")
        .eq("team_id", selected.id)
        .order("created_at"),
      supabase.rpc("da_list_invites", { p_team: selected.id }),
      supabase.rpc("da_list_player_invites", { p_team: selected.id }),
    ]);
    seasons = (s.data ?? []) as Season[];
    players = (p.data ?? []) as Player[];
    invites = (i.data ?? []) as Invite[];
    playerInvites = pi.error ? [] : (pi.data ?? []);
    playerInvitesAvailable = !pi.error;
    detailError = Boolean(s.error || p.error || i.error);
  }
  const season =
    seasons.find((s) => s.id === (query.season ?? jar.get("da-season")?.value)) ??
    seasons.find((s) => !s.archived) ??
    seasons[0];
  const { notice } = query;
  return (
    <main className="connected-wrap">
      <header className="connected-header">
        <BrandLink className="header-logo" href="/" variant="primary" />
        <ProfileMenu />
      </header>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Connected to your clubhouse</span>
          <h1>Team management</h1>
          <p>{nickname} · Your teams, roster and season history.</p>
        </div>
      </div>
      {(failed || detailError) && (
        <p role="alert" className="connection-notice">
          Could not load all clubhouse records. Refresh to retry; changes are
          not assumed saved.
        </p>
      )}
      {notice === "signout-failed" && (
        <p role="alert" className="form-error">
          Sign-out failed. Please try again.
        </p>
      )}
      <div className="connected-grid">
        <section className="card detail-card">
          <h2>Your teams</h2>
          {teams.length === 0 ? (
            <p className="muted">
              No teams yet. Create one or join with a private invite code.
            </p>
          ) : (
            teams.map((t) => (
              <ClubForm
                key={t.id}
                operation="select-team"
                team={t.id}
                label={selected?.id === t.id ? `${t.name} · selected` : t.name}
              />
            ))
          )}
          <h3>Create a team</h3>
          <ClubForm operation="create-team" label="Create team">
            <label>
              Team name
              <input name="name" maxLength={80} required />
            </label>
            <label>
              Your roster nickname
              <input
                name="nickname"
                maxLength={40}
                defaultValue={nickname === "Player" ? "" : nickname}
                required
              />
            </label>
          </ClubForm>
          <h3>Join a team</h3>
          <p className="muted">Already on the roster? Ask for your player-specific membership invite to keep your saved stats and BEVs. A general team invite adds a separate player record.</p>
          <ClubForm operation="join-team" label="Join team">
            <label>
              Invite code
              <input
                name="code"
                minLength={36}
                maxLength={36}
                autoComplete="off"
                required
              />
            </label>
            <label>
              Your roster nickname
              <input
                name="nickname"
                maxLength={40}
                defaultValue={nickname === "Player" ? "" : nickname}
                required
              />
            </label>
          </ClubForm>
        </section>
        {selected && (
          <section className="card detail-card">
            <h2>{selected.name}</h2>
            <span className="badge">
              {mine?.is_captain ? "Self-tagged captain" : "Team member"}
            </span>
            <p className="muted">
              Everyone on this team can score for everyone. Captain tags do not
              grant extra access.
            </p>
            <ClubForm
              operation="captain"
              team={selected.id}
              hidden={{ captain: String(!mine?.is_captain) }}
              label={
                mine?.is_captain
                  ? "Remove my captain tag"
                  : "Tag myself as captain"
              }
            />
            <TeamRoster team={selected.id} players={players} playerInvitesAvailable={playerInvitesAvailable} />
          </section>
        )}
        {selected && <Link className="button secondary" href={`/more/beverage-rules?${new URLSearchParams({ team: selected.id, ...(season ? { season: season.id } : {}) })}`}>View Beverage Rules</Link>}
        {selected && <SeasonManager team={selected.id} seasons={seasons} selected={season} />}
        {selected && <TeamInvitations team={selected.id} players={players} invites={invites} playerInvites={playerInvites} playerInvitesAvailable={playerInvitesAvailable} />}
        <section className="card detail-card">
          <h2>Personal nickname</h2>
          <p className="muted">
            Private profile nickname. Existing team roster aliases do not change
            automatically.
          </p>
          <ClubForm operation="profile" label="Save nickname">
            <label>
              Nickname
              <input
                name="nickname"
                maxLength={40}
                defaultValue={nickname === "Player" ? "" : nickname}
                required
              />
            </label>
          </ClubForm>
        </section>
      </div>
      <Link className="text-link" href="/">
        Return Home
      </Link>
    </main>
  );
}
