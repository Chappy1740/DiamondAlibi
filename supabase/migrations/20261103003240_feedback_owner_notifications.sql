-- Durable owner alerts. Local preparation only; live application needs approval.
begin;

create table public.review_feedback_notifications (
  feedback_id uuid primary key references public.review_feedback(id),
  created_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  attempts integer not null default 0 check (attempts between 0 and 12),
  next_attempt_at timestamptz not null default now(),
  lease_token uuid,
  lease_until timestamptz,
  recipient text,
  sender text,
  inbox_url text,
  provider_id text check (char_length(provider_id) between 1 and 200),
  accepted_at timestamptz,
  last_failure text check (last_failure in ('provider_unavailable','provider_rejected','provider_rate_limited')),
  check ((recipient is null and sender is null and inbox_url is null)
    or (recipient is not null and sender is not null and inbox_url is not null))
);
alter table public.review_feedback_notifications enable row level security;
revoke all on public.review_feedback_notifications from public, anon, authenticated;
grant select, insert, update on public.review_feedback_notifications to service_role;
create index review_feedback_notifications_pending
  on public.review_feedback_notifications(next_attempt_at, created_at, feedback_id)
  where accepted_at is null and attempts < 12;

create function public.enqueue_feedback_notification()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.review_feedback_notifications(feedback_id) values (new.id);
  return new;
end;
$$;
revoke all on function public.enqueue_feedback_notification() from public, anon, authenticated;
grant execute on function public.enqueue_feedback_notification() to service_role;
create trigger enqueue_feedback_notification after insert on public.review_feedback
  for each row execute function public.enqueue_feedback_notification();

-- Freeze the destination and generic message URL on the first attempt so retries
-- retain the same payload for Resend's 24-hour idempotency window. Stop at 23h.
create function public.claim_feedback_notification(p_recipient text, p_sender text, p_inbox_url text)
returns table(feedback_id uuid, lease_token uuid, recipient text, sender text, inbox_url text)
language plpgsql security invoker set search_path = '' as $$
begin
  if p_recipient is null or p_sender is null or p_inbox_url is null
    or p_recipient !~ '^[^[:space:]<>@]+@[^[:space:]<>@]+\.[^[:space:]<>@]+$'
    or p_sender !~ '^[^[:space:]<>@]+@[^[:space:]<>@]+\.[^[:space:]<>@]+$'
    or char_length(p_recipient) > 254 or char_length(p_sender) > 254
    or char_length(p_inbox_url) > 2048
    or p_inbox_url !~ '^https://[^/?#@[:space:]]+/owner/feedback$'
  then raise exception 'Invalid notification configuration'; end if;
  return query
    with candidate as (
      select n.feedback_id from public.review_feedback_notifications n
      where n.accepted_at is null and n.attempts < 12
        and n.next_attempt_at <= now()
        and (n.lease_until is null or n.lease_until <= now())
        and (n.first_attempt_at is null or n.first_attempt_at > now() - interval '23 hours')
      order by n.next_attempt_at, n.created_at, n.feedback_id
      limit 1 for update skip locked
    )
    update public.review_feedback_notifications n set
      first_attempt_at = coalesce(n.first_attempt_at, now()),
      attempts = n.attempts + 1,
      lease_token = pg_catalog.gen_random_uuid(),
      lease_until = now() + interval '2 minutes',
      recipient = coalesce(n.recipient, p_recipient),
      sender = coalesce(n.sender, p_sender),
      inbox_url = coalesce(n.inbox_url, p_inbox_url)
    from candidate c where n.feedback_id = c.feedback_id
    returning n.feedback_id, n.lease_token, n.recipient, n.sender, n.inbox_url;
end;
$$;
revoke all on function public.claim_feedback_notification(text,text,text) from public, anon, authenticated;
grant execute on function public.claim_feedback_notification(text,text,text) to service_role;

create function public.finish_feedback_notification(
  p_feedback_id uuid, p_lease_token uuid, p_provider_id text, p_failure text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare touched integer;
begin
  if p_provider_id is null and (p_failure is null or p_failure not in
    ('provider_unavailable','provider_rejected','provider_rate_limited')) then
    raise exception 'Invalid notification outcome';
  end if;
  update public.review_feedback_notifications n set
    provider_id = p_provider_id,
    accepted_at = case when p_provider_id is not null then now() else null end,
    last_failure = case when p_provider_id is not null then null else p_failure end,
    next_attempt_at = now() + least(3600, 300 * power(2, n.attempts - 1)) * interval '1 second',
    lease_token = null, lease_until = null
  where n.feedback_id = p_feedback_id and n.lease_token = p_lease_token
    and n.lease_until > now() and n.accepted_at is null;
  get diagnostics touched = row_count;
  return touched = 1;
end;
$$;
revoke all on function public.finish_feedback_notification(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.finish_feedback_notification(uuid,uuid,text,text) to service_role;

-- Historical messages are deliberately not backfilled into an email campaign.
commit;
