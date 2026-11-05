import test from "node:test";
import assert from "node:assert/strict";
import { PREFERRED_VOICE, pickVoice, ANNOUNCER_STORAGE_KEY, DEFAULT_ANNOUNCER_PREFS, NEUTRAL_LINES, announcerActive, createSpeaker, neutralLine, parsePrefs } from "../src/lib/roast-announcer.ts";
import { ROAST_CATALOG } from "../src/lib/roast-club.ts";

function fake() {
  const spoken: string[] = []; let cancels = 0;
  const utterances: { text: string; volume: number; onerror?: ((e: { error?: string }) => void) | null }[] = [];
  const synth = { speak: (u: unknown) => spoken.push((u as { text: string }).text), cancel: () => { cancels++; } };
  const makeUtterance = (text: string, volume: number) => { const u = { text, volume, onerror: null }; utterances.push(u); return u; };
  return { spoken, utterances, get cancels() { return cancels; }, speaker: createSpeaker({ synth, makeUtterance }) };
}

test("defaults are silent and not an announcer", () => {
  assert.deepEqual(DEFAULT_ANNOUNCER_PREFS, { gameId: null, muted: true, volume: 0.8, speakRoasts: false });
  assert.equal(ANNOUNCER_STORAGE_KEY.length > 0, true);
  assert.equal(announcerActive(DEFAULT_ANNOUNCER_PREFS, "g1"), false);
});

test("bad or missing stored prefs fall back to silent defaults", () => {
  for (const raw of [null, undefined, "", "{", "[]", 5, "null"]) assert.deepEqual(parsePrefs(raw), DEFAULT_ANNOUNCER_PREFS);
  const p = parsePrefs({ gameId: 7, muted: "no", volume: "loud", speakRoasts: "yes" });
  assert.deepEqual(p, DEFAULT_ANNOUNCER_PREFS);
  assert.equal(parsePrefs({ volume: 9 }).volume, 1);
  assert.equal(parsePrefs({ volume: -3 }).volume, 0);
  assert.equal(parsePrefs({ volume: NaN }).volume, 0.8);
});

test("only the designated device and game, unmuted with volume, is active", () => {
  const on = { gameId: "g1", muted: false, volume: 0.5, speakRoasts: true };
  assert.equal(announcerActive(on, "g1"), true);
  assert.equal(announcerActive(on, "g2"), false);
  assert.equal(announcerActive({ ...on, muted: true }, "g1"), false);
  assert.equal(announcerActive({ ...on, volume: 0 }, "g1"), false);
  assert.equal(announcerActive({ ...on, gameId: null }, "g1"), false);
  assert.equal(parsePrefs(JSON.stringify(on)).muted, false);
});

test("neutral lines never carry a name and differ from every roast", () => {
  const roastLines = Object.values(ROAST_CATALOG).flat();
  for (const line of Object.values(NEUTRAL_LINES)) {
    assert.ok(!line.includes("{name}"));
    assert.ok(!roastLines.includes(line));
    assert.ok(line.length < 60);
  }
  assert.equal(neutralLine("Hit", false), "Single.");
  assert.equal(neutralLine("HBP", false), null);
  assert.equal(neutralLine("Fence HR", false), "Home run.");
});

test("an over-limit home run is announced as an out, never as a home run", () => {
  const line = neutralLine("Fence HR", true);
  assert.ok(line && /out/i.test(line) && !/home run/i.test(line));
});

test("the same key is spoken once; a new line replaces what is playing", () => {
  const f = fake();
  assert.equal(f.speaker.say("c1", "Single.", 0.5), "spoken");
  assert.equal(f.speaker.say("c1", "Single.", 0.5), "duplicate");
  assert.equal(f.speaker.say("c2", "Double.", 0.5), "spoken");
  assert.deepEqual(f.spoken, ["Single.", "Double."]);
  assert.equal(f.cancels, 2);
  assert.equal(f.utterances[0].volume, 0.5);
});

test("volume is clamped and empty text is never spoken", () => {
  const f = fake();
  f.speaker.say("a", "Out.", 7);
  f.speaker.say("b", "Out.", -1);
  assert.deepEqual(f.utterances.map((u) => u.volume), [1, 0]);
  assert.equal(f.speaker.say("c", "   ", 1), "empty");
  assert.equal(f.speaker.say("", "Out.", 1), "empty");
});

test("without speech support it reports unsupported and never throws", () => {
  const s = createSpeaker({ synth: null, makeUtterance: () => null });
  assert.equal(s.supported, false);
  assert.equal(s.say("a", "Out.", 1), "unsupported");
  s.stop();
  const boom = createSpeaker({ synth: { speak() { throw new Error("x"); }, cancel() {} }, makeUtterance: () => ({}) });
  assert.equal(boom.say("a", "Out.", 1), "unsupported");
});

test("a browser that refuses speech before a tap is flagged, and a tap unlocks it", () => {
  const f = fake();
  f.speaker.say("a", "Out.", 1);
  f.utterances[0].onerror?.({ error: "not-allowed" });
  assert.equal(f.speaker.blocked, true);
  assert.equal(f.speaker.unlock(1), "spoken");
  assert.equal(f.speaker.blocked, false);
  assert.equal(f.spoken.at(-1), "Announcer on.");
});

test("unlock can be repeated and does not consume play keys", () => {
  const f = fake();
  f.speaker.unlock(1); f.speaker.unlock(1);
  assert.equal(f.speaker.say("c1", "Out.", 1), "spoken");
});

test("memory is bounded so old keys eventually age out", () => {
  const f = fake();
  const s = createSpeaker({ synth: { speak() {}, cancel() {} }, makeUtterance: () => ({}) }, 3);
  for (const k of ["a", "b", "c", "d"]) s.say(k, "Out.", 1);
  assert.equal(s.say("a", "Out.", 1), "spoken");
  assert.equal(s.say("d", "Out.", 1), "duplicate");
  void f;
});

test("the default announcer voice is Daniel, best quality first, else the phone default", () => {
  assert.equal(PREFERRED_VOICE, "Daniel");
  const v = (name: string) => ({ name, lang: "en-GB" });
  const all = [v("Samantha"), v("Daniel"), v("Daniel (Enhanced)"), v("Daniel (Premium)"), v("Danielle")];
  assert.equal(pickVoice(all)?.name, "Daniel (Premium)");
  assert.equal(pickVoice(all.filter((x) => !/Premium/.test(x.name)))?.name, "Daniel (Enhanced)");
  assert.equal(pickVoice([v("Samantha"), v("Daniel")])?.name, "Daniel");
  assert.equal(pickVoice([v("Samantha"), v("Karen")]), null);
  assert.equal(pickVoice([]), null);
  assert.equal(pickVoice(all, "")?.name, undefined);
  assert.equal(pickVoice([v("Daniel (Enhanced)")], "daniel")?.name, "Daniel (Enhanced)");
});
