import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { BeverageControls } from "@/components/beverage-controls";
import { BrandLink } from "@/components/brand-link";
import { DashboardSelect } from "@/components/dashboard-select";
import { ProfileMenu } from "@/components/profile-menu";
import { RoastClubControls } from "@/components/roast-club-controls";
import { navigationContext } from "@/lib/app-navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { loadActiveTeams, selectActiveTeam } from "@/lib/team-selection";

export const dynamic = "force-dynamic";

export default async function ClubhouseExtrasPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string; season?: string; scope?: string }>;
}) {
  const client = await supabaseServer();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");

  const [{ options, unavailable }, query, jar] = await Promise.all([
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
  const returnContext = navigationContext("", context.toString(), "/more/clubhouse-extras");
  const homeHref = returnContext ? `/?${returnContext}` : "/";
  const scope = new URLSearchParams(returnContext).get("scope");

  return (
    <main className="connected-wrap clubhouse-extras">
      <header className="connected-header">
        <BrandLink href={homeHref} />
        <ProfileMenu context={returnContext} />
      </header>
      <div className="page-heading">
        <div>
          <h1>Clubhouse Extras</h1>
          <p>Cold ones. Hot takes.</p>
        </div>
      </div>
      <section className="card detail-card" aria-labelledby="team-preferences">
        <h2 id="team-preferences">Team preferences</h2>
        {unavailable ? (
          <p role="alert">Could not load your teams. Refresh to try again.</p>
        ) : options.length === 0 ? (
          <p>Join a team to manage your participation preferences.</p>
        ) : (
          <>
            {team ? <p>Preferences for <strong>{team.name}</strong></p> : (
              <p role="alert">That team is unavailable. Choose one of your teams.</p>
            )}
            {(options.length > 1 || !team) && (
              <form className="club-form clubhouse-extras-team" method="get" action="/more/clubhouse-extras">
                <DashboardSelect
                  label="Team"
                  name="team"
                  value={team?.id ?? ""}
                  options={team ? options : [{ id: "", name: "Choose a team" }, ...options]}
                />
                {scope && <input type="hidden" name="scope" value={scope} />}
                <button className="button secondary" type="submit">Switch team</button>
              </form>
            )}
            {team && (
              <div className="clubhouse-extras-choices" key={team.id}>
                <BeverageControls teamId={team.id} />
                <RoastClubControls teamId={team.id} />
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
