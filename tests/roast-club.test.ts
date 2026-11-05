import test from "node:test";
import assert from "node:assert/strict";
import { OUTCOMES, type Outcome } from "../src/lib/scoring.ts";
import {
  DEFAULT_ROAST_SETTINGS,
  ROAST_BANNED_PATTERN, ROAST_OFF_LIMITS_PATTERN,
  ROAST_CATALOG,
  ROAST_CATEGORY_BY_OUTCOME,
  createRoastPlanner,
  roastCategory,
  safeDisplayName,
  stillConsented,
  type RoastInput,
} from "../src/lib/roast-club.ts";

const on = { enabled: true };
const yes = new Map([["p1", true]]);
const base = (over: Partial<RoastInput> = {}): RoastInput => ({
  commandId: "c1",
  playerId: "p1",
  displayName: "Synthetic Alex",
  outcome: "1B",
  settings: on,
  consent: yes,
  ...over,
});
const fixed = (value: number) => () => value;

test("Roast Club is off by default", () => {
  assert.deepEqual(DEFAULT_ROAST_SETTINGS, { enabled: false });
  const decision = createRoastPlanner().plan(base({ settings: DEFAULT_ROAST_SETTINGS }));
  assert.deepEqual(decision, { kind: "skip", reason: "disabled" });
});

test("every stored outcome value is deliberately mapped", () => {
  for (const outcome of OUTCOMES) assert.ok(outcome in ROAST_CATEGORY_BY_OUTCOME, outcome);
  assert.equal(ROAST_CATEGORY_BY_OUTCOME.Hit, "1B");
  assert.equal(ROAST_CATEGORY_BY_OUTCOME.HBP, null);
  assert.equal(ROAST_CATEGORY_BY_OUTCOME.ROE, "E");
  assert.equal(ROAST_CATEGORY_BY_OUTCOME["Fence HR"], "HR");
  assert.equal(ROAST_CATEGORY_BY_OUTCOME["K Looking"], "K Looking");
});

test("the catalog is sized, unique, clean and speakable", () => {
  for (const [category, lines] of Object.entries(ROAST_CATALOG)) {
    assert.ok(lines.length >= 5 && lines.length <= 10, `${category} has ${lines.length} lines`);
    assert.equal(new Set(lines).size, lines.length, `${category} has duplicates`);
    for (const line of lines) {
      assert.equal(line.split("{name}").length - 1, 1, `${category}: exactly one {name}: ${line}`);
      assert.ok(line.length <= 110, `${category}: too long to speak comfortably: ${line}`);
      assert.ok(!ROAST_BANNED_PATTERN.test(line), `${category}: banned term: ${line}`);
      assert.ok(!ROAST_OFF_LIMITS_PATTERN.test(line), `${category}: off-limits topic (mental health or body weight): ${line}`);
      assert.ok(!/[{}]/.test(line.replace("{name}", "")), `${category}: stray braces: ${line}`);
    }
  }
});

test("every mapped category has catalog lines", () => {
  for (const category of new Set(Object.values(ROAST_CATEGORY_BY_OUTCOME)))
    if (category) assert.ok(ROAST_CATALOG[category].length > 0, category);
  assert.ok(ROAST_CATALOG["OVER-LIMIT HR"].length > 0);
});

test("only an explicit true consent shows a roast (fail closed)", () => {
  for (const consent of [
    new Map<string, boolean>(),
    new Map([["p1", false]]),
    new Map([["other", true]]),
    new Map([["p1", undefined as unknown as boolean]]),
    new Map([["p1", "true" as unknown as boolean]]),
    new Map([["p1", 1 as unknown as boolean]]),
  ]) {
    const decision = createRoastPlanner().plan(base({ consent }));
    assert.deepEqual(decision, { kind: "skip", reason: "no-consent" });
  }
  assert.equal(createRoastPlanner().plan(base()).kind, "show");
});

test("a nonparticipant is never targeted for any outcome", () => {
  const planner = createRoastPlanner({ random: fixed(0) });
  const none = new Map<string, boolean>([["p1", false]]);
  let index = 0;
  for (const outcome of OUTCOMES)
    for (const overLimitFenceHr of [false, true]) {
      const decision = planner.plan(base({ outcome, overLimitFenceHr, consent: none, commandId: `n${index++}` }));
      assert.equal(decision.kind, "skip");
    }
});

test("opting out is honored at playback time", () => {
  assert.equal(stillConsented("p1", yes, on), true);
  assert.equal(stillConsented("p1", new Map([["p1", false]]), on), false);
  assert.equal(stillConsented("p1", new Map(), on), false);
  assert.equal(stillConsented("p1", yes, { enabled: false }), false);
});

test("a command id shows at most once; skipped commands stay retryable", () => {
  const planner = createRoastPlanner({ random: fixed(0) });
  assert.equal(planner.plan(base({ commandId: "x" })).kind, "show");
  assert.deepEqual(planner.plan(base({ commandId: "x" })), { kind: "skip", reason: "duplicate-command" });
  const blocked = planner.plan(base({ commandId: "y", consent: new Map() }));
  assert.equal(blocked.kind, "skip");
  assert.equal(planner.plan(base({ commandId: "y" })).kind, "show");
  assert.deepEqual(planner.plan(base({ commandId: "" })), { kind: "skip", reason: "duplicate-command" });
});

test("duplicate replays and conflicts never roast", () => {
  const planner = createRoastPlanner();
  assert.deepEqual(planner.plan(base({ commandId: "a", receipt: { duplicate: true } })), { kind: "skip", reason: "not-confirmed" });
  assert.deepEqual(planner.plan(base({ commandId: "b", receipt: { status: "conflict" } })), { kind: "skip", reason: "not-confirmed" });
  assert.equal(planner.plan(base({ commandId: "c", receipt: { status: "ok", duplicate: false } })).kind, "show");
});

test("home-run celebrations are never used for an over-limit fence HR", () => {
  assert.equal(roastCategory("Fence HR", false), "HR");
  assert.equal(roastCategory("Fence HR", true), "OVER-LIMIT HR");
  assert.equal(roastCategory("ITP HR", false), "ITP HR");
  assert.equal(roastCategory("1B", true), "1B");
  const decision = createRoastPlanner({ random: fixed(0) }).plan(base({ outcome: "Fence HR", overLimitFenceHr: true }));
  assert.equal(decision.kind === "show" && decision.category, "OVER-LIMIT HR");
  assert.ok(ROAST_CATALOG["OVER-LIMIT HR"].includes(decision.kind === "show" ? decision.text.replace("Synthetic Alex", "{name}") : ""));
});

test("every outcome you can score gets a roast; a plain hit uses the single lines", () => {
  const planner = createRoastPlanner({ random: fixed(0) });
  for (const outcome of OUTCOMES.filter((o) => o !== "HBP")) {
    const decision = planner.plan(base({ outcome, commandId: "o-" + outcome }));
    assert.equal(decision.kind, "show", outcome);
    if (outcome === "Hit") assert.equal(decision.kind === "show" && decision.category, "1B");
  }
  assert.deepEqual(planner.plan(base({ outcome: "HBP", commandId: "hbp" })), { kind: "skip", reason: "no-roast-for-outcome" });
});

test("names are sanitized and unsafe names fail closed", () => {
  assert.equal(safeDisplayName("  Synthetic   Alex  "), "Synthetic Alex");
  assert.equal(safeDisplayName("Al{ex}<b>"), "Al ex b");
  assert.equal(safeDisplayName("A".repeat(60))?.length, 24);
  assert.equal(safeDisplayName("Zoë O'Neil-Smith Jr."), "Zoë O'Neil-Smith Jr.");
  assert.equal(safeDisplayName(""), null);
  assert.equal(safeDisplayName("   "), null);
  assert.equal(safeDisplayName("​\u0007"), null);
  assert.equal(safeDisplayName(undefined), null);
  assert.equal(safeDisplayName("Chappell"), "Chappell");
  assert.equal(safeDisplayName("Big Hell Boy"), null);
  assert.deepEqual(createRoastPlanner().plan(base({ displayName: "porn" })), { kind: "skip", reason: "unsafe-name" });
});

test("the shown text contains only the sanitized name and no placeholders", () => {
  const decision = createRoastPlanner({ random: fixed(0.99) }).plan(base({ displayName: "  Sam  Slugger " }));
  assert.equal(decision.kind, "show");
  if (decision.kind !== "show") return;
  assert.ok(decision.text.includes("Sam Slugger"));
  assert.ok(!decision.text.includes("{"));
});

test("a category never repeats its previous line back to back", () => {
  let n = 0;
  const planner = createRoastPlanner({ random: () => (n++ % 7) / 7 });
  let previous = "";
  for (let i = 0; i < 60; i++) {
    const decision = planner.plan(base({ commandId: `r${i}` }));
    assert.equal(decision.kind, "show");
    if (decision.kind !== "show") return;
    assert.notEqual(decision.lineId, previous);
    previous = decision.lineId;
  }
});

test("random values at the boundary stay in range", () => {
  for (const value of [0, 0.999999, 1, 5, -1]) {
    const decision = createRoastPlanner({ random: fixed(value) }).plan(base({ commandId: `b${value}` }));
    assert.equal(decision.kind, "show");
  }
});

test("dedupe memory is bounded and evicts the oldest ids", () => {
  const planner = createRoastPlanner({ memory: 2, random: fixed(0) });
  for (const id of ["a", "b", "c"]) assert.equal(planner.plan(base({ commandId: id })).kind, "show");
  assert.equal(planner.plan(base({ commandId: "c" })).kind, "skip");
  assert.equal(planner.plan(base({ commandId: "a" })).kind, "show");
});

test("planning does not mutate its inputs and never changes scoring data", () => {
  const consent = new Map([["p1", true]]);
  const input = Object.freeze(base({ consent, receipt: Object.freeze({ status: "ok" }) }));
  const before = JSON.stringify([...consent]);
  createRoastPlanner().plan(input);
  assert.equal(JSON.stringify([...consent]), before);
  const outcomes: Outcome[] = [...OUTCOMES];
  assert.equal(outcomes.length, OUTCOMES.length);
});
