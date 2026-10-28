import test from "node:test";
import assert from "node:assert/strict";
import { gameSetupHref, safeGameSetupReturn } from "../src/lib/game-navigation.ts";

test("game setup preserves team, season and competition without creating a game", () => {
  for (const competition of [{}, { league: "league 1" }, { tournament: "cup&2" }]) {
    const href = gameSetupHref("team A", "season B", competition);
    assert.equal(safeGameSetupReturn(href, "team A", "season B"), href);
    assert.equal(new URL(href, "https://local.invalid").searchParams.get("setup"), "1");
  }
});
test("return path rejects foreign context, external targets, commands and ambiguous queries", () => {
  const valid = gameSetupHref("team", "season");
  for (const value of [undefined, ["/club/score?team=team&season=season&setup=1"], {}, "https://evil.invalid/club/score?team=team&season=season&setup=1", "//evil.invalid/club/score?team=team&season=season&setup=1", valid + "&game=existing", valid + "#x", valid + "&team=other", valid + "&league=a&tournament=b", valid.replace("setup=1", "setup=0"), valid.replace("season=season", "season=")]) {
    assert.equal(safeGameSetupReturn(value, "team", "season"), undefined, String(value));
  }
  assert.equal(safeGameSetupReturn(valid, "other", "season"), undefined);
  assert.equal(safeGameSetupReturn(valid, "team", "other"), undefined);
});
