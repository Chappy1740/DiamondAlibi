// Disposable PostgreSQL only. No hosted connection, credentials or data.
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs'),assert=require('node:assert/strict');
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
(async()=>{
 const db=new PGlite();
 try {
  const source=fs.readFileSync('tests/optional-lineups-sql.cjs','utf8');
  const fixture=source.slice(source.indexOf('await db.exec(`')+15,source.indexOf('`);\n for(const name'));
  await db.exec(fixture.replaceAll(/\$\{id\((\d+)\)\}/g,(_,n)=>id(Number(n))));
  await db.exec(`alter table public.teams add column name text,add column created_by uuid references auth.users(id);update public.teams set created_by='${id(1)}';alter table public.team_players add column user_id uuid references auth.users(id);update public.team_players set user_id='${id(1)}' where id='${id(101)}';insert into public.team_memberships values('${id(10)}','${id(2)}',true);`);
  for(const name of ['20261009192021_m43_tournament_season_scoring.sql','20261009210007_tournament_games_guaranteed.sql','20261009203125_tournament_only_bands.sql','20261009224553_game_scoreboard_tournament_numbers.sql','20261009234045_competition_hr_limits.sql','20261013235234_optional_lineups.sql','20261014022554_team_beverage_rules.sql','20261014115637_manager_beverage_rules.sql','20261026175817_strikeout_types_double_play.sql','20261026183312_season_tournament_archive.sql','20261027012821_tournament_first_game_time.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+name,'utf8'));
  const hashes=await db.query(`select proname,md5(replace(pg_get_functiondef(oid),chr(13),'')) hash from pg_proc where pronamespace='private'::regnamespace and proname in ('apply_scoring_game_change','scoring_game_evaluation','read_scoring_season') order by proname`);
  if(process.env.SHOW_BASELINE){console.log(hashes.rows);return;}
  let serial=3000;const uuid=()=>id(++serial);
  const rpc=async(name,args)=>(await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)).rows[0].result;
  const read=()=>rpc('da_read_scoring_season',[id(10),id(11),'Overall']);
  const board={strikeout:1,solo:1,bandSolo:-1,grandSlam:-1,overLimit:1,insidePark:-1,multiRun:0};
  await db.exec(`select set_config('request.jwt.claim.sub','${id(1)}',false);set role authenticated`);
  await rpc('da_change_team_beverage',[id(10),uuid(),0,JSON.stringify({type:'finalize',rules:board})]);
  await rpc('da_create_scoring_competition',[id(10),id(11),id(13),'Tournament','Synthetic hit types',1,3]);
  const gameId=uuid(),dayId=uuid();
  assert.equal((await rpc('da_start_scoring_game',[id(10),id(11),dayId,'2026-11-07',id(13),uuid(),0,(await read()).tournaments[0].revision,JSON.stringify({type:'start',gameId,opponent:'Synthetic opponent',kind:'Tournament',battingMode:'manual',lineup:[],rules:{version:'Synthetic hits',fenceLimit:1,board},bands:{}})])).status,'accepted');
  async function change(body,command=uuid(),revision){const view=await read(),g=view.games[0];return rpc('da_apply_scoring_game_change',[id(10),id(11),dayId,gameId,command,revision??g.dayRevision,g.tournamentRevision,JSON.stringify({...body,gameId})]);}
  async function score(outcome,extra={}){const playId=uuid();await change({type:'score',playId,playerId:id(101),outcome,runs:0,rbi:0,...extra});return playId;}
  // Preserve real legacy semantics: no guessing singles/doubles from a generic hit.
  await score('Hit',{firstGameBand:false});await score('HBP');
  const before=await read(),rules=before.games[0].rules;
  await db.exec('reset role');
  const migration=fs.readFileSync('supabase/migrations/20261028004103_slow_pitch_hit_types.sql','utf8');
  const original=(await db.query("select pg_get_functiondef('private.scoring_game_evaluation(uuid,uuid,uuid)'::regprocedure) definition")).rows[0].definition;
  await db.exec('alter function private.scoring_game_evaluation(uuid,uuid,uuid) cost 101');
  await assert.rejects(()=>db.exec(migration),/definitions changed/);await db.exec('rollback');
  await db.exec(original);await db.exec(migration);await db.exec('set role authenticated');
  assert.deepEqual((await read()).games[0].evaluation,before.games[0].evaluation);
  assert.equal((await read()).capabilities.hitTypes,true);
  const single=await score('1B'),double=await score('2B',{runs:2,rbi:1}),triple=await score('3B');
  let view=await read(),ev=view.games[0].evaluation;
  assert.equal(ev.totals[id(101)].H,4);assert.equal(ev.totals[id(101)].AB,4);assert.equal(ev.totals[id(101)].PA,5);
  assert.equal(ev.totals[id(101)].HR,0);assert.equal(ev.totals[id(101)].RBI,1);assert.equal(ev.totals[id(101)].runs,2);assert.equal(ev.totals[id(101)].board,0);assert.equal(ev.fenceUsed,0);
  assert.deepEqual(view.games[0].rules,rules);
  assert.deepEqual(ev.rows.slice(-3).map(row=>row.outcome),['1B','2B','3B']);
  // Reloadable effective rows, audited corrections and voids preserve hit distinctions.
  await change({type:'correct',playId:single,outcome:'3B',runs:0,rbi:0,voided:false,reason:'Synthetic correction'});
  await change({type:'correct',playId:double,outcome:'2B',runs:2,rbi:1,voided:true,reason:'Synthetic void'});
  view=await read();ev=view.games[0].evaluation;
  assert.equal(ev.rows.find(row=>row.id===single).outcome,'3B');assert.equal(ev.rows.find(row=>row.id===double).voided,true);
  assert.equal(ev.totals[id(101)].H,3);assert.equal(ev.totals[id(101)].RBI,0);
  const command=uuid(),body={type:'score',playId:uuid(),playerId:id(101),outcome:'2B',runs:0,rbi:0};
  const revision=view.games[0].dayRevision;
  assert.equal((await change(body,command,revision)).status,'accepted');assert.equal((await change(body,command,revision)).duplicate,true);
  await assert.rejects(()=>change({...body,outcome:'3B'},command,revision),/reused/);
  assert.equal((await change({...body,playId:uuid()},uuid(),revision)).status,'conflict');
  await assert.rejects(()=>score('4B'),/Invalid play outcome/);
  // A non-creator member can record a hit; another team's player and inactive/anonymous users cannot.
  await db.exec(`select set_config('request.jwt.claim.sub','${id(2)}',false)`);await score('3B');
  await assert.rejects(()=>score('2B',{playerId:id(201)}),/roster|player/i);
  await db.exec(`reset role;update public.team_memberships set active=false where team_id='${id(10)}' and user_id='${id(2)}';set role authenticated`);
  await assert.rejects(()=>read(),/access denied/);
  await db.exec('reset role;set role anon');await assert.rejects(()=>read(),/permission denied/);
  await db.exec('reset role');
  const acl=(await db.query(`select has_function_privilege('anon','public.da_apply_scoring_game_change(uuid,uuid,uuid,uuid,uuid,bigint,bigint,jsonb)','execute') anon,has_table_privilege('authenticated','public.scoring_play_revisions','insert,update,delete') direct,has_function_privilege('authenticated','private.scoring_game_evaluation(uuid,uuid,uuid)','execute') helper`)).rows[0];
  assert.deepEqual(acl,{anon:false,direct:false,helper:false});
  console.log('PASS hit types SQL: explicit 1B/2B/3B saves/readback, hit totals, unchanged legacy/rules/BEVs/HR allowance, corrections/voids, retries/conflicts and access isolation. Disposable PostgreSQL only.');
 }finally{await db.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1});
