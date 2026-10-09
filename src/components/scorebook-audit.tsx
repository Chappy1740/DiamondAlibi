import type { ConnectedRoster } from "@/lib/scorebook-view";
type Entry = {
  action?: string;
  actorId?: string;
  at?: string;
  revision?: number;
  reason?: string;
  playerId?: string;
  before?: unknown;
  after?: unknown;
};
const labels: Record<string, string> = {
  start: "Game started",
  score: "Plate appearance recorded",
  correct: "Plate appearance corrected",
  lineup: "Lineup changed",
  batter: "Next batter changed",
  complete: "Game completed",
  band: "Tournament Band corrected",
  create_scoring_tournament: "Tournament created",
};
type State = {
  lineup?: string[];
  game?: { completed?: boolean; next_batter_position?: number };
  play?: {
    outcome?: string;
    player_id?: string;
    runs?: number;
    rbi?: number;
    voided?: boolean;
  };
  outcome?: string;
  playerId?: string;
  runs?: number;
  rbi?: number;
  voided?: boolean;
  name?: string;
};
export function ScorebookAudit({
  entries,
  roster,
}: {
  entries: unknown[];
  roster: ConnectedRoster;
}) {
  const name = (id?: string) =>
    roster.find((p) => p.id === id)?.display_name ?? "Former roster player";
  function describe(value: unknown, action?: string) {
    if (typeof value === "boolean") return value ? "HR Band" : "No HR Band";
    if (!value || typeof value !== "object") return "No prior entry";
    const s = value as State,
      play = s.play ?? s;
    if (play.outcome)
      return `${name("player_id" in play ? play.player_id : s.playerId)} · ${play.outcome} · ${play.runs ?? 0} runs, ${play.rbi ?? 0} RBI${play.voided ? " · voided" : ""}`;
    if (action === "lineup" && s.lineup) return s.lineup.map(name).join(" → ");
    if (action === "batter" && s.lineup && s.game)
      return name(s.lineup[s.game.next_batter_position ?? 0]);
    if (s.game) return s.game.completed ? "Game complete" : "Game in progress";
    return s.name ?? "Setup recorded";
  }
  return (
    <ul className="scorebook-audit">
      {entries.map((raw, index) => {
        const e = raw as Entry;
        const actor =
          roster.find((p) => p.user_id === e.actorId)?.display_name ??
          "Team member";
        return (
          <li key={index}>
            <details>
              <summary>
                {labels[e.action ?? ""] ?? "Scorebook change"} · {actor}
                {e.at ? ` · ${new Date(e.at).toLocaleString()}` : ""}
              </summary>
              {e.revision != null && (
                <p className="micro">Revision {e.revision}</p>
              )}
              {e.playerId && <p>{name(e.playerId)}</p>}
              {e.reason && <p>Reason: {e.reason}</p>}
              <dl>
                <dt>Before</dt>
                <dd>{describe(e.before, e.action)}</dd>
                <dt>After</dt>
                <dd>{describe(e.after, e.action)}</dd>
              </dl>
            </details>
          </li>
        );
      })}
    </ul>
  );
}
