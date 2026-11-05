import type { SupabaseClient } from "@supabase/supabase-js";

type TeamOption = { id: string; name: string };

export async function loadActiveTeams(
  client: SupabaseClient,
  userId: string,
): Promise<{ options: TeamOption[]; unavailable: boolean }> {
  try {
    const [teams, memberships] = await Promise.all([
      client.from("teams").select("id,name").order("created_at"),
      client
        .from("team_memberships")
        .select("team_id")
        .eq("user_id", userId)
        .eq("active", true),
    ]);
    if (!teams.error && !memberships.error) {
      const active = new Set((memberships.data ?? []).map((row) => row.team_id));
      return {
        options: (teams.data ?? []).filter((team) => active.has(team.id)),
        unavailable: false,
      };
    }
  } catch {
    // Missing access data must never produce selectable teams.
  }
  return { options: [], unavailable: true };
}

export function selectActiveTeam(
  options: TeamOption[],
  requestedTeam?: string,
  savedTeam?: string,
) {
  const teamId = requestedTeam ?? savedTeam;
  return (
    options.find((team) => team.id === teamId) ??
    (requestedTeam ? undefined : options[0])
  );
}
