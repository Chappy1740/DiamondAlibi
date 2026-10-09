/** Established rules only. This engine performs no I/O or authorization. */
export const OUTCOMES = [
  "Hit",
  "BB",
  "HBP",
  "ROE",
  "K",
  "Out",
  "SF",
  "Fence HR",
  "ITP HR",
] as const;
export type Outcome = (typeof OUTCOMES)[number];
export type Scope = "League" | "Tournament" | "Overall";
export type Rules = {
  version: string;
  fenceLimit: number;
  board: {
    strikeout: number;
    solo: number;
    bandSolo: number;
    grandSlam: number;
    overLimit: number;
    insidePark: number;
    multiRun: number;
  };
};
export const DEFAULT_BOARD = {
  strikeout: 1,
  solo: 1,
  bandSolo: -1,
  grandSlam: -1,
  overLimit: 1,
  insidePark: -1,
  multiRun: 0,
};
export type Player = { id: string; name: string };
export type Play = {
  id: string;
  playerId: string;
  outcome: Outcome;
  runs: number;
  rbi: number;
  voided: boolean;
};
export type Game = {
  id: string;
  opponent: string;
  kind: Exclude<Scope, "Overall">;
  lineup: string[];
  next: number;
  complete: boolean;
  rules: Rules;
  plays: Play[];
};
export type Audit = {
  commandId: string;
  fingerprint: string;
  revision: number;
  actor: string;
  at: string;
  action: string;
  reason?: string;
};
export type Scorebook = {
  format: 1;
  teamId: string;
  seasonId: string;
  dayId: string;
  revision: number;
  players: Player[];
  bands: string[];
  rules: Rules;
  games: Game[];
  audit: Audit[];
};
export type Command =
  | {
      type: "start";
      gameId: string;
      opponent: string;
      kind: Exclude<Scope, "Overall">;
      lineup: string[];
    }
  | {
      type: "score";
      gameId: string;
      playId: string;
      playerId: string;
      outcome: Outcome;
      runs: number;
      rbi: number;
    }
  | {
      type: "correct";
      gameId: string;
      playId: string;
      playerId?: string;
      outcome: Outcome;
      runs: number;
      rbi: number;
      voided: boolean;
      reason: string;
    }
  | { type: "lineup"; gameId: string; lineup: string[] }
  | { type: "batter"; gameId: string; playerId: string }
  | { type: "complete"; gameId: string }
  | { type: "rules"; rules: Rules }
  | { type: "bands"; players: string[]; reason?: string };
export type Request = {
  commandId: string;
  expectedRevision: number;
  actor: string;
  at: string;
  command: Command;
};

function insist(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
function text(value: string, label: string) {
  insist(
    typeof value === "string" && value.trim().length > 0 && value.length <= 200,
    `${label} is required (200 characters maximum).`,
  );
}
function count(value: number, max: number, label: string) {
  insist(
    Number.isInteger(value) && value >= 0 && value <= max,
    `${label} must be a whole number from 0 to ${max}.`,
  );
}
export function validateRules(rules: Rules) {
  text(rules.version, "Rule version");
  count(rules.fenceLimit, 100, "Fence limit");
  for (const key of Object.keys(
    DEFAULT_BOARD,
  ) as (keyof typeof DEFAULT_BOARD)[])
    insist(
      Number.isInteger(rules.board[key]) && Math.abs(rules.board[key]) <= 100,
      "Board adjustments must be whole numbers from -100 to 100.",
    );
}
function members(book: Scorebook, ids: string[]) {
  insist(
    ids.length > 0 &&
      new Set(ids).size === ids.length &&
      ids.every((id) => book.players.some((p) => p.id === id)),
    "Choose a unique lineup from this team's roster.",
  );
}
function validatePlay(outcome: Outcome, runs: number, rbi: number) {
  insist(OUTCOMES.includes(outcome), "Choose a recognized batting outcome.");
  count(runs, 4, "Runs");
  count(rbi, 4, "RBI");
  insist(rbi <= runs, "RBI cannot exceed runs on this play.");
  if (outcome === "Fence HR" || outcome === "ITP HR")
    insist(runs >= 1, "A home run must score at least one run.");
}
export function createScorebook(input: {
  teamId: string;
  seasonId: string;
  dayId: string;
  players: Player[];
  bands: string[];
  rules: Rules;
}): Scorebook {
  [input.teamId, input.seasonId, input.dayId].forEach((id) =>
    text(id, "Context"),
  );
  validateRules(input.rules);
  insist(
    input.players.length > 0 &&
      new Set(input.players.map((p) => p.id)).size === input.players.length,
    "Provide a unique team roster.",
  );
  input.players.forEach((p) => {
    text(p.id, "Player ID");
    text(p.name, "Player name");
  });
  const book: Scorebook = structuredClone({
    ...input,
    format: 1,
    revision: 0,
    games: [],
    audit: [],
  });
  insist(
    new Set(book.bands).size === book.bands.length &&
      book.bands.every((id) => book.players.some((p) => p.id === id)),
    "Band players must belong to this team.",
  );
  return book;
}
export function applyCommand(current: Scorebook, request: Request): Scorebook {
  text(request.commandId, "Command ID");
  text(request.actor, "Actor");
  text(request.at, "Timestamp");
  insist(Number.isFinite(Date.parse(request.at)), "Use a valid timestamp.");
  const fingerprint = JSON.stringify({
    actor: request.actor,
    command: request.command,
  });
  const prior = current.audit.find((a) => a.commandId === request.commandId);
  if (prior) {
    insist(
      prior.fingerprint === fingerprint,
      "This command ID was already used for a different change.",
    );
    return current;
  }
  insist(
    request.expectedRevision === current.revision,
    "This scorebook changed. Reload before trying again.",
  );
  const book = structuredClone(current),
    cmd = request.command;
  let reason: string | undefined;
  if (cmd.type === "start") {
    text(cmd.gameId, "Game ID");
    text(cmd.opponent, "Opponent");
    insist(
      !book.games.some((g) => g.id === cmd.gameId),
      "This game already exists.",
    );
    insist(
      cmd.kind === "League" || cmd.kind === "Tournament",
      "Choose League or Tournament.",
    );
    members(book, cmd.lineup);
    book.games.push({
      id: cmd.gameId,
      opponent: cmd.opponent.trim(),
      kind: cmd.kind,
      lineup: [...cmd.lineup],
      next: 0,
      complete: false,
      rules: structuredClone(book.rules),
      plays: [],
    });
  } else if (cmd.type === "rules") {
    validateRules(cmd.rules);
    insist(
      cmd.rules.version !== book.rules.version &&
        !book.games.some((g) => g.rules.version === cmd.rules.version),
      "Use a new rule version.",
    );
    book.rules = structuredClone(cmd.rules);
  } else if (cmd.type === "bands") {
    insist(
      new Set(cmd.players).size === cmd.players.length &&
        cmd.players.every((id) => book.players.some((p) => p.id === id)),
      "Band players must belong to this team.",
    );
    if (book.games.some((g) => g.plays.length > 0)) {
      text(cmd.reason ?? "", "Band correction reason");
      reason = cmd.reason!.trim();
    }
    book.bands = [...cmd.players];
  } else {
    const game = book.games.find((g) => g.id === cmd.gameId);
    insist(game, "Game does not belong to this scorebook.");
    if (cmd.type === "correct") {
      text(cmd.reason, "Correction reason");
      reason = cmd.reason.trim();
      const play = game.plays.find((p) => p.id === cmd.playId);
      insist(play, "Play was not found.");
      validatePlay(cmd.outcome, cmd.runs, cmd.rbi);
      insist(
        typeof cmd.voided === "boolean",
        "Choose whether the play is voided.",
      );
      const correctedPlayer = cmd.playerId ?? play.playerId;
      insist(
        book.players.some((p) => p.id === correctedPlayer),
        "Corrected batter must belong to this team's roster.",
      );
      Object.assign(play, {
        playerId: correctedPlayer,
        outcome: cmd.outcome,
        runs: cmd.runs,
        rbi: cmd.rbi,
        voided: cmd.voided,
      });
    } else {
      insist(
        !game.complete,
        "This game is complete. Use an audited correction to change its score.",
      );
      if (cmd.type === "complete") game.complete = true;
      if (cmd.type === "lineup") {
        members(book, cmd.lineup);
        const nextPlayer = game.lineup[game.next];
        game.lineup = [...cmd.lineup];
        game.next = Math.max(0, game.lineup.indexOf(nextPlayer));
      }
      if (cmd.type === "batter") {
        insist(
          game.lineup.includes(cmd.playerId),
          "Batter must be in this game's lineup.",
        );
        game.next = game.lineup.indexOf(cmd.playerId);
      }
      if (cmd.type === "score") {
        text(cmd.playId, "Play ID");
        insist(
          !book.games.some((g) => g.plays.some((p) => p.id === cmd.playId)),
          "This play ID already exists.",
        );
        insist(
          game.lineup[game.next] === cmd.playerId,
          "The next batter changed. Confirm the batter before scoring.",
        );
        validatePlay(cmd.outcome, cmd.runs, cmd.rbi);
        game.plays.push({
          id: cmd.playId,
          playerId: cmd.playerId,
          outcome: cmd.outcome,
          runs: cmd.runs,
          rbi: cmd.rbi,
          voided: false,
        });
        game.next = (game.next + 1) % game.lineup.length;
      }
    }
  }
  book.revision++;
  book.audit.push({
    commandId: request.commandId,
    fingerprint,
    revision: book.revision,
    actor: request.actor,
    at: request.at,
    action: cmd.type,
    ...(reason ? { reason } : {}),
  });
  return book;
}
export type Totals = {
  AB: number;
  PA: number;
  H: number;
  BB: number;
  HBP: number;
  ROE: number;
  SF: number;
  K: number;
  HR: number;
  RBI: number;
  runs: number;
  board: number;
};
export const emptyTotals = (): Totals => ({
  AB: 0,
  PA: 0,
  H: 0,
  BB: 0,
  HBP: 0,
  ROE: 0,
  SF: 0,
  K: 0,
  HR: 0,
  RBI: 0,
  runs: 0,
  board: 0,
});
export function evaluateGame(game: Game, bands: string[]) {
  let fenceUsed = 0;
  const totals: Record<string, Totals> = Object.create(null),
    rows: (Play & { official: string; delta: number })[] = [];
  for (const play of game.plays) {
    if (play.voided) {
      rows.push({ ...play, official: "Voided", delta: 0 });
      continue;
    }
    const t = (totals[play.playerId] ??= emptyTotals()),
      b = game.rules.board,
      band = game.kind === "Tournament" && bands.includes(play.playerId);
    const over =
      play.outcome === "Fence HR" && fenceUsed >= game.rules.fenceLimit;
    const hit =
      play.outcome === "Hit" ||
      play.outcome === "ITP HR" ||
      (play.outcome === "Fence HR" && !over);
    t.PA++;
    if (!["BB", "HBP", "SF"].includes(play.outcome)) t.AB++;
    if (hit) t.H++;
    if (play.outcome === "BB") t.BB++;
    if (play.outcome === "HBP") t.HBP++;
    if (play.outcome === "ROE") t.ROE++;
    if (play.outcome === "SF") t.SF++;
    if (play.outcome === "K") t.K++;
    let delta = 0;
    if (play.outcome === "K") delta = b.strikeout;
    if (play.outcome === "ITP HR") {
      t.HR++;
      delta = b.insidePark;
    }
    if (play.outcome === "Fence HR") {
      if (over) delta = b.overLimit;
      else {
        fenceUsed++;
        t.HR++;
        delta =
          play.runs === 1
            ? band
              ? b.bandSolo
              : b.solo
            : play.runs === 4
              ? b.grandSlam
              : b.multiRun;
      }
    }
    if (!over) {
      t.RBI += play.rbi;
      t.runs += play.runs;
    }
    t.board += delta;
    rows.push({ ...play, official: over ? "OLHR" : play.outcome, delta });
  }
  return { totals, rows, fenceUsed };
}
export function aggregate(book: Scorebook, scope: Scope) {
  const totals: Record<string, Totals> = Object.fromEntries(
    book.players.map((p) => [p.id, emptyTotals()]),
  );
  for (const game of book.games.filter(
    (g) => scope === "Overall" || g.kind === scope,
  ))
    for (const [id, t] of Object.entries(evaluateGame(game, book.bands).totals))
      for (const key of Object.keys(t) as (keyof Totals)[])
        totals[id][key] += t[key];
  return totals;
}
export function rates(t: Totals) {
  const obpDen = t.AB + t.BB + t.HBP + t.SF;
  return {
    AVG: t.AB ? t.H / t.AB : null,
    OBP: obpDen ? (t.H + t.BB + t.HBP) / obpDen : null,
    Reach: t.PA ? (t.H + t.BB + t.HBP + t.ROE) / t.PA : null,
  };
}
