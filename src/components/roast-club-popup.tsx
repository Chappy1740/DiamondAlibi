"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { roastClubAction } from "@/app/club/roast-club-actions";
import { createRoastPlanner } from "@/lib/roast-club";
import { planConfirmedRoast, type SnapshotGame } from "@/lib/roast-club-flow";
import { ANNOUNCER_STORAGE_KEY, announcerActive, createSpeaker, parsePrefs, pickVoice } from "@/lib/roast-announcer";
import type { RoastClubState } from "@/lib/roast-club-consent";

export type RoastAnnounce = {
  request: unknown;
  receipt: { status?: string; duplicate?: boolean };
  games: readonly SnapshotGame[];
  displayName: (playerId: string) => string | undefined;
};

const SHOW_MS = 7000;

/** One speaker per page, built on the browser’s own speech. Null when the browser has none. */
let pageSpeaker: ReturnType<typeof createSpeaker> | null = null;
export function getSpeaker() {
  if (pageSpeaker) return pageSpeaker;
  const synth = typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined" ? window.speechSynthesis : null;
  pageSpeaker = createSpeaker({
    synth,
    makeUtterance: (text, volume) => {
      const u = new SpeechSynthesisUtterance(text);
      u.volume = volume;
      try {
        const voice = pickVoice(window.speechSynthesis.getVoices());
        if (voice) { u.voice = voice; u.lang = voice.lang; }
      } catch { /* phone default voice */ }
      return u;
    },
  });
  return pageSpeaker;
}
export function readAnnouncerPrefs() {
  try { return parsePrefs(window.localStorage.getItem(ANNOUNCER_STORAGE_KEY)); } catch { return parsePrefs(null); }
}

/** Owns the popup. Never throws, never blocks scoring, and says nothing when in doubt. */
export function useRoastClub(teamId: string, enabled = true) {
  const planner = useRef<ReturnType<typeof createRoastPlanner> | null>(null);
  const cache = useRef<RoastClubState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const lastRefresh = useRef(0);
  const [line, setLine] = useState<string | null>(null);
  /** Opted-in player ids from the last consent read (null = unknown or feature off), for the scorer's read-only list. */
  const [participants, setParticipants] = useState<readonly string[] | null>(null);

  const readConsent = useCallback(async (): Promise<RoastClubState | null> => {
    try {
      const result = await roastClubAction({ type: "read", teamId });
      const state = result.status === "ok" ? result.data : null;
      if (alive.current) {
        // Keep the last eligibility hint on transient failures so the next play can recheck.
        // A roast still requires a successful fresh consent read.
        if (result.status !== "unavailable") cache.current = state;
        setParticipants(state?.optedInPlayerIds ?? null);
      }
      return state;
    } catch {
      if (alive.current) setParticipants(null);
      return null;
    }
  }, [teamId]);

  const refresh = useCallback(async () => {
    lastRefresh.current = Date.now();
    await readConsent();
  }, [readConsent]);

  useEffect(() => {
    alive.current = true;
    // Only scoring screens need consent; other screens make no Roast Club calls at all.
    if (!enabled) { cache.current = null; return; }
    void refresh();
    // Throttled: coming back to the tab refreshes at most about once a minute.
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRefresh.current > 60_000) void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      alive.current = false;
      document.removeEventListener("visibilitychange", onVisible);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [refresh, enabled]);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setLine(null);
  }, []);

  const announce = useCallback((input: RoastAnnounce) => {
    // Fire and forget: scoring has already succeeded and must never wait on or fail because of this.
    void (async () => {
      try {
        const req = input.request as { commandId?: unknown; gameId?: unknown; change?: { type?: unknown; playId?: unknown } };
        if (req?.change?.type !== "score") return;
        if (typeof req.commandId !== "string" || typeof req.gameId !== "string" || typeof req.change.playId !== "string") return;
        planner.current ??= createRoastPlanner();
        const decision = await planConfirmedRoast({
          planner: planner.current,
          commandId: req.commandId,
          playId: req.change.playId,
          gameId: req.gameId,
          receipt: input.receipt,
          games: input.games,
          displayName: input.displayName,
          cachedConsent: cache.current,
          readConsent,
        });
        // Speech: only on the one designated, unmuted device for this exact game. Failures are silent.
        try {
          const prefs = readAnnouncerPrefs();
          if (announcerActive(prefs, req.gameId) && input.receipt.status === "accepted" && input.receipt.duplicate === false) {
            // The announcer says only the roast: no plain result line, nothing for non-participants.
            const spoken = decision.kind === "show" ? decision.text : null;
            if (spoken) getSpeaker().say(req.commandId, spoken, prefs.volume);
          }
        } catch { /* speech is optional */ }
        if (decision.kind !== "show" || !alive.current) return;
        setLine(decision.text);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => { if (alive.current) setLine(null); }, SHOW_MS);
      } catch {
        /* a roast is optional; never surface an error for it */
      }
    })();
  }, [readConsent]);

  const popup = line ? (
    <div className="roast-popup" role="status" aria-live="polite" data-testid="roast-popup">
      <p>{line}</p>
      <button type="button" className="roast-popup-close" onClick={dismiss} aria-label="Dismiss roast">×</button>
    </div>
  ) : null;

  return { announce, popup, participants };
}
