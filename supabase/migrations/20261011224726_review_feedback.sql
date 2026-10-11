-- Private reviewer feedback. Apply only after exact live database approval.
begin;
create table public.review_feedback (
  id uuid primary key,
  sender_hash text not null check (sender_hash ~ '^[0-9a-f]{64}$'),
  kind text not null check (kind in ('question','suggestion','issue')),
  message text not null check (char_length(btrim(message)) between 1 and 2000),
  name text not null default '' check (char_length(name) <= 60),
  created_at timestamptz not null default now(),
  reviewed boolean not null default false
);
alter table public.review_feedback enable row level security;
revoke all on public.review_feedback from public, anon, authenticated;
grant select, insert, update on public.review_feedback to service_role;
create index review_feedback_sender_time on public.review_feedback(sender_hash, created_at);
create index review_feedback_inbox_time on public.review_feedback(created_at desc, id desc);
create function public.submit_review_feedback(p_id uuid, p_sender text, p_kind text, p_message text, p_name text)
returns text language plpgsql security invoker set search_path = '' as $$
declare existing_sender text;
begin
  -- Serializes each sender's count and insert across Workers/requests.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_sender, 0));
  select sender_hash into existing_sender from public.review_feedback where id = p_id;
  if found then
    if existing_sender = p_sender then return 'sent'; end if;
    raise exception 'Unavailable';
  end if;
  if (select count(*) from public.review_feedback where sender_hash = p_sender and created_at > now() - interval '1 hour') >= 10
    or (select count(*) from public.review_feedback where sender_hash = p_sender and created_at > now() - interval '1 day') >= 30 then
    return 'rate_limited';
  end if;
  insert into public.review_feedback(id,sender_hash,kind,message,name) values(p_id,p_sender,p_kind,p_message,p_name);
  return 'sent';
end;
$$;
revoke all on function public.submit_review_feedback(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.submit_review_feedback(uuid,text,text,text,text) to service_role;
commit;
