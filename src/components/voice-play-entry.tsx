"use client";
import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";

type Recognition = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((event?: { error?: string }) => void) | null; onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
};
type VoiceWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
export function VoicePlayEntry({ disabled, resetKey = 0, onResult }: { disabled: boolean; resetKey?: number; onResult(text: string): Promise<boolean | undefined> }) {
  const [text, setText] = useState(""), [available, setAvailable] = useState(false), [listening, setListening] = useState(false), [error, setError] = useState("");
  const generation = useRef(0);
  const recognition = useRef<Recognition | null>(null), callback = useRef(onResult), blocked = useRef(disabled), mounted = useRef(true);
  callback.current = onResult; blocked.current = disabled;
  useEffect(() => { mounted.current = true; const w = window as VoiceWindow; setAvailable(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition)); return () => { mounted.current = false; generation.current++; recognition.current?.abort(); }; }, []);
  useEffect(() => { if (disabled) { generation.current++; recognition.current?.abort(); setListening(false); } }, [disabled]);
  useEffect(() => { generation.current++; recognition.current?.abort(); setListening(false); setText(""); }, [resetKey]);
  async function submit(value: string) {
    if (blocked.current || !mounted.current || !value.trim()) return;
    setText(value);
    if (await callback.current(value)) { if (mounted.current) setText(""); }
  }
  function listen() {
    if (blocked.current) return;
    const w = window as VoiceWindow, Constructor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Constructor) return;
    const ticket = ++generation.current;
    const instance = new Constructor(); recognition.current = instance;
    instance.lang = "en-US"; instance.continuous = false; instance.interimResults = false;
    let consumed = false;
    instance.onresult = event => {
      if (ticket !== generation.current || consumed || blocked.current || !mounted.current) return;
      const result = Array.from(event.results).find(result => result.isFinal);
      if (result) { consumed = true; setListening(false); instance.stop(); void submit(result[0].transcript); }
    };
    instance.onerror = event => { if (ticket !== generation.current || consumed || event?.error === "aborted" || blocked.current) return; if (mounted.current) { setListening(false); setError("Voice couldn’t be read. Type the result or use keyboard dictation."); } };
    instance.onend = () => { if (ticket === generation.current && mounted.current) setListening(false); };
    try { setError(""); setListening(true); instance.start(); } catch { instance.onerror(); }
  }
  return <div className="voice-play-entry">
    <div className="voice-play-controls">
      <input aria-label="Player and result" value={text} maxLength={200} placeholder="Alex hit · Alex home run 2 RBI" disabled={disabled || listening} onChange={event => setText(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void submit(text); } }} />
      {available && <button type="button" className="button secondary" disabled={disabled || listening} aria-label="Speak a result" onClick={listen}><Mic size={18} aria-hidden /></button>}
      <button type="button" className="button secondary" disabled={disabled || listening || !text.trim()} onClick={() => void submit(text)}>Record result</button>
    </div>
    <p className="voice-play-note">{listening ? "Listening…" : available ? "Voice uses your browser’s speech service. Diamond Alibi does not save audio." : "Type the result or use your keyboard’s dictation."}</p>
    {error && <p role="alert">{error}</p>}
  </div>;
}
