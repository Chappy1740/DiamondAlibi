import test from "node:test";
import assert from "node:assert/strict";
import { parseNamedPlay } from "../src/lib/named-play.ts";
const roster = [{ id: "a", display_name: "Synthetic Alex" }, { id: "b", display_name: "Morgan" }];
test("named results resolve only authorized roster IDs and established outcomes", () => {
  assert.deepEqual(parseNamedPlay("Morgan hit", roster), { status: "ok", playerId: "b", outcome: "1B", runs: 0, rbi: 0 });
  assert.deepEqual(parseNamedPlay("Synthetic Alex home run two RBI", roster), { status: "ok", playerId: "a", outcome: "Fence HR", runs: 2, rbi: 2 });
  assert.deepEqual(parseNamedPlay("Morgan inside the park home run 3 runs 2 RBI", roster), { status: "ok", playerId: "b", outcome: "ITP HR", runs: 3, rbi: 2 });
  assert.equal(parseNamedPlay("Unknown hit", roster).status, "invalid");
  assert.deepEqual(parseNamedPlay("Morgan double", roster), { status: "ok", playerId: "b", outcome: "2B", runs: 0, rbi: 0 });
});
test("counts, duplicate counts and ambiguous names cannot silently score", () => {
  for (const text of ["Morgan hit 2 runs 3 RBI", "Morgan home run 0 runs", "Morgan hit 5 RBI", "Morgan hit 1 RBI 2 RBI", "Morgan hit -1 runs", "Morgan hit 1.5 runs"])
    assert.equal(parseNamedPlay(text, roster).status, "invalid", text);
  assert.equal(parseNamedPlay("Morgan hit", [...roster, { id: "c", display_name: "Morgan" }]).status, "invalid");
});
test("result-only input uses an explicit selected/next player, never a guessed name", () => {
  assert.deepEqual(parseNamedPlay("Strikeout", roster, "b"), { status: "ok", playerId: "b", outcome: "K", runs: 0, rbi: 0 });
  assert.equal(parseNamedPlay("hit", roster).status, "invalid");
  assert.equal(parseNamedPlay("hit", roster, "outside-roster").status, "invalid");
});
