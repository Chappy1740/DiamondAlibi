"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/app/forgot-password/actions";
import { updatePassword } from "@/app/reset-password/actions";
import type { AuthResult } from "@/app/login/actions";

export function PasswordResetForm({
  updating = false,
}: {
  updating?: boolean;
}) {
  const [result, submit, pending] = useActionState<AuthResult, FormData>(
    updating ? updatePassword : requestPasswordReset,
    {},
  );
  return (
    <section className="card detail-card auth-card">
      <form action={submit}>
        {updating ? (
          <>
            <label htmlFor="password">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={256}
              required
            />
            <label htmlFor="confirmPassword">Confirm new password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={256}
              required
            />
            <p className="muted">Use 12–256 characters.</p>
          </>
        ) : (
          <>
            <label htmlFor="email">Account email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
          </>
        )}
        {result.error && (
          <p role="alert" className="form-error">
            {result.error}
          </p>
        )}
        {result.message && <p role="status">{result.message}</p>}
        <button
          className="button primary"
          disabled={pending || !!result.message}
        >
          {pending
            ? "Please wait…"
            : updating
              ? "Save new password"
              : "Send reset email"}
        </button>
      </form>
    </section>
  );
}
