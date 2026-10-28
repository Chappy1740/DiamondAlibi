-- Local preparation only; hosted application requires this release's explicit approval.
-- Add explicit hit types without relabeling legacy Hit/HBP revisions or changing rules.
begin;
do $$
declare definition text;
begin
  if md5(replace(pg_get_functiondef('private.apply_scoring_game_change(uuid,uuid,uuid,uuid,uuid,bigint,bigint,jsonb)'::regprocedure),chr(13),'')) <> 'bcc4f4a40e43a23380928129b6a87031'
    or md5(replace(pg_get_functiondef('private.scoring_game_evaluation(uuid,uuid,uuid)'::regprocedure),chr(13),'')) <> '55cd028b0d1f460d273f74329db9ba11'
    or md5(replace(pg_get_functiondef('private.read_scoring_season(uuid,uuid,text)'::regprocedure),chr(13),'')) <> 'e49987a3fa5d38480454d254d99d2072' then
    raise exception 'Scoring definitions changed; review hit types migration';
  end if;

  definition:=pg_get_functiondef('private.apply_scoring_game_change(uuid,uuid,uuid,uuid,uuid,bigint,bigint,jsonb)'::regprocedure);
  definition:=replace(definition,$needle$'Hit','BB','HBP'$needle$,$needle$'Hit','1B','2B','3B','BB','HBP'$needle$);
  execute definition;

  definition:=pg_get_functiondef('private.scoring_game_evaluation(uuid,uuid,uuid)'::regprocedure);
  definition:=replace(definition,$needle$is_hit:=p.outcome in ('Hit','ITP HR')$needle$,$needle$is_hit:=p.outcome in ('Hit','1B','2B','3B','ITP HR')$needle$);
  execute definition;

  definition:=pg_get_functiondef('private.read_scoring_season(uuid,uuid,text)'::regprocedure);
  definition:=replace(definition,$needle$'tournamentStartTime',true)$needle$,$needle$'tournamentStartTime',true,'hitTypes',true)$needle$);
  execute definition;
end $$;

alter table public.scoring_play_revisions drop constraint scoring_play_revisions_outcome_check;
alter table public.scoring_play_revisions add constraint scoring_play_revisions_outcome_check
  check(outcome in ('Hit','1B','2B','3B','BB','HBP','ROE','K','K Looking','K Swinging','SOFO','DP','Out','SF','Fence HR','ITP HR'));
-- Existing function signatures/owners/ACLs, row isolation, command receipts and audit remain intact.
commit;
