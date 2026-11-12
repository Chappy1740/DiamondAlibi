-- Outcome count rules for new scores and audited corrections:
-- strikeouts (K, K Looking, K Swinging, SOFO) score 0 runs and 0 RBI;
-- a double play scores runs but never an RBI; reached on error keeps its rule.
--
-- Read-only preflight before applying to a database with scoring history:
-- run supabase/audits/outcome-count-rules.sql and review any listed plays
-- through the audited correction path. Prior revisions are preserved.
--
-- Requires 20261111020047_reject_roe_rbi.sql. The guard below pins the
-- reviewed definition that migration produces and fails closed otherwise.

begin;

do $$
declare
  definition text := pg_get_functiondef(
    'private.apply_scoring_game_change(uuid,uuid,uuid,uuid,uuid,bigint,bigint,jsonb)'::regprocedure
  );
  roe_check constant text := $roe$    if outcome='ROE' and rbi>0 then
      raise exception 'Reached on error cannot earn RBI.' using errcode='22023';
    end if;$roe$;
begin
  if md5(replace(definition, chr(13), '')) <> '25eeb2f145cc10f1ce133eda2a33c7cf' then
    raise exception 'Scoring change definition changed. Review the outcome count rules migration.';
  end if;
  if (length(definition) - length(replace(definition, roe_check, ''))) / length(roe_check) <> 1 then
    raise exception 'Reached on error check not found exactly once. Review the outcome count rules migration.';
  end if;

  execute replace(definition, roe_check,
    $after$    if outcome in ('K','K Looking','K Swinging','SOFO') and (runs>0 or rbi>0) then
      raise exception 'A strikeout cannot score runs or earn RBI.' using errcode='22023';
    end if;
    if outcome='ROE' and rbi>0 then
      raise exception 'Reached on error cannot earn RBI.' using errcode='22023';
    end if;
    if outcome='DP' and rbi>0 then
      raise exception 'A double play cannot earn RBI.' using errcode='22023';
    end if;$after$
  );
end $$;

commit;
