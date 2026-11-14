"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    "response-field": false;
    callback: (token: string) => void;
    "expired-callback": () => void;
    "error-callback": () => void;
    "timeout-callback": () => void;
  }) => string;
  remove: (id: string) => void;
};

export function AuthCaptcha({ siteKey }: { siteKey: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const api = (window as Window & { turnstile?: Turnstile }).turnstile;
    if (!ready || !api || !container.current) return;
    const clear = () => setToken("");
    const fail = () => { clear(); setFailed(true); };
    let id: string;
    try {
      id = api.render(container.current, {
        sitekey: siteKey,
        "response-field": false,
        callback: (value) => { setFailed(false); setToken(value); },
        "expired-callback": clear,
        "error-callback": fail,
        "timeout-callback": fail,
      });
    } catch {
      fail();
      return;
    }
    return () => api.remove(id);
  }, [ready, siteKey]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => setReady(true)} onError={() => setFailed(true)} />
      <div ref={container} />
      <input type="hidden" name="captchaToken" value={token} />
      {failed && <p role="status">The security check could not load. Refresh the page and try again.</p>}
    </>
  );
}
