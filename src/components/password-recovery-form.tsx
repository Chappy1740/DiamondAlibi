"use client";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/forgot-password/actions";
import { updatePassword } from "@/app/update-password/actions";
import type { AuthResult } from "@/app/login/actions";
import Link from "next/link";

export function PasswordRecoveryForm({
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
      <h2>{updating ? "Choose a new password" : "Get a reset link"}</h2>
      {result.message ? (
        <>
          <p role="status">{result.message}</p>
          <Link className="text-link" href="/login">
            Return to sign in
          </Link>
        </>
      ) : (
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
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                maxLength={256}
                required
              />
              <p className="muted">
                Use 12–256 characters. Complete this form within 15 minutes of
                opening your reset link.
              </p>
            </>
          ) : (
            <>
              <label htmlFor="email">Sign-in email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
              />
              <p className="muted">
                Open the email link in the same browser where you requested it.
              </p>
            </>
          )}
          {result.error && (
            <p role="alert" className="form-error">
              {result.error}
            </p>
          )}
          <button className="button primary" disabled={pending}>
            {pending
              ? "Please wait…"
              : updating
                ? "Update password"
                : "Send reset link"}
          </button>
        </form>
      )}
    </section>
  );
}
