-- Read-only preflight before applying to a database with scoring history:
-- select count(*) from public.scoring_play_revisions where outcome = 'ROE' and rbi > 0;
-- Review any affected plays through the audited correction path. Preserve prior revisions.

begin;

do $$
declare
  definition text := pg_get_functiondef(
    'private.apply_scoring_game_change(uuid,uuid,uuid,uuid,uuid,bigint,bigint,jsonb)'::regprocedure
  );
begin
  if md5(replace(definition, chr(13), '')) <> 'e77b48012fb9d33395fce8510b6f3597' then
    raise exception 'Scoring change definition changed. Review the ROE RBI migration.';
  end if;

  execute replace(definition,
    $before$then raise exception 'Invalid play outcome' using errcode='22023'; end if;$before$,
    $after$then raise exception 'Invalid play outcome' using errcode='22023'; end if;
    if outcome='ROE' and rbi>0 then
      raise exception 'Reached on error cannot earn RBI.' using errcode='22023';
    end if;$after$
  );
end $$;

commit;
