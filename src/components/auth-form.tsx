"use client";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { login, signup, type AuthResult } from "@/app/login/actions";
import { resetProfilePhotoState } from "@/lib/profile-photo-events";
import { AuthCaptcha } from "./auth-captcha";
import { PlayerProfileFields } from "./player-profile-fields";
import { PhoneAuthForm } from "./phone-auth-form";

export function AuthForm({
  passwordOnly = false,
  phoneEnabled = false,
  captchaSiteKey = null,
}: {
  passwordOnly?: boolean;
  phoneEnabled?: boolean;
  captchaSiteKey?: string | null;
}) {
  // Nobody is signed in here, so a previous account's header photo state must not carry over.
  useEffect(() => resetProfilePhotoState(), []);
  const [creating, setCreating] = useState(false);
  const [usingPhone, setUsingPhone] = useState(false);
  const [result, submit, pending] = useActionState<AuthResult, FormData>(
    creating ? signup : login,
    {},
  );
  const phoneSiteKey = !passwordOnly && phoneEnabled ? captchaSiteKey : null;
  if (phoneSiteKey && usingPhone) {
    return <PhoneAuthForm siteKey={phoneSiteKey} onUseEmail={() => setUsingPhone(false)} />;
  }
  return (
    <section className="card detail-card auth-card">
      <h2>
        {creating ? "Create your player account" : "Welcome to the clubhouse"}
      </h2>
      <form action={submit}>
        <label htmlFor="email">Sign-in email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={creating ? "new-password" : "current-password"}
          minLength={creating ? 12 : 1}
          maxLength={256}
          required
        />
        {creating && <>
          <PlayerProfileFields />
          <p className="muted">
            After you confirm your email and sign in, you can add a profile photo.
            No teammate invitations are sent automatically.
          </p>
        </>}
        {captchaSiteKey && !pending && <AuthCaptcha key={String(creating)} siteKey={captchaSiteKey} />}
        {result.error && (
          <p role="alert" className="form-error">
            {result.error}
          </p>
        )}
        {result.message && <p role="status">{result.message}</p>}
        {!creating && !passwordOnly && (
          <p>
            <Link className="text-link" href="/forgot-password">
              Forgot password?
            </Link>
          </p>
        )}
        <button className="button primary" disabled={pending}>
          {pending ? "Please wait…" : creating ? "Create account" : "Sign in"}
        </button>
      </form>
      {!passwordOnly && (
        <button
          className="text-button"
          onClick={() => setCreating(!creating)}
          disabled={pending}
        >
          {creating
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>
      )}
      {phoneSiteKey && (
        <button className="text-button" type="button" onClick={() => setUsingPhone(true)} disabled={pending}>
          Use a mobile number
        </button>
      )}
      <p className="micro">
        Use a personal recreational account. Keep work/government information
        out of this app.
      </p>
    </section>
  );
}
