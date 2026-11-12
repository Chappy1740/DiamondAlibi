"use client";

import { useActionState, useState } from "react";
import { requestPhoneCode, verifyPhoneCode } from "@/app/login/phone-actions";
import { PlayerProfileFields } from "./player-profile-fields";

export function PhoneAuthForm({ onUseEmail }: { onUseEmail: () => void }) {
  const [creating, setCreating] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [previousPhone, setPreviousPhone] = useState("");

  return (
    <section className="card detail-card auth-card">
      <h2>{creating ? "Create your player account" : "Sign in with your phone"}</h2>
      <PhoneCodeForm
        key={attempt}
        creating={creating}
        previousPhone={previousPhone}
        onStartOver={(phone) => {
          setPreviousPhone(phone);
          setAttempt((current) => current + 1);
        }}
        onSwitchMode={() => {
          setCreating(!creating);
          setAttempt((current) => current + 1);
        }}
        onUseEmail={onUseEmail}
      />
    </section>
  );
}

function PhoneCodeForm({ creating, previousPhone, onStartOver, onSwitchMode, onUseEmail }: {
  creating: boolean;
  previousPhone: string;
  onStartOver: (phone: string) => void;
  onSwitchMode: () => void;
  onUseEmail: () => void;
}) {
  const [request, send, sending] = useActionState(requestPhoneCode, {});
  const [verification, verify, verifying] = useActionState(verifyPhoneCode, {});
  const pending = sending || verifying;
  const phone = request.phone;

  return <>
    {phone ? (
      <form action={verify}>
        <p role="status">Enter the six-digit code if it arrives by text.</p>
        <input type="hidden" name="phone" value={phone} />
        <label htmlFor="phone-code">Text message code</label>
        <input id="phone-code" name="code" inputMode="numeric" autoComplete="one-time-code"
          pattern="[0-9]{6}" maxLength={6} required />
        {verification.error && <p role="alert" className="form-error">{verification.error}</p>}
        <button className="button primary" disabled={pending}>{verifying ? "Verifying…" : "Verify code"}</button>
        <button className="text-button" type="button" disabled={pending}
          onClick={() => onStartOver(phone)}>Change number or request a new code</button>
      </form>
    ) : (
      <form action={send}>
        <input type="hidden" name="intent" value={creating ? "register" : "sign-in"} />
        <label htmlFor="sign-in-phone">Mobile number</label>
        <input id="sign-in-phone" name="phone" type="tel" autoComplete="tel" maxLength={32}
          aria-describedby="phone-format" defaultValue={previousPhone} required />
        <p className="muted" id="phone-format">Outside the US, include the country code with a plus sign.</p>
        {creating && <>
          <p className="muted">Already have a DiamondAlibi account with email? Use email to keep your existing teams and stats.</p>
          <PlayerProfileFields />
        </>}
        {request.error && <p role="alert" className="form-error">{request.error}</p>}
        <button className="button primary" disabled={pending}>{sending ? "Requesting…" : "Text me a code"}</button>
      </form>
    )}
    <button className="text-button" type="button" onClick={onSwitchMode} disabled={pending}>
      {creating ? "Already have a phone account? Sign in" : "New here? Create a phone account"}
    </button>
    <button className="text-button" type="button" onClick={onUseEmail} disabled={pending}>Use email instead</button>
    <p className="micro">Use a personal recreational account. Keep work/government information out of this app.</p>
  </>;
}
