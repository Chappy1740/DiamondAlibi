"use client";
import { useEffect, useState } from "react";
import { ANNOUNCER_STORAGE_KEY, DEFAULT_ANNOUNCER_PREFS, type AnnouncerPrefs } from "@/lib/roast-announcer";
import { getSpeaker, readAnnouncerPrefs } from "./roast-club-popup";

/** Per-device announcer settings for one game. Off and muted until someone turns it on here. */
export function AnnouncerControls({ gameId }: { gameId: string }) {
  const [prefs, setPrefs] = useState<AnnouncerPrefs>(DEFAULT_ANNOUNCER_PREFS);
  const [note, setNote] = useState("");
  const [supported, setSupported] = useState(true);
  useEffect(() => { setPrefs(readAnnouncerPrefs()); setSupported(getSpeaker().supported); }, []);
  const mine = prefs.gameId === gameId;
  const listening = mine && !prefs.muted;
  // A locked phone pauses web pages, so announcements stop. Ask the browser to keep the screen on
  // while the announcer is listening. Optional: some browsers refuse, and the note below says so.
  useEffect(() => {
    if (!listening) return;
    let lock: { release(): Promise<void> } | null = null;
    let gone = false;
    const ask = async () => {
      try {
        const api = (navigator as unknown as { wakeLock?: { request(type: "screen"): Promise<{ release(): Promise<void> }> } }).wakeLock;
        if (!api || document.visibilityState !== "visible") return;
        const got = await api.request("screen");
        if (gone) await got.release().catch(() => {}); else lock = got;
      } catch { /* refused: the on-screen note still tells the scorer to keep the screen on */ }
    };
    void ask();
    const again = () => { if (document.visibilityState === "visible") void ask(); };
    document.addEventListener("visibilitychange", again);
    return () => { gone = true; document.removeEventListener("visibilitychange", again); void lock?.release().catch(() => {}); };
  }, [listening]);
  function update(next: AnnouncerPrefs) {
    setPrefs(next);
    try { window.localStorage.setItem(ANNOUNCER_STORAGE_KEY, JSON.stringify(next)); } catch { setNote("This browser would not save the setting, so it may reset."); }
  }
  if (!supported) return <section className="card detail-card" aria-label="Clubhouse announcer"><h3>Clubhouse announcer</h3><p>This browser cannot speak out loud, so announcements are not available here. Text popups still work.</p></section>;
  return (
    <section className="card detail-card" aria-label="Clubhouse announcer">
      <h3>Clubhouse announcer</h3>
      <p>Use one device per game as the announcer. It reads the Roast Club line aloud after each confirmed play, for players who opted in. Sound comes out of whatever this phone is connected to, such as headphones or a Bluetooth speaker; test it before game time. Keep this screen on and open: a locked phone pauses the announcer.</p>
      <label className="check-row"><input type="checkbox" checked={mine} onChange={(e) => update({ ...prefs, gameId: e.target.checked ? gameId : null, muted: e.target.checked ? prefs.muted : true })} /> This device is the announcer for this game</label>
      {mine && (
        <>
          <button type="button" className="button primary" onClick={() => {
            const next = { ...prefs, muted: false };
            update(next);
            const result = getSpeaker().unlock(next.volume);
            setNote(result === "spoken" ? "Announcer is on. Did you hear it?" : "Could not play sound on this browser.");
          }}>Turn sound on and test</button>
          <button type="button" className="button secondary" onClick={() => { update({ ...prefs, muted: true }); getSpeaker().stop(); setNote("Muted."); }}>Mute</button>
          <label>Volume <input type="range" min={0} max={1} step={0.1} value={prefs.volume} onChange={(e) => update({ ...prefs, volume: Number(e.target.value) })} aria-label="Announcer volume" /></label>
          <p role="status">{prefs.muted ? "Muted." : "Sound on."} {note}</p>
        </>
      )}
    </section>
  );
}
