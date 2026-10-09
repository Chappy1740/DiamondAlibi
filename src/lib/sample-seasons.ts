import {
  DEFAULT_BOARD,
  emptyTotals,
  evaluateGame,
  type Game,
  type Outcome,
  type Scope,
  type Totals,
} from "./scoring.ts";
import type { ConnectedGame, LoadedScorebook } from "./scorebook-view.ts";

// Repeatable synthetic records only; never seed the live database with these.
export const sampleRoster = [
  "Alex",
  "Blake",
  "Casey",
  "Drew",
  "Ellis",
  "Frankie",
  "Gray",
  "Harper",
  "Indigo",
  "Jules",
  "Kai",
  "Lane",
].map((name, i) => ({
  id: `sample-player-${i + 1}`,
  user_id: `sample-user-${i + 1}`,
  display_name: name,
  is_guest: false,
}));
export const sampleSeasons = [2023, 2024, 2025, 2026].map((year) => ({
  id: `sample-season-${year}`,
  name: `Season ${year}`,
  archived: year !== 2026,
}));
let seed = 1740;
function random() {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return seed / 4294967296;
}
const outcomes: Outcome[] = [
  "Hit",
  "Hit",
  "Hit",
  "Out",
  "Out",
  "K",
  "BB",
  "HBP",
  "ROE",
  "SF",
  "Fence HR",
  "ITP HR",
];
const bands = sampleRoster.filter((_, i) => i % 4 === 0).map((p) => p.id);
function game(
  seasonIndex: number,
  index: number,
  kind: "League" | "Tournament",
  tournament: string | null,
): ConnectedGame {
  const id = `${sampleSeasons[seasonIndex].id}-${kind}-${index}-${tournament ?? "league"}`;
  const plays = Array.from({ length: 48 }, (_, i) => {
    const outcome = outcomes[Math.floor(random() * outcomes.length)];
    const runs =
      outcome === "Fence HR" || outcome === "ITP HR"
        ? 1 + Math.floor(random() * 4)
        : 0;
    return {
      id: `${id}-play-${i}`,
      playerId: sampleRoster[i % 12].id,
      outcome,
      runs,
      rbi: runs,
      voided: false,
    };
  });
  const rules = {
    version: "sample-v1",
    fenceLimit: 5,
    board: { ...DEFAULT_BOARD },
  };
  const raw: Game = {
    id,
    opponent: `Sample opponents ${index + 1}`,
    kind,
    lineup: sampleRoster.map((p) => p.id),
    next: 0,
    complete: !(seasonIndex === 3 && kind === "League" && index === 15),
    rules,
    plays,
  };
  return {
    game: {
      id,
      day_id: `${id}-day`,
      tournament_id: tournament,
      opponent: raw.opponent,
      kind,
      completed: raw.complete,
      next_batter_position: 0,
    },
    playedOn: `${2023 + seasonIndex}-06-${String((index % 28) + 1).padStart(2, "0")}`,
    dayRevision: 1,
    tournamentRevision: tournament ? 1 : null,
    lineup: raw.lineup,
    rules: { version_label: rules.version, fence_limit: rules.fenceLimit },
    evaluation: evaluateGame(raw, kind === "Tournament" ? bands : []),
  };
}
export function createSampleSeasons(): LoadedScorebook[] {
  seed = 1740;
  const guarantees = [3, 3, 3, 3, 2, 2, 2] as const;
  const assignments = [0, 0, 1, 1, 2, 2, 3];
  const result: LoadedScorebook[] = sampleSeasons.map((season, s) => ({
    snapshot: {
      teamId: "sample-team",
      seasonId: season.id,
      scope: "Overall",
      totals: {},
      board: {},
      games: Array.from({ length: 16 }, (_, i) => game(s, i, "League", null)),
      tournaments: [],
    },
    roster: sampleRoster,
    bands: [],
    leagueBands: [],
    participation: [],
    archived: season.archived,
  }));
  guarantees.forEach((guaranteedGames, t) => {
    const loaded = result[assignments[t]];
    const id = `sample-tournament-${t + 1}`;
    loaded.snapshot.tournaments.push({
      id,
      name: `Sample Cup ${t + 1}`,
      revision: 1,
      guaranteedGames,
    });
    const count = guaranteedGames + Math.floor(random() * 4);
    for (let i = 0; i < count; i++)
      loaded.snapshot.games.push(game(assignments[t], i, "Tournament", id));
    loaded.bands.push(
      ...sampleRoster.map((p) => ({
        tournament_id: id,
        player_id: p.id,
        has_band: bands.includes(p.id),
      })),
    );
  });
  return result.map((loaded) => {
    loaded.participation = loaded.snapshot.games.flatMap((g) =>
      g.lineup.map((player_id) => ({ game_id: g.game.id, player_id })),
    );
    return sampleScope(loaded, "Overall");
  });
}
export function sampleScope(
  loaded: LoadedScorebook,
  scope: Scope,
): LoadedScorebook {
  const totals: Record<string, Totals> = Object.fromEntries(
    sampleRoster.map((p) => [p.id, emptyTotals()]),
  );
  const board = Object.fromEntries(sampleRoster.map((p) => [p.id, 0]));
  for (const g of loaded.snapshot.games)
    for (const [id, value] of Object.entries(g.evaluation.totals)) {
      board[id] += value.board;
      if (scope === "Overall" || scope === g.game.kind)
        for (const key of Object.keys(value) as (keyof Totals)[])
          totals[id][key] += value[key];
    }
  return { ...loaded, snapshot: { ...loaded.snapshot, scope, totals, board } };
}
