-- Remove ONLY fixtures created by this approved synthetic validation run.
-- Real users/teams never match these provenance predicates.
begin;
create temporary table da_test_users on commit drop as
 select id from auth.users where raw_app_meta_data->>'da_test_run'='m42_browser_20261009' and email like 'da-m42-%@example.invalid';
create temporary table da_test_teams on commit drop as
 select id from public.teams where created_by in(select id from da_test_users);
delete from private.audit_events where team_id in(select id from da_test_teams) or actor_id in(select id from da_test_users);
delete from private.team_invites where team_id in(select id from da_test_teams);
delete from private.invite_attempts where user_id in(select id from da_test_users);
delete from public.team_seasons where team_id in(select id from da_test_teams);
delete from public.team_players where team_id in(select id from da_test_teams);
delete from public.team_memberships where team_id in(select id from da_test_teams);
delete from public.teams where id in(select id from da_test_teams);
delete from public.player_profiles where user_id in(select id from da_test_users);
commit;
select 'Synthetic fixtures cleaned; auth accounts retained for test rerun' as result;
