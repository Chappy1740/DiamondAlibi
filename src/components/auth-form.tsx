"use client";
import { useActionState, useState } from "react";
import { login, signup, type AuthResult } from "@/app/login/actions";
export function AuthForm() {
  const [creating, setCreating] = useState(false);
  const [result, submit, pending] = useActionState<AuthResult, FormData>(
    creating ? signup : login,
    {},
  );
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
        {creating && (
          <p className="muted">
            Creating an account may send a confirmation email to the address you
            enter. No teammate invitations are sent automatically.
          </p>
        )}
        {result.error && (
          <p role="alert" className="form-error">
            {result.error}
          </p>
        )}
        {result.message && <p role="status">{result.message}</p>}
        <button className="button primary" disabled={pending}>
          {pending ? "Please wait…" : creating ? "Create account" : "Sign in"}
        </button>
      </form>
      <button
        className="text-button"
        onClick={() => setCreating(!creating)}
        disabled={pending}
      >
        {creating
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </button>
      <p className="micro">
        Use a personal recreational account. Keep work/government information
        out of this app.
      </p>
    </section>
  );
}
