-- M4.2 only: team membership, roster, invitations, seasons and audit.
-- No application data deletion or authentication-provider changes.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create extension if not exists pgcrypto with schema extensions;

create table public.player_profiles (
  user_id uuid primary key references auth.users(id),
  nickname text not null check (char_length(trim(nickname)) between 1 and 40),
  updated_at timestamptz not null default now()
);
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table public.team_memberships (
  team_id uuid not null references public.teams(id),
  user_id uuid not null references auth.users(id),
  active boolean not null default true,
  is_captain boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (team_id, user_id)
);
create index team_memberships_user_idx on public.team_memberships(user_id,team_id) where active;
create table public.team_players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id),
  user_id uuid references auth.users(id),
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  is_guest boolean not null default false,
  created_at timestamptz not null default now(),
  unique(team_id,user_id),
  unique(team_id,id),
  check ((is_guest and user_id is null) or (not is_guest and user_id is not null)),
  foreign key(team_id,user_id) references public.team_memberships(team_id,user_id)
);
create index team_players_user_idx on public.team_players(user_id) where user_id is not null;
create table public.team_seasons (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id),
  name text not null check (char_length(trim(name)) between 1 and 80),
  archived boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(team_id,name), unique(team_id,id)
);
create table private.team_invites (
  id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id),
  code_hash text not null unique, issued_by uuid not null references auth.users(id),
  expires_at timestamptz not null, revoked_at timestamptz,
  max_uses integer not null check(max_uses between 1 and 100), uses integer not null default 0,
  created_at timestamptz not null default now(), check(uses between 0 and max_uses)
);
create index team_invites_team_idx on private.team_invites(team_id);
create index team_invites_issuer_idx on private.team_invites(issued_by);
create table private.audit_events (
  id bigint generated always as identity primary key, team_id uuid references public.teams(id),
  actor_id uuid not null references auth.users(id), operation text not null,
  entity_id uuid, created_at timestamptz not null default now()
);
create index audit_events_team_idx on private.audit_events(team_id,created_at);
create index audit_events_actor_idx on private.audit_events(actor_id);
create table private.invite_attempts (
  user_id uuid primary key references auth.users(id), window_started timestamptz not null,
  attempts integer not null check(attempts between 1 and 10)
);

alter table public.player_profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;
alter table public.team_players enable row level security;
alter table public.team_seasons enable row level security;
alter table private.team_invites enable row level security;
alter table private.audit_events enable row level security;
alter table private.invite_attempts enable row level security;
revoke all on public.player_profiles,public.teams,public.team_memberships,public.team_players,public.team_seasons from public,anon,authenticated;
grant select on public.player_profiles,public.teams,public.team_memberships,public.team_players,public.team_seasons to authenticated;
revoke all on all tables in schema private from public,anon,authenticated;

create function private.is_member(p_team uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.team_memberships m where m.team_id=p_team and m.user_id=(select auth.uid()) and m.active);
$$;
revoke all on function private.is_member(uuid) from public,anon;
grant execute on function private.is_member(uuid) to authenticated;
create policy profile_self_read on public.player_profiles for select to authenticated using(user_id=(select auth.uid()));
create policy teams_member_read on public.teams for select to authenticated using(private.is_member(id));
create policy memberships_member_read on public.team_memberships for select to authenticated using(private.is_member(team_id));
create policy players_member_read on public.team_players for select to authenticated using(private.is_member(team_id));
create policy seasons_member_read on public.team_seasons for select to authenticated using(private.is_member(team_id));

create function private.actor() returns uuid language plpgsql stable security invoker set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501'; end if;
 return auth.uid();
end $$;

create function private.save_profile(p_nickname text) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.actor();
begin
 if char_length(trim(p_nickname)) not between 1 and 40 then raise exception 'Nickname must be 1–40 characters'; end if;
 insert into public.player_profiles(user_id,nickname) values(actor,trim(p_nickname))
 on conflict(user_id) do update set nickname=excluded.nickname,updated_at=now();
 -- Profile nickname is private; each roster alias is deliberately team-scoped.
end $$;

create function private.create_team(p_name text,p_nickname text) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.actor(); new_team uuid;
begin
 perform private.save_profile(p_nickname);
 insert into public.teams(name,created_by) values(trim(p_name),actor) returning id into new_team;
 insert into public.team_memberships(team_id,user_id) values(new_team,actor);
 insert into public.team_players(team_id,user_id,display_name) values(new_team,actor,trim(p_nickname));
 insert into private.audit_events(team_id,actor_id,operation,entity_id) values(new_team,actor,'team.create',new_team);
 return new_team;
end $$;

create function private.create_invite(p_team uuid,p_max_uses integer default 10) returns table(code text,invite_id uuid,expires_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.actor(); raw_code text; new_id uuid; expiry timestamptz:=now()+interval '7 days';
begin
 if not private.is_member(p_team) then raise exception 'Team access denied' using errcode='42501'; end if;
 if p_max_uses not between 1 and 100 or p_max_uses is null then raise exception 'Use limit must be 1–100'; end if;
 raw_code:=encode(extensions.gen_random_bytes(18),'hex');
 insert into private.team_invites(team_id,code_hash,issued_by,expires_at,max_uses)
 values(p_team,encode(extensions.digest(raw_code,'sha256'),'hex'),actor,expiry,p_max_uses) returning id into new_id;
 insert into private.audit_events(team_id,actor_id,operation,entity_id) values(p_team,actor,'invite.create',new_id);
 return query select raw_code,new_id,expiry;
end $$;

create function private.redeem_invite(p_code text,p_nickname text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.actor(); invite private.team_invites%rowtype; attempts_count integer; clean_code text:=lower(trim(p_code));
begin
 -- Return failures instead of raising so attempt counters commit on invalid codes.
 insert into private.invite_attempts(user_id,window_started,attempts) values(actor,now(),1)
 on conflict(user_id) do update set
 attempts=case when private.invite_attempts.window_started < now()-interval '15 minutes' then 1 else least(private.invite_attempts.attempts+1,10) end,
 window_started=case when private.invite_attempts.window_started < now()-interval '15 minutes' then now() else private.invite_attempts.window_started end
 returning attempts into attempts_count;
 if attempts_count>=10 then return jsonb_build_object('ok',false,'error','Too many attempts. Try again later.'); end if;
 if clean_code !~ '^[0-9a-f]{36}$' or p_nickname is null or char_length(trim(p_nickname)) not between 1 and 40 then
 return jsonb_build_object('ok',false,'error','Invite unavailable or invalid.'); end if;
 select * into invite from private.team_invites where code_hash=encode(extensions.digest(clean_code,'sha256'),'hex') for update;
 if not found or invite.revoked_at is not null or invite.expires_at<=now() or invite.uses>=invite.max_uses then
 return jsonb_build_object('ok',false,'error','Invite unavailable or invalid.'); end if;
 if exists(select 1 from public.team_memberships where team_id=invite.team_id and user_id=actor) then
 if private.is_member(invite.team_id) then return jsonb_build_object('ok',true,'team_id',invite.team_id); end if;
 return jsonb_build_object('ok',false,'error','Invite unavailable or invalid.'); end if;
 perform private.save_profile(p_nickname);
 insert into public.team_memberships(team_id,user_id) values(invite.team_id,actor);
 insert into public.team_players(team_id,user_id,display_name) values(invite.team_id,actor,trim(p_nickname));
 update private.team_invites set uses=uses+1 where id=invite.id;
 insert into private.audit_events(team_id,actor_id,operation,entity_id) values(invite.team_id,actor,'invite.redeem',invite.id);
 return jsonb_build_object('ok',true,'team_id',invite.team_id);
end $$;

create function private.list_invites(p_team uuid) returns table(id uuid,expires_at timestamptz,revoked_at timestamptz,max_uses integer,uses integer)
language plpgsql security definer set search_path='' as $$
begin
 perform private.actor();
 if not private.is_member(p_team) then raise exception 'Team access denied' using errcode='42501'; end if;
 return query select i.id,i.expires_at,i.revoked_at,i.max_uses,i.uses from private.team_invites i where i.team_id=p_team order by i.created_at desc limit 50;
end $$;
create function private.revoke_invite(p_team uuid,p_invite uuid) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.actor();
begin
 if not private.is_member(p_team) then raise exception 'Team access denied' using errcode='42501'; end if;
 update private.team_invites set revoked_at=coalesce(revoked_at,now()) where id=p_invite and team_id=p_team;
 if not found then raise exception 'Invite unavailable'; end if;
 insert into private.audit_events(team_id,actor_id,operation,entity_id) values(p_team,actor,'invite.revoke',p_invite);
end $$;
create function private.set_captain(p_team uuid,p_captain boolean) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.actor();
begin
 if not private.is_member(p_team) then raise exception 'Team access denied' using errcode='42501'; end if;
 update public.team_memberships set is_captain=p_captain where team_id=p_team and user_id=actor;
 insert into private.audit_events(team_id,actor_id,operation,entity_id) values(p_team,actor,'captain.self_tag',actor);
end $$;
create function private.create_season(p_team uuid,p_name text) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.actor(); new_id uuid;
begin
 if not private.is_member(p_team) then raise exception 'Team access denied' using errcode='42501'; end if;
 insert into public.team_seasons(team_id,name,created_by) values(p_team,trim(p_name),actor) returning id into new_id;
 insert into private.audit_events(team_id,actor_id,operation,entity_id) values(p_team,actor,'season.create',new_id);
 return new_id;
end $$;
create function private.archive_season(p_team uuid,p_season uuid,p_archived boolean) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.actor();
begin
 if not private.is_member(p_team) then raise exception 'Team access denied' using errcode='42501'; end if;
 update public.team_seasons set archived=p_archived where id=p_season and team_id=p_team;
 if not found then raise exception 'Season unavailable'; end if;
 insert into private.audit_events(team_id,actor_id,operation,entity_id) values(p_team,actor,'season.archive_state',p_season);
end $$;
create function private.add_guest(p_team uuid,p_name text) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.actor(); new_id uuid;
begin
 if not private.is_member(p_team) then raise exception 'Team access denied' using errcode='42501'; end if;
 insert into public.team_players(team_id,display_name,is_guest) values(p_team,trim(p_name),true) returning id into new_id;
 insert into private.audit_events(team_id,actor_id,operation,entity_id) values(p_team,actor,'roster.guest_add',new_id);
 return new_id;
end $$;

-- Public RPCs are SECURITY INVOKER bridges; privileged code stays in private.
create function public.da_save_profile(p_nickname text) returns void language sql security invoker set search_path='' as $$select private.save_profile(p_nickname)$$;
create function public.da_create_team(p_name text,p_nickname text) returns uuid language sql security invoker set search_path='' as $$select private.create_team(p_name,p_nickname)$$;
create function public.da_create_invite(p_team uuid,p_max_uses integer default 10) returns table(code text,invite_id uuid,expires_at timestamptz) language sql security invoker set search_path='' as $$select * from private.create_invite(p_team,p_max_uses)$$;
create function public.da_redeem_invite(p_code text,p_nickname text) returns jsonb language sql security invoker set search_path='' as $$select private.redeem_invite(p_code,p_nickname)$$;
create function public.da_list_invites(p_team uuid) returns table(id uuid,expires_at timestamptz,revoked_at timestamptz,max_uses integer,uses integer) language sql security invoker set search_path='' as $$select * from private.list_invites(p_team)$$;
create function public.da_revoke_invite(p_team uuid,p_invite uuid) returns void language sql security invoker set search_path='' as $$select private.revoke_invite(p_team,p_invite)$$;
create function public.da_set_captain(p_team uuid,p_captain boolean) returns void language sql security invoker set search_path='' as $$select private.set_captain(p_team,p_captain)$$;
create function public.da_create_season(p_team uuid,p_name text) returns uuid language sql security invoker set search_path='' as $$select private.create_season(p_team,p_name)$$;
create function public.da_archive_season(p_team uuid,p_season uuid,p_archived boolean) returns void language sql security invoker set search_path='' as $$select private.archive_season(p_team,p_season,p_archived)$$;
create function public.da_add_guest(p_team uuid,p_name text) returns uuid language sql security invoker set search_path='' as $$select private.add_guest(p_team,p_name)$$;
revoke all on all functions in schema private from public,anon;
grant execute on all functions in schema private to authenticated;
do $$ declare fn record; begin
 for fn in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'da_%' loop
 execute format('revoke all on function %s from public,anon',fn.signature);
 execute format('grant execute on function %s to authenticated',fn.signature);
 end loop;
end $$;
