"use client";
import { useEffect, useState } from "react";
import { ANNOUNCER_STORAGE_KEY, DEFAULT_ANNOUNCER_PREFS, type AnnouncerPrefs } from "@/lib/roast-announcer";
import { getSpeaker, readAnnouncerPrefs } from "./roast-club-popup";

/**
 * Clubhouse setup for the announcer on THIS device: set volume and hear a test line before game day.
 * It never picks a game and never turns announcing on. The one-announcer-per-game switch stays
 * inside the game, and that screen still needs its own tap to arm sound (browsers require it).
 */
export function AnnouncerSetup() {
  const [prefs, setPrefs] = useState<AnnouncerPrefs>(DEFAULT_ANNOUNCER_PREFS);
  const [supported, setSupported] = useState(true);
  const [note, setNote] = useState("");
  const [diag, setDiag] = useState("");
  useEffect(() => { setPrefs(readAnnouncerPrefs()); setSupported(getSpeaker().supported); }, []);
  function save(next: AnnouncerPrefs) {
    setPrefs(next);
    try { window.localStorage.setItem(ANNOUNCER_STORAGE_KEY, JSON.stringify(next)); } catch { setNote("This browser would not save the setting, so it may reset."); }
  }
  if (!supported) return <section className="card detail-card" aria-label="Announcer setup"><h3>Announcer setup</h3><p>This browser cannot speak out loud, so announcements are not available here. Text popups still work.</p></section>;
  return (
    <section className="card detail-card" aria-label="Announcer setup" data-testid="announcer-setup">
      <h3>Announcer setup</h3>
      <p>Test this phone&apos;s sound before game time. It plays one test line out of whatever the phone is connected to, such as a Bluetooth speaker. To announce a game, open that game in Score mode and turn on &ldquo;Clubhouse announcer&rdquo;. Only one device per game is the announcer.</p>
      <label>Volume <input type="range" min={0} max={1} step={0.1} value={prefs.volume} onChange={(e) => save({ ...prefs, volume: Number(e.target.value) })} aria-label="Announcer volume" /></label>
      <button type="button" className="button primary" onClick={() => {
        const result = getSpeaker().unlock(prefs.volume);
        setNote(result === "spoken" ? "Test line played. Did you hear it?" : "Could not play sound on this browser.");
        window.setTimeout(() => {
          try { setDiag(`Voices: ${window.speechSynthesis.getVoices().length}. Last speech event: ${getSpeaker().lastEvent}.`); } catch { setDiag("Speech status unavailable."); }
        }, 2500);
      }}>Test announcer sound</button>
      {note && <p role="status">{note}</p>}
      {diag && <p className="micro" role="status" data-testid="announcer-setup-diag">{diag}</p>}
    </section>
  );
}
