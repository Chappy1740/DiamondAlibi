import type { Outcome, Scope, Totals } from "./scoring";
import type { BeverageState } from "./team-beverage";
export type ScoreRow = {
  id: string;
  playerId: string;
  outcome: Outcome;
  runs: number;
  rbi: number;
  voided: boolean;
  official: string;
  delta: number;
  beverageParticipating?: boolean;
};
export type ConnectedGame = {
  game: {
    id: string;
    day_id: string;
    tournament_id: string | null;
    league_id?: string | null;
    opponent: string;
    kind: "League" | "Tournament";
    completed: boolean;
    next_batter_position: number;
    batting_mode?: "ordered" | "manual";
    team_runs?: number | null;
    opponent_runs?: number | null;
    inning?: number | null;
    inning_half?: string | null;
    tournament_game_number?: number | null;
  };
  playedOn: string;
  dayRevision: number;
  tournamentRevision: number | null;
  lineup: string[];
  rules: {
    version_label: string;
    fence_limit: number;
    strikeout?: number;
    solo?: number;
    band_solo?: number;
    grand_slam?: number;
    over_limit?: number;
    inside_park?: number;
    multi_run?: number;
  };
  evaluation: {
    rows: ScoreRow[];
    fenceUsed: number;
    totals: Record<string, Totals>;
  };
};
export type ScorebookView = {
  capabilities?: { manualBatting?: boolean; teamBeverage?: boolean };
  beverage?: BeverageState;
  teamId: string;
  seasonId: string;
  scope: Scope;
  totals: Record<string, Totals>;
  board: Record<string, number>;
  games: ConnectedGame[];
  leagues?: { id: string; name: string; fenceLimit: number }[];
  tournaments: {
    id: string;
    name: string;
    revision: number;
    guaranteedGames?: 2 | 3 | null;
    fenceLimit?: number | null;
  }[];
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
