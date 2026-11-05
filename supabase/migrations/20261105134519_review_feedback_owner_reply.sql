-- Private replies share the existing feedback table's service-only access.
begin;

alter table public.review_feedback
  add column owner_reply text,
  add column owner_replied_at timestamptz,
  add constraint review_feedback_reply_valid check (
    (owner_reply is null and owner_replied_at is null)
    or (owner_reply is not null and owner_replied_at is not null
      and char_length(btrim(owner_reply)) between 1 and 2000)
  );

create function public.reply_to_review_feedback(p_id uuid, p_message text)
returns text language plpgsql security invoker set search_path = '' as $$
declare existing_reply text;
begin
  select owner_reply into existing_reply
    from public.review_feedback where id = p_id for update;
  if not found then return 'not_found'; end if;
  if existing_reply = p_message then return 'saved'; end if;
  if existing_reply is not null then return 'already_replied'; end if;

  update public.review_feedback
    set owner_reply = p_message, owner_replied_at = now()
    where id = p_id;
  return 'saved';
end;
$$;

revoke all on function public.reply_to_review_feedback(uuid, text)
  from public, anon, authenticated;
grant execute on function public.reply_to_review_feedback(uuid, text)
  to service_role;

commit;
