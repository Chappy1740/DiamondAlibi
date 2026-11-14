"use client";

import { useActionState, useState } from "react";
import { requestPhoneCode, verifyPhoneCode } from "@/app/login/phone-actions";
import { AuthCaptcha } from "./auth-captcha";
import { PlayerProfileFields } from "./player-profile-fields";

export function PhoneAuthForm({ siteKey, onUseEmail }: { siteKey: string; onUseEmail: () => void }) {
  const [creating, setCreating] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [phone, setPhone] = useState("");

  return (
    <section className="card detail-card auth-card">
      <h2>{creating ? "Create your pilot player account" : "Sign in with your phone"}</h2>
      <PhoneCodeForm key={attempt} {...{ creating, phone, setPhone, siteKey, onUseEmail }}
        onStartOver={() => setAttempt((current) => current + 1)}
        onSwitchMode={() => {
          setCreating(!creating);
          setAttempt((current) => current + 1);
        }} />
    </section>
  );
}

function PhoneCodeForm({ creating, phone, setPhone, siteKey, onStartOver, onSwitchMode, onUseEmail }: {
  creating: boolean;
  phone: string;
  setPhone: (value: string) => void;
  siteKey: string;
  onStartOver: () => void;
  onSwitchMode: () => void;
  onUseEmail: () => void;
}) {
  const [request, send, sending] = useActionState(requestPhoneCode, {});
  const [verification, verify, verifying] = useActionState(verifyPhoneCode, {});
  const pending = sending || verifying;
  const intent = creating ? "register" : "sign-in";

  return <>
    {request.requested ? (
      <form key="verify" action={verify}>
        <p role="status">Enter the six-digit code if it arrives by text. If it does not arrive, wait a minute before requesting another.</p>
        <input type="hidden" name="phone" value={phone} />
        <input type="hidden" name="intent" value={intent} />
        <label htmlFor="phone-code">Text message code</label>
        <input id="phone-code" name="code" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9]{6}" maxLength={6} required />
        {creating && <PlayerProfileFields />}
        {verification.error && <p role="alert" className="form-error">{verification.error}</p>}
        <button className="button primary" disabled={pending}>{verifying ? "Verifying…" : "Verify code"}</button>
        <button className="text-button" type="button" disabled={pending}
          onClick={onStartOver}>Change number or request a new code</button>
      </form>
    ) : (
      <form key="send" action={send}>
        <input type="hidden" name="intent" value={intent} />
        <label htmlFor="sign-in-phone">Mobile number</label>
        <input id="sign-in-phone" name="phone" type="tel" autoComplete="tel" maxLength={32}
          aria-describedby="phone-format" value={phone} onChange={(event) => setPhone(event.target.value)}
          readOnly={pending} required />
        <p className="muted" id="phone-format">Outside the US, include the country code with a plus sign.</p>
        {creating && <p className="muted">Phone signup is for the invited pilot. If you already use email for Diamond Alibi, keep using email for that account.</p>}
        {!pending && <AuthCaptcha siteKey={siteKey} />}
        {request.error && <p role="alert" className="form-error">{request.error}</p>}
        <button className="button primary" disabled={pending}>{sending ? "Requesting…" : "Text me a code"}</button>
      </form>
    )}
    <button className="text-button" type="button" onClick={onSwitchMode} disabled={pending}>
      {creating ? "Already have a phone account? Sign in" : "Create a pilot phone account"}
    </button>
    <button className="text-button" type="button" onClick={onUseEmail} disabled={pending}>Use email instead</button>
    <p className="micro">Use a personal recreational account. Keep work/government information out of this app.</p>
  </>;
}
