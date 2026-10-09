-- Synthetic access verification. Every inserted row rolls back; no emails sent.
begin;
do $$ declare a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); c uuid:=gen_random_uuid(); begin
 perform set_config('test.user_a',a::text,true); perform set_config('test.user_b',b::text,true); perform set_config('test.user_c',c::text,true);
 insert into auth.users(id,email) values(a,'m42-a-'||a||'@example.invalid'),(b,'m42-b-'||b||'@example.invalid'),(c,'m42-c-'||c||'@example.invalid');
end $$;
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.user_a'),'role','authenticated')::text,true);
do $$ declare t uuid; s uuid; inv record; begin
 t:=public.da_create_team('Synthetic Team A','Synthetic A'); perform set_config('test.team_a',t::text,true);
 s:=public.da_create_season(t,'Synthetic Fall'); perform set_config('test.season_a',s::text,true);
 perform public.da_set_captain(t,true);
 perform public.da_add_guest(t,'Synthetic Guest');
 select * into inv from public.da_create_invite(t,1); perform set_config('test.code',inv.code,true); perform set_config('test.invite',inv.invite_id::text,true);
 if (select count(*) from public.team_players where team_id=t)<>2 then raise exception 'Creator/guest roster failed'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.user_b'),'role','authenticated')::text,true);
do $$ declare t uuid; denied boolean:=false; begin
 if exists(select 1 from public.teams where id=current_setting('test.team_a')::uuid) then raise exception 'Cross-team read leaked'; end if;
 begin perform public.da_create_season(current_setting('test.team_a')::uuid,'Forbidden'); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Cross-team season write allowed'; end if;
 denied:=false;
 begin perform public.da_set_captain(current_setting('test.team_a')::uuid,true); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Cross-team captain write allowed'; end if;
 t:=public.da_create_team('Synthetic Team B','Synthetic B'); perform set_config('test.team_b',t::text,true);
 if (public.da_redeem_invite('invalid','Synthetic B')->>'ok')::boolean then raise exception 'Invalid invite accepted'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.user_c'),'role','authenticated')::text,true);
do $$ declare r jsonb; t uuid:=current_setting('test.team_a')::uuid; denied boolean:=false; begin
 r:=public.da_redeem_invite(current_setting('test.code'),'Synthetic C');
 if not (r->>'ok')::boolean then raise exception 'Valid invite failed'; end if;
 if not exists(select 1 from public.teams where id=t) then raise exception 'Joined team unavailable'; end if;
 if exists(select 1 from public.teams where id=current_setting('test.team_b')::uuid) then raise exception 'Other team leaked after joining'; end if;
 perform public.da_set_captain(t,false);
 if not (select is_captain from public.team_memberships where team_id=t and user_id=current_setting('test.user_a')::uuid) then raise exception 'Captain tag changed another member'; end if;
 perform public.da_archive_season(t,current_setting('test.season_a')::uuid,true);
 perform public.da_archive_season(t,current_setting('test.season_a')::uuid,false);
 if (select count(*) from public.team_seasons where team_id=t)<>1 then raise exception 'Season history lost'; end if;
 begin update public.team_memberships set is_captain=true where team_id=t; exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Direct membership write allowed'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.user_b'),'role','authenticated')::text,true);
do $$ begin
 if (public.da_redeem_invite(current_setting('test.code'),'Synthetic B')->>'ok')::boolean then raise exception 'Exhausted invite accepted'; end if;
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.user_a'),'role','authenticated')::text,true);
do $$ declare inv record; begin
 select * into inv from public.da_create_invite(current_setting('test.team_a')::uuid,2);
 perform public.da_revoke_invite(current_setting('test.team_a')::uuid,inv.invite_id);
 perform set_config('test.revoked_code',inv.code,true);
end $$;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.user_b'),'role','authenticated')::text,true);
do $$ begin
 if (public.da_redeem_invite(current_setting('test.revoked_code'),'Synthetic B')->>'ok')::boolean then raise exception 'Revoked invite accepted'; end if;
end $$;
reset role;
do $$ begin
 if (select uses from private.team_invites where id=current_setting('test.invite')::uuid)<>1 then raise exception 'Invite uses inconsistent'; end if;
 if not exists(select 1 from private.audit_events where team_id=current_setting('test.team_a')::uuid and operation='invite.redeem') then raise exception 'Audit missing'; end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'da_%' and p.prosecdef) then raise exception 'Public privileged function'; end if;
 if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity) then raise exception 'RLS missing'; end if;
end $$;
set local role anon;
do $$ declare denied boolean:=false; begin
 begin perform public.da_create_team('Forbidden','Anonymous'); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Anonymous team creation allowed'; end if;
end $$;
reset role;
rollback;
select 'M4.2 access checks passed; all synthetic test data rolled back' as result;
