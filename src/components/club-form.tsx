"use client";
import { useActionState, useState, useEffect, useRef, type ReactNode } from "react";
import { clubAction, type ClubResult } from "@/app/club/actions";
export function ClubForm({
  operation,
  team,
  children,
  label,
  hidden = {},
  confirmation,
}: {
  confirmation?: string;
  operation: string;
  team?: string;
  children?: ReactNode;
  label: string;
  hidden?: Record<string, string>;
}) {
  const [confirming, setConfirming] = useState(false);
  const actionButton=useRef<HTMLButtonElement>(null), confirmButton=useRef<HTMLButtonElement>(null), wasConfirming=useRef(false);
  useEffect(()=>{if(!confirmation)return;if(confirming)confirmButton.current?.focus();else if(wasConfirming.current)actionButton.current?.focus();wasConfirming.current=confirming;},[confirming,confirmation]);
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
      {confirmation && !confirming ? <button ref={actionButton} className="button secondary" type="button" onClick={() => setConfirming(true)}>{label}</button> : <>
        {confirmation && <p>{confirmation}</p>}
        <button ref={confirmation ? confirmButton : undefined} className="button secondary" disabled={pending}>{pending ? "Saving…" : confirmation ? `Confirm ${label.toLowerCase()}` : label}</button>
        {confirmation && <button className="button secondary" type="button" disabled={pending} onClick={() => setConfirming(false)}>Cancel</button>}
      </>}
    </form>
  );
}
