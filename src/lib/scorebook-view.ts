import type { Outcome, Scope, Totals } from "./scoring";
export type ScoreRow = {
  id: string;
  playerId: string;
  outcome: Outcome;
  runs: number;
  rbi: number;
  voided: boolean;
  official: string;
  delta: number;
};
export type ConnectedGame = {
  game: {
    id: string;
    day_id: string;
    tournament_id: string | null;
    opponent: string;
    kind: "League" | "Tournament";
    completed: boolean;
    next_batter_position: number;
  };
  playedOn: string;
  dayRevision: number;
  tournamentRevision: number | null;
  lineup: string[];
  rules: { version_label: string; fence_limit: number };
  evaluation: {
    rows: ScoreRow[];
    fenceUsed: number;
    totals: Record<string, Totals>;
  };
};
export type ScorebookView = {
  teamId: string;
  seasonId: string;
  scope: Scope;
  totals: Record<string, Totals>;
  board: Record<string, number>;
  games: ConnectedGame[];
  tournaments: { id: string; name: string; revision: number }[];
};
export type ConnectedRoster = {
  user_id?: string | null;
  id: string;
  display_name: string;
  is_guest: boolean;
}[];
export type BandAssignment = {
  tournament_id: string;
  player_id: string;
  has_band: boolean;
};
export type LoadedScorebook = {
  snapshot: ScorebookView;
  roster: ConnectedRoster;
  bands: BandAssignment[];
  participation: { game_id: string; player_id: string }[];
  leagueBands: { game_id: string; player_id: string }[];
  archived: boolean;
};
export type ScorebookLoadResult =
  | { status: "ok"; data: LoadedScorebook }
  | { status: "unavailable" | "access-denied" | "auth-required" | "invalid" };
