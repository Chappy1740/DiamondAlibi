-- Review-only proposal. Do not apply without exact SQL and hook activation approval.
-- The table starts empty, so an enabled hook denies all new phone accounts
-- until the owner supplies the one pilot number through the restricted SQL path.
begin;

create schema da_auth_hooks;
revoke all on schema da_auth_hooks from public, anon, authenticated;

create table da_auth_hooks.phone_signup_pilot (
  singleton boolean primary key default true check (singleton),
  phone_digits text not null check (phone_digits ~ '^[1-9][0-9]{1,14}$')
);
alter table da_auth_hooks.phone_signup_pilot enable row level security;
revoke all on da_auth_hooks.phone_signup_pilot from public, anon, authenticated, supabase_auth_admin;

create function da_auth_hooks.before_user_created(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  phone text := event #>> '{user,phone}';
  provider text := event #>> '{user,app_metadata,provider}';
begin
  if coalesce(phone, '') = '' and provider is distinct from 'phone' then
    return '{}'::jsonb;
  end if;

  if phone ~ '^\+?[1-9][0-9]{1,14}$' and exists (
    select 1 from da_auth_hooks.phone_signup_pilot
    where phone_digits = ltrim(phone, '+')
  ) then
    return '{}'::jsonb;
  end if;

  return '{"error":{"http_code":403,"message":"Phone signup is unavailable."}}'::jsonb;
end;
$$;

revoke all on function da_auth_hooks.before_user_created(jsonb) from public, anon, authenticated;
grant usage on schema da_auth_hooks to supabase_auth_admin;
grant execute on function da_auth_hooks.before_user_created(jsonb) to supabase_auth_admin;

commit;
