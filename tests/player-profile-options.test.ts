import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fieldingPositions, playLevels } from "../src/lib/player-profile.ts";

test("signup choices match the database constraints", () => {
  const sql = readFileSync(
    new URL("../supabase/migrations/20261106164718_player_signup_profile.sql", import.meta.url),
    "utf8",
  );
  for (const [column, choices] of [
    ["play_level", playLevels],
    ["fielding_position", fieldingPositions],
  ] as const) {
    const constraint = sql.match(new RegExp(`check \\(${column} in \\(([\\s\\S]*?)\\)\\)`));
    assert.ok(constraint, `Missing constraint for ${column}`);
    const values = Array.from(constraint[1].matchAll(/'((?:''|[^'])*)'/g), ([, value]) => value.replaceAll("''", "'"));
    assert.deepEqual(values, [...choices], column);
  }
});
