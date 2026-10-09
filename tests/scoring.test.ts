import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createScorebook,
  applyCommand,
  evaluateGame,
  aggregate,
  rates,
  DEFAULT_BOARD,
  type Scorebook,
  type Command,
} from "../src/lib/scoring.ts";

const initial = () =>
  createScorebook({
    teamId: "team",
    seasonId: "season",
    dayId: "day",
    players: [
      { id: "a", name: "A" },
      { id: "b", name: "B" },
    ],
    bands: [],
    rules: { version: "v1", fenceLimit: 1, board: { ...DEFAULT_BOARD } },
  });
let seq = 0;
const send = (b: Scorebook, c: Command) =>
  applyCommand(b, {
    commandId: `cmd-${++seq}`,
    expectedRevision: b.revision,
    actor: "test member",
    at: "2026-10-09T10:00:00Z",
    command: c,
  });
const start = (
  b = initial(),
  id = "g",
  kind: "League" | "Tournament" = "League",
) =>
  send(b, {
    type: "start",
    gameId: id,
    opponent: "Opponent",
    kind,
    lineup: ["a"],
  });
const score = (b: Scorebook, outcome: any, runs = 0, rbi = 0, gameId = "g") =>
  send(b, {
    type: "score",
    gameId,
    playId: `p-${++seq}`,
    playerId: "a",
    outcome,
    runs,
    rbi,
  });
test("established seven-outcome example and denominator formulas", () => {
  let exact = start(
    createScorebook({
      ...initial(),
      rules: { version: "zero", fenceLimit: 0, board: { ...DEFAULT_BOARD } },
    }),
  );
  for (const o of ["Hit", "BB", "HBP", "ROE", "K", "SF"])
    exact = score(exact, o);
  exact = score(exact, "Fence HR", 1, 1);
  const t = aggregate(exact, "Overall").a;
  assert.equal(t.AB, 4);
  assert.equal(t.PA, 7);
  assert.deepEqual(rates(t), { AVG: 1 / 4, OBP: 3 / 7, Reach: 4 / 7 });
  assert.equal(t.HR, 0);
  assert.equal(t.RBI, 0);
  assert.equal(t.board, 2);
  assert.deepEqual(rates(aggregate(initial(), "Overall").a), {
    AVG: null,
    OBP: null,
    Reach: null,
  });
});

test("reach example and corrected batter transfer totals without changing batting order", () => {
  let b = start();
  for (const o of ["Hit", "Hit", "BB", "HBP", "ROE", "Out"]) b = score(b, o);
  assert.equal(rates(aggregate(b, "Overall").a).Reach, 5 / 6);
  const pointer = b.games[0].next;
  b = send(b, {
    type: "correct",
    gameId: "g",
    playId: b.games[0].plays[0].id,
    playerId: "b",
    outcome: "Hit",
    runs: 0,
    rbi: 0,
    voided: false,
    reason: "Wrong batter",
  });
  assert.equal(aggregate(b, "Overall").b.H, 1);
  assert.equal(aggregate(b, "Overall").a.H, 1);
  assert.equal(b.games[0].next, pointer);
});
test("every default HR board treatment; ITP ignores bands and fence allowance", () => {
  for (const band of [false, true])
    for (const runs of [1, 2, 3, 4]) {
      let b = initial();
      if (band) b = send(b, { type: "bands", players: ["a", "b"] });
      b = start(b);
      b = score(b, "Fence HR", runs, runs);
      assert.equal(
        aggregate(b, "Overall").a.board,
        runs === 1 ? (band ? -1 : 1) : runs === 4 ? -1 : 0,
      );
      b = score(b, "ITP HR", runs, runs);
      assert.equal(evaluateGame(b.games[0], b.bands).fenceUsed, 1);
      assert.equal(aggregate(b, "Overall").a.HR, 2);
      b = score(b, "Fence HR", 4, 4);
      const ev = evaluateGame(b.games[0], b.bands);
      assert.equal(ev.rows[2].official, "OLHR");
      assert.equal(ev.rows[2].delta, 1);
      assert.equal(ev.totals.a.RBI, runs * 2);
    }
});
test("fence resets each game, day bands persist, shared scope engine separates league/tournament", () => {
  let b = send(initial(), { type: "bands", players: ["a"] });
  b = score(start(b), "Fence HR", 1, 1);
  b = start(b, "g2", "Tournament");
  b = score(b, "Fence HR", 1, 1, "g2");
  assert.equal(aggregate(b, "Overall").a.HR, 2);
  assert.equal(aggregate(b, "League").a.board, -1);
  assert.equal(aggregate(b, "Tournament").a.board, -1);
});
test("completed-game correction replays downstream OLHR and retains prior rule version", () => {
  let b = score(score(start(), "Fence HR", 1, 1), "Fence HR", 4, 4);
  b = send(b, { type: "complete", gameId: "g" });
  assert.throws(() => score(b, "Hit"), /complete/);
  b = send(b, {
    type: "rules",
    rules: {
      version: "v2",
      fenceLimit: 9,
      board: { ...DEFAULT_BOARD, solo: 7 },
    },
  });
  assert.equal(b.games[0].rules.fenceLimit, 1);
  assert.equal(aggregate(b, "Overall").a.board, 2);
  b = send(b, {
    type: "correct",
    gameId: "g",
    playId: b.games[0].plays[0].id,
    outcome: "Out",
    runs: 0,
    rbi: 0,
    voided: false,
    reason: "Wrong outcome",
  });
  const t = aggregate(b, "Overall").a;
  assert.equal(t.HR, 1);
  assert.equal(t.RBI, 4);
  assert.equal(t.board, -1);
  assert.equal(b.audit.at(-1)?.reason, "Wrong outcome");
  assert.throws(() => send(b, { type: "bands", players: [] }), /reason/);
  b = send(b, {
    type: "bands",
    players: [],
    reason: "Day assignment correction",
  });
  assert.equal(b.audit.at(-1)?.reason, "Day assignment correction");
});
test("idempotent retries, revision conflicts and command-ID payload mismatch", () => {
  const b = initial(),
    request = {
      commandId: "once",
      expectedRevision: 0,
      actor: "member",
      at: "2026-10-09T10:00:00Z",
      command: {
        type: "start",
        gameId: "g",
        opponent: "Opp",
        kind: "League",
        lineup: ["a"],
      } as Command,
    };
  const next = applyCommand(b, request);
  assert.strictEqual(applyCommand(next, request), next);
  assert.throws(
    () => applyCommand(next, { ...request, commandId: "new" }),
    /changed/,
  );
  assert.throws(
    () =>
      applyCommand(next, {
        ...request,
        command: { ...request.command, opponent: "Other" } as Command,
      }),
    /different/,
  );
  assert.equal(b.revision, 0);
});
test("next batter, manual override and lineup changes reject stale batter", () => {
  let b = send(initial(), {
    type: "start",
    gameId: "g",
    opponent: "Opp",
    kind: "League",
    lineup: ["a", "b"],
  });
  b = score(b, "Hit");
  assert.equal(b.games[0].next, 1);
  assert.throws(() => score(b, "Hit"), /batter changed/);
  b = send(b, { type: "lineup", gameId: "g", lineup: ["b", "a"] });
  assert.equal(b.games[0].next, 0);
  b = send(b, { type: "batter", gameId: "g", playerId: "a" });
  b = score(b, "K");
  assert.equal(b.games[0].next, 0);
  assert.throws(
    () => send(b, { type: "lineup", gameId: "g", lineup: ["outsider"] }),
    /roster/,
  );
});
test("manual void excludes totals, keeps row and audit; inputs fail before mutation", () => {
  let b = score(start(), "K");
  const prev = JSON.stringify(b);
  assert.throws(() => score(b, "Fence HR", 0, 0), /home run/);
  assert.equal(JSON.stringify(b), prev);
  assert.throws(() => score(b, "Hit", 1, 2), /exceed/);
  assert.throws(() => score(b, "Bogus"), /recognized/);
  b = send(b, {
    type: "correct",
    gameId: "g",
    playId: b.games[0].plays[0].id,
    outcome: "K",
    runs: 0,
    rbi: 0,
    voided: true,
    reason: "Duplicate",
  });
  assert.equal(aggregate(b, "Overall").a.PA, 0);
  assert.equal(evaluateGame(b.games[0], b.bands).rows[0].official, "Voided");
});
