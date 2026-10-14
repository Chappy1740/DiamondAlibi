import test from "node:test";
import assert from "node:assert/strict";
import { gameAudit } from "../src/lib/game-audit.ts";
test("game details retain own history and shared Bands without unrelated league/tournament events", () => {
  const ownStart = { action: "start", after: { gameId: "game" } };
  const ownCorrection = { action: "correct", before: { game: { id: "game" } }, after: { game: { id: "game" } } };
  const band = { action: "band", tournamentId: "cup", before: true, after: false };
  const entries = [ownStart, ownCorrection, band,
    { action: "score", after: { game: { id: "league-game" } } },
    { action: "band", tournamentId: "other-cup" },
    { action: "create_scoring_league", after: { name: "Other league" } },
    null, [], "game", { after: null }];
  const before = structuredClone(entries);
  assert.deepEqual(gameAudit(entries, "game", "cup"), [ownStart, ownCorrection, band]);
  assert.deepEqual(gameAudit(entries, "game", null), [ownStart, ownCorrection]);
  assert.deepEqual(gameAudit(entries, "missing", null), []);
  assert.deepEqual(entries, before);
});
