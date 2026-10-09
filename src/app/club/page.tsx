import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ClubForm } from "@/components/club-form";
import { signout } from "@/app/login/actions";
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
  searchParams: Promise<{ notice?: string }>;
}) {
  const supabase = await supabaseServer();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
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
    teams.find((t) => t.id === jar.get("da-team")?.value) ?? teams[0];
  const mine = ((membershipResult.data ?? []) as Membership[]).find(
    (m) => m.team_id === selected?.id,
  );
  const nickname = profileResult.data?.nickname ?? "Player";
  let seasons: Season[] = [];
  let players: Player[] = [];
  let invites: Invite[] = [];
  let detailError = false;
  if (selected) {
    const [s, p, i] = await Promise.all([
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
    ]);
    seasons = (s.data ?? []) as Season[];
    players = (p.data ?? []) as Player[];
    invites = (i.data ?? []) as Invite[];
    detailError = Boolean(s.error || p.error || i.error);
  }
  const season =
    seasons.find((s) => s.id === jar.get("da-season")?.value) ??
    seasons.find((s) => !s.archived) ??
    seasons[0];
  const { notice } = await searchParams;
  return (
    <main className="connected-wrap">
      <header className="connected-header">
        <Link className="compact-brand" href="/">
          DIAMOND ALIBI<span className="accent">.</span>
        </Link>
        <form action={signout}>
          <button className="button secondary">Sign out</button>
        </form>
      </header>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Connected to your clubhouse</span>
          <h1>Welcome, {nickname}.</h1>
          <p>
            Your teams and seasons are real records. Game scoring comes next.
          </p>
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
            <h3>Roster</h3>
            <ul className="roster-list">
              {players.map((p) => (
                <li key={p.id}>
                  {p.display_name}
                  <span className="badge">
                    {p.is_guest ? "Guest · no account access" : "Member"}
                  </span>
                </li>
              ))}
            </ul>
            <ClubForm
              operation="guest"
              team={selected.id}
              label="Add guest player"
            >
              <label>
                Guest roster nickname
                <input name="name" maxLength={40} required />
              </label>
            </ClubForm>
          </section>
        )}
        {selected && (
          <section className="card detail-card">
            <h2>Seasons</h2>
            <p className="muted">
              Selected: {season?.name ?? "No season yet"}. History is retained;
              no beverage balance resets.
            </p>
            {seasons.map((s) => (
              <div className="season-actions" key={s.id}>
                <ClubForm
                  operation="select-season"
                  team={selected.id}
                  hidden={{ season: s.id }}
                  label={`${s.name}${s.archived ? " · archived" : ""}${s.id === season?.id ? " · selected" : ""}`}
                />
                <ClubForm
                  operation="archive-season"
                  team={selected.id}
                  hidden={{ season: s.id, archived: String(!s.archived) }}
                  label={s.archived ? "Restore season" : "Archive season"}
                />
              </div>
            ))}
            <ClubForm
              operation="create-season"
              team={selected.id}
              label="Create season"
            >
              <label>
                Season name
                <input name="name" maxLength={80} required />
              </label>
            </ClubForm>
          </section>
        )}
        {selected && (
          <section className="card detail-card">
            <h2>Private invitations</h2>
            <p className="muted">
              New codes expire in seven days. Share manually only with the
              intended teammate. Raw codes are shown once, never stored here.
            </p>
            <ClubForm
              operation="create-invite"
              team={selected.id}
              label="Create invite code"
            >
              <label>
                Maximum joins
                <input
                  name="maxUses"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={10}
                  required
                />
              </label>
            </ClubForm>
            {invites.map((i) => (
              <div className="invite-row" key={i.id}>
                <p>
                  {i.uses}/{i.max_uses} uses ·{" "}
                  {i.revoked_at
                    ? "Revoked"
                    : new Date(i.expires_at) < new Date()
                      ? "Expired"
                      : `Expires ${new Date(i.expires_at).toISOString().slice(0, 10)}`}
                </p>
                {!i.revoked_at && (
                  <ClubForm
                    operation="revoke-invite"
                    team={selected.id}
                    hidden={{ invite: i.id }}
                    label="Revoke this invite"
                  />
                )}
              </div>
            ))}
          </section>
        )}
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
        Return to the synthetic shell preview
      </Link>
    </main>
  );
}
