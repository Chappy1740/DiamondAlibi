/**
 * Full Clubhouse Announcer logic. Pure and injectable so it can be tested without a browser.
 * Defaults are silent: muted, no designated game, roasts not spoken. Speech is built-in browser
 * speechSynthesis only (no paid service). Whether sound reaches a Bluetooth speaker depends on the
 * phone's own audio route and must be checked on a real device; nothing here promises it.
 */
import { roastCategory, type RoastCategory } from "./roast-club.ts";
import type { Outcome } from "./scoring.ts";

export type AnnouncerPrefs = {
  /** The one game this device announces. Null means this device is not an announcer. */
  gameId: string | null;
  muted: boolean;
  volume: number; // 0..1
  speakRoasts: boolean;
};
export const DEFAULT_ANNOUNCER_PREFS: AnnouncerPrefs = { gameId: null, muted: true, volume: 0.8, speakRoasts: false };
export const ANNOUNCER_STORAGE_KEY = "da-roast-announcer-v1";

/** Reads stored prefs; anything odd falls back to the silent defaults. */
export function parsePrefs(raw: unknown): AnnouncerPrefs {
  try {
    const value = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!value || typeof value !== "object") return { ...DEFAULT_ANNOUNCER_PREFS };
    const v = value as Record<string, unknown>;
    return {
      gameId: typeof v.gameId === "string" && v.gameId.length > 0 && v.gameId.length <= 64 ? v.gameId : null,
      muted: v.muted === false ? false : true,
      volume: typeof v.volume === "number" && Number.isFinite(v.volume) ? Math.min(1, Math.max(0, v.volume)) : DEFAULT_ANNOUNCER_PREFS.volume,
      speakRoasts: v.speakRoasts === true,
    };
  } catch {
    return { ...DEFAULT_ANNOUNCER_PREFS };
  }
}

/** True only when this device is the designated announcer for this exact game and is not muted. */
export const announcerActive = (prefs: AnnouncerPrefs, gameId: string) =>
  prefs.gameId !== null && prefs.gameId === gameId && !prefs.muted && prefs.volume > 0;

/** Neutral lines never use a player's name, so they need no consent and are not roasts. */
export const NEUTRAL_LINES: Record<RoastCategory, string> = {
  "1B": "Single.", "2B": "Double.", "3B": "Triple.", HR: "Home run.", "ITP HR": "Inside the park home run.",
  K: "Strikeout.", "K Swinging": "Strikeout swinging.", "K Looking": "Strikeout looking.", SOFO: "Strikeout.", DP: "Double play.",
  OUT: "Out.", BB: "Walk.", SF: "Sacrifice fly.", E: "Reached on an error.",
  "OVER-LIMIT HR": "Fence limit reached. Recorded as an out.",
};
export function neutralLine(outcome: Outcome, overLimitFenceHr: boolean): string | null {
  const category = roastCategory(outcome, overLimitFenceHr);
  return category ? NEUTRAL_LINES[category] : null;
}

export type SpeechSynthLike = {
  speak(utterance: unknown): void;
  cancel(): void;
};
export type UtteranceLike = { onerror?: { bivarianceHack(event: { error?: string }): void }["bivarianceHack"] | null };
export type SpeakerDeps = {
  synth: SpeechSynthLike | null;
  makeUtterance: (text: string, volume: number) => UtteranceLike | null;
};
export type SpeakResult = "spoken" | "duplicate" | "unsupported" | "blocked" | "empty";

/** One speaker per page. Same key is never spoken twice; a new line replaces any still playing. */
export function createSpeaker(deps: SpeakerDeps, memory = 200) {
  const seen: string[] = [];
  let blocked = false;
  return {
    get supported() { return deps.synth !== null; },
    get blocked() { return blocked; },
    /** Call from a tap. Browsers only allow speech after a user gesture. */
    unlock(volume: number): SpeakResult {
      return this.say("__unlock__:" + seen.length, "Announcer on.", volume, true);
    },
    say(key: string, text: string, volume: number, force = false): SpeakResult {
      if (!deps.synth) return "unsupported";
      const clean = text.trim();
      if (!key || !clean) return "empty";
      if (!force && seen.includes(key)) return "duplicate";
      try {
        const utterance = deps.makeUtterance(clean, Math.min(1, Math.max(0, volume)));
        if (!utterance) return "unsupported";
        utterance.onerror = (event) => { if (event?.error === "not-allowed") blocked = true; };
        if (!force) { seen.push(key); if (seen.length > memory) seen.shift(); }
        deps.synth.cancel();
        deps.synth.speak(utterance);
        blocked = false;
        return "spoken";
      } catch {
        return "unsupported";
      }
    },
    stop() { try { deps.synth?.cancel(); } catch { /* nothing to stop */ } },
  };
}
