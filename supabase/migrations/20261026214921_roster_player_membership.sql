-- Local preparation: regular roster players may later link an account through
-- an explicit player-bound, single-use invitation. No name matching or history merge.
begin;
do $$ begin
 if md5(pg_get_functiondef('private.create_invite(uuid,integer)'::regprocedure))<>'ecaba0543eff0655d8db770e41a98993'
 or md5(pg_get_functiondef('private.redeem_invite(text,text)'::regprocedure))<>'34f0f50bb3cc825bd90bf63f2cdace55' then
 raise exception 'Invitation definitions changed; review roster membership migration'; end if;
end $$;
alter table private.team_invites add column player_id uuid,
 add constraint team_invites_roster_player_fkey foreign key(team_id,player_id) references public.team_players(team_id,id),
 add constraint player_invites_single_use check(player_id is null or max_uses=1);
create index team_invites_player_idx on private.team_invites(team_id,player_id) where player_id is not null;

create function private.create_player_invite(p_team uuid,p_player uuid)
returns table(code text,invite_id uuid,expires_at timestamptz)
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.actor(); player public.team_players%rowtype; created record;
begin
 perform 1 from public.team_memberships where team_id=p_team and user_id=actor and active for share;
 if not found then raise exception 'Team access denied' using errcode='42501'; end if;
 select * into player from public.team_players where team_id=p_team and id=p_player for update;
 if not found or not player.is_guest or player.user_id is not null then raise exception 'Choose an unlinked roster player' using errcode='22023'; end if;
 select * into created from private.create_invite(p_team,1);
 update private.team_invites set player_id=p_player where id=created.invite_id;
 insert into private.audit_events(team_id,actor_id,operation,entity_id) values(p_team,actor,'roster.player_invite_create',p_player);
 return query select created.code,created.invite_id,created.expires_at;
end $$;

create function private.list_player_invites(p_team uuid)
returns table(invite_id uuid,player_id uuid)
language plpgsql stable security definer set search_path='' as $$
begin
 perform private.actor();
 if not private.is_member(p_team) then raise exception 'Team access denied' using errcode='42501'; end if;
 return query select i.id,i.player_id from private.team_invites i where i.team_id=p_team and i.player_id is not null order by i.created_at desc limit 50;
end $$;

create or replace function private.redeem_invite(p_code text,p_nickname text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=private.actor(); invite private.team_invites%rowtype; attempts_count integer; clean_code text:=lower(trim(p_code)); player public.team_players%rowtype;
begin
 -- Existing attempt throttling also serializes simultaneous redemptions by one account.
 insert into private.invite_attempts(user_id,window_started,attempts) values(actor,now(),1)
 on conflict(user_id) do update set
 attempts=case when private.invite_attempts.window_started < now()-interval '15 minutes' then 1 else least(private.invite_attempts.attempts+1,10) end,
 window_started=case when private.invite_attempts.window_started < now()-interval '15 minutes' then now() else private.invite_attempts.window_started end
 returning attempts into attempts_count;
 if attempts_count>=10 then return jsonb_build_object('ok',false,'error','Too many attempts. Try again later.'); end if;
 if clean_code is null or clean_code !~ '^[0-9a-f]{36}$' or p_nickname is null or char_length(trim(p_nickname)) not between 1 and 40 then
 return jsonb_build_object('ok',false,'error','Invite unavailable or invalid.'); end if;
 select * into invite from private.team_invites where code_hash=encode(extensions.digest(clean_code,'sha256'),'hex') for update;
 if not found or invite.revoked_at is not null or invite.expires_at<=now() then
 return jsonb_build_object('ok',false,'error','Invite unavailable or invalid.'); end if;
 if invite.player_id is not null then
   -- A roster-specific code is intentional authorization by a current member.
   -- Never infer account ownership from a nickname or let an inactive member rejoin.
   perform 1 from public.team_memberships where team_id=invite.team_id and user_id=invite.issued_by and active for share;
   if not found then return jsonb_build_object('ok',false,'error','Invite unavailable or invalid.'); end if;
   select * into player from public.team_players where team_id=invite.team_id and id=invite.player_id for update;
   if not found then return jsonb_build_object('ok',false,'error','Invite unavailable or invalid.'); end if;
   perform 1 from public.team_memberships where team_id=invite.team_id and user_id=actor for share;
   if found then
     if invite.uses=1 and private.is_member(invite.team_id) and player.user_id=actor and not player.is_guest then
       return jsonb_build_object('ok',true,'team_id',invite.team_id,'player_id',player.id,'duplicate',true);
     end if;
     return jsonb_build_object('ok',false,'error','This account already has team history. Ask your team organizer to review it before linking another player.');
   end if;
   if invite.uses>=invite.max_uses or not player.is_guest or player.user_id is not null then
     return jsonb_build_object('ok',false,'error','Invite unavailable or invalid.'); end if;
   perform private.save_profile(p_nickname);
   insert into public.team_memberships(team_id,user_id) values(invite.team_id,actor);
   update public.team_players set user_id=actor,is_guest=false where team_id=invite.team_id and id=player.id;
   update private.team_invites set uses=uses+1 where id=invite.id;
   insert into private.audit_events(team_id,actor_id,operation,entity_id) values(invite.team_id,actor,'invite.redeem',invite.id),(invite.team_id,actor,'roster.account_link',player.id);
   return jsonb_build_object('ok',true,'team_id',invite.team_id,'player_id',player.id);
 end if;
 -- Preserve normal new-teammate invitations. These never claim an existing name.
 if invite.uses>=invite.max_uses then return jsonb_build_object('ok',false,'error','Invite unavailable or invalid.'); end if;
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

create function public.da_create_player_invite(p_team uuid,p_player uuid)
returns table(code text,invite_id uuid,expires_at timestamptz)
language sql security invoker set search_path='' as $$select * from private.create_player_invite(p_team,p_player)$$;
create function public.da_list_player_invites(p_team uuid)
returns table(invite_id uuid,player_id uuid)
language sql stable security invoker set search_path='' as $$select * from private.list_player_invites(p_team)$$;
revoke all on function private.create_player_invite(uuid,uuid),private.list_player_invites(uuid),public.da_create_player_invite(uuid,uuid),public.da_list_player_invites(uuid) from public,anon,authenticated;
grant execute on function private.create_player_invite(uuid,uuid),private.list_player_invites(uuid),public.da_create_player_invite(uuid,uuid),public.da_list_player_invites(uuid) to authenticated;
-- Existing RLS, table write denial and redeem wrapper ACLs remain unchanged.
commit;
