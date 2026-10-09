"use client";
import { useActionState, type ReactNode } from "react";
import { clubAction, type ClubResult } from "@/app/club/actions";
export function ClubForm({
  operation,
  team,
  children,
  label,
  hidden = {},
}: {
  operation: string;
  team?: string;
  children?: ReactNode;
  label: string;
  hidden?: Record<string, string>;
}) {
  const [result, submit, pending] = useActionState<ClubResult, FormData>(
    clubAction,
    {},
  );
  return (
    <form action={submit} className="club-form">
      <input type="hidden" name="operation" value={operation} />
      {team && <input type="hidden" name="team" value={team} />}
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      {result.error && (
        <p className="form-error" role="alert">
          {result.error}
        </p>
      )}
      {result.message && (
        <p className="form-message" role="status">
          {result.message}
        </p>
      )}
      {result.code && (
        <output className="invite-code" aria-label="New invite code">
          {result.code}
        </output>
      )}
      <button className="button secondary" disabled={pending}>
        {pending ? "Saving…" : label}
      </button>
    </form>
  );
}
