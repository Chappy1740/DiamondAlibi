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
  function update(next: AnnouncerPrefs) {
    setPrefs(next);
    try { window.localStorage.setItem(ANNOUNCER_STORAGE_KEY, JSON.stringify(next)); } catch { setNote("This browser would not save the setting, so it may reset."); }
  }
  if (!supported) return <section className="card detail-card" aria-label="Clubhouse announcer"><h3>Clubhouse announcer</h3><p>This browser cannot speak out loud, so announcements are not available here. Text popups still work.</p></section>;
  return (
    <section className="card detail-card" aria-label="Clubhouse announcer">
      <h3>Clubhouse announcer</h3>
      <p>Use one device per game as the announcer. It reads short, neutral results aloud after each confirmed play. Sound comes out of whatever this phone is connected to, such as a Bluetooth speaker; test it before game time.</p>
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
          <label className="check-row"><input type="checkbox" checked={prefs.speakRoasts} onChange={(e) => update({ ...prefs, speakRoasts: e.target.checked })} /> Also read Roast Club lines aloud (opted-in players only)</label>
          <p role="status">{prefs.muted ? "Muted." : "Sound on."} {note}</p>
        </>
      )}
    </section>
  );
}
