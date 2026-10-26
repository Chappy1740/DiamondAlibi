// Isolated in-memory PostgreSQL; no hosted credentials, records or writes.
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
(async () => {
 const db = new PGlite();
 try {
  const fixtureSource=fs.readFileSync('tests/optional-lineups-sql.cjs','utf8');
  const fixture=fixtureSource.slice(fixtureSource.indexOf('await db.exec(`')+15,fixtureSource.indexOf('`);\n for(const name'));
  await db.exec(fixture.replaceAll(/\$\{id\((\d+)\)\}/g,(_,n)=>id(Number(n))));
  await db.exec(`alter table public.teams add column name text,add column created_by uuid references auth.users(id);
   update public.teams set created_by='${id(1)}' where id='${id(10)}';
   alter table public.team_players add column user_id uuid references auth.users(id);
   update public.team_players set user_id='${id(1)}' where id='${id(101)}';
   update public.team_players set user_id='${id(2)}' where id='${id(102)}';
   insert into public.team_memberships values('${id(10)}','${id(2)}',true);`);
  for(const file of ['20261009192021_m43_tournament_season_scoring.sql','20261009210007_tournament_games_guaranteed.sql','20261009203125_tournament_only_bands.sql','20261009224553_game_scoreboard_tournament_numbers.sql','20261009234045_competition_hr_limits.sql','20261013235234_optional_lineups.sql','20261014022554_team_beverage_rules.sql','20261014115637_manager_beverage_rules.sql']) await db.exec(fs.readFileSync('supabase/migrations/'+file,'utf8'));
  const baseline=await db.query(`select proname,md5(pg_get_functiondef(oid)) hash from pg_proc where pronamespace='private'::regnamespace and proname in ('start_scoring_game','apply_scoring_game_change','scoring_game_evaluation','valid_beverage_rules','read_team_beverage','change_team_beverage') order by proname`);
  if(process.env.SHOW_BASELINE)console.log(JSON.stringify(baseline.rows));
  let serial=1000;const uuid=()=>id(++serial);
  const rpc=async(name,args)=>(await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)).rows[0].result;
  const read=()=>rpc('da_read_scoring_season',[id(10),id(11),'Overall']);
  const prefs=()=>rpc('da_read_team_beverage',[id(10)]);
  const settings=async(rules)=>rpc('da_change_team_beverage',[id(10),uuid(),(await prefs()).revision,JSON.stringify({type:(await prefs()).finalized?'replace':'finalize',rules})]);
  const participation=async(value)=>rpc('da_change_team_beverage',[id(10),uuid(),(await prefs()).revision,JSON.stringify({type:'participation',participating:value})]);
  const board={strikeout:1,solo:1,bandSolo:-1,grandSlam:-1,overLimit:1,insidePark:-1,multiRun:0};
  await db.exec(`select set_config('request.jwt.claim.sub','${id(1)}',false);set role authenticated`);
  await settings(board);
  await rpc('da_create_scoring_competition',[id(10),id(11),id(13),'Tournament','Synthetic extended Cup',3,3]);
  async function start(rules=board) {
   const view=await read(),day=view.games[0],gameId=uuid(),tour=view.tournaments[0];
   const result=await rpc('da_start_scoring_game',[id(10),id(11),day?.game.day_id??uuid(),'2026-11-07',id(13),uuid(),day?.dayRevision??0,tour.revision,JSON.stringify({type:'start',gameId,opponent:'Synthetic opponent',kind:'Tournament',battingMode:'manual',lineup:[],rules:{version:'Synthetic '+gameId,fenceLimit:3,board:rules},bands:{}})]);
   assert.equal(result.status,'accepted');return (await read()).games.find(g=>g.game.id===gameId);
  }
  async function change(game,body,command=uuid(),revision) {
   const current=(await read()).games.find(g=>g.game.id===game.game.id);
   return rpc('da_apply_scoring_game_change',[id(10),id(11),current.game.day_id,current.game.id,command,revision??current.dayRevision,current.tournamentRevision,JSON.stringify({...body,gameId:current.game.id})]);
  }
  async function score(game,outcome,extra={}) {
   const current=(await read()).games.find(g=>g.game.id===game.game.id);
   const band=(await read()).games.some(g=>g.evaluation.rows.some(row=>row.playerId===id(101)))?{}:{firstGameBand:false};
   const body={type:'score',playId:uuid(),playerId:id(101),outcome,runs:0,rbi:0,...band,...extra};
   assert.equal((await change(game,body)).status,'accepted');return (await read()).games.find(g=>g.game.id===game.game.id);
  }
  let legacy=await start();legacy=await score(legacy,'K');
  const original=structuredClone(legacy);
  await db.exec('reset role');
  const migration=fs.readFileSync('supabase/migrations/20261026175817_strikeout_types_double_play.sql','utf8');
  const originalDefinition=(await db.query("select pg_get_functiondef('private.valid_beverage_rules(jsonb)'::regprocedure) definition")).rows[0].definition;
  await db.exec('alter function private.valid_beverage_rules(jsonb) cost 101');
  await assert.rejects(()=>db.exec(migration),/Scoring definitions changed/);
  await db.exec('rollback');
  assert.equal((await db.query("select count(*)::integer count from information_schema.columns where table_schema='public' and table_name='scoring_rule_versions' and column_name='double_play'")).rows[0].count,0,'drift rejection rolls back before schema changes');
  await db.exec(originalDefinition);
  await db.exec(migration);
  // Migration only adds nullable columns; old rules/evaluation remain authoritative.
  await db.exec('set role authenticated');
  legacy=(await read()).games.find(g=>g.game.id===legacy.game.id);
  assert.deepEqual(legacy.evaluation,original.evaluation);
  assert.equal(legacy.rules.strikeout_looking,null);
  assert.equal((await prefs()).extendedOutcomes,true);
  assert.deepEqual((await prefs()).rules,board);
  await assert.rejects(()=>score(legacy,'K Looking'),/no saved extended/);
  await assert.rejects(()=>settings({...board,strikeoutLooking:2}),/explicit/i);
  await assert.rejects(()=>settings({...board,strikeoutLooking:2,strikeoutSwinging:2,strikeoutFoul:1,doublePlay:101}),/explicit/i);
  const extended={...board,strikeoutLooking:2,strikeoutSwinging:2,strikeoutFoul:1,doublePlay:1};
  assert.equal((await settings(extended)).status,'accepted');
  let game=await start(extended);
  const savedRules={...game.rules};
  for(const outcome of ['K Looking','K Swinging','SOFO','DP'])game=await score(game,outcome);
  assert.deepEqual(game.evaluation.rows.map(p=>p.delta),[2,2,1,1]);
  assert.equal(game.evaluation.totals[id(101)].K,3);
  assert.equal(game.evaluation.totals[id(101)].AB,4);
  assert.equal(game.evaluation.totals[id(101)].PA,4);
  assert.equal(game.evaluation.totals[id(101)].H,0);
  assert.equal(game.evaluation.totals[id(101)].board,6);
  // A retry with the same command is a receipt, never another plate appearance.
  const cmd=uuid(),body={type:'score',playId:uuid(),playerId:id(101),outcome:'DP',runs:0,rbi:0};
  assert.equal((await change(game,body,cmd)).status,'accepted');
  assert.equal((await change(game,body,cmd)).duplicate,true);
  await assert.rejects(()=>change(game,{...body,outcome:'SOFO'},cmd),/reused/);
  game=(await read()).games.find(g=>g.game.id===game.game.id);
  assert.equal(game.evaluation.rows.length,5);
  // HR correction copies all four new rule values and replay stays identical.
  const before=game.evaluation;
  await change(game,{type:'hrLimit',fenceLimit:2,reason:'Synthetic correction'});
  game=(await read()).games.find(g=>g.game.id===game.game.id);
  assert.deepEqual(game.evaluation,before);
  for(const key of ['strikeout_looking','strikeout_swinging','strikeout_foul','double_play'])assert.equal(game.rules[key],savedRules[key]);
  const dp=game.evaluation.rows.at(-1);
  await change(game,{type:'correct',playId:dp.id,outcome:'K Looking',runs:0,rbi:0,voided:false,reason:'Synthetic outcome correction'});
  game=(await read()).games.find(g=>g.game.id===game.game.id);
  assert.equal(game.evaluation.totals[id(101)].K,4);
  assert.equal(game.evaluation.totals[id(101)].board,8);
  await change(game,{type:'correct',playId:dp.id,outcome:'K Looking',runs:0,rbi:0,voided:true,reason:'Synthetic void'});
  game=(await read()).games.find(g=>g.game.id===game.game.id);
  assert.equal(game.evaluation.totals[id(101)].board,6);
  // New defaults never rewrite either old or newly captured game rules.
  const nextRules={...extended,strikeoutLooking:4,doublePlay:3};
  await settings(nextRules);
  const next=await start(nextRules);
  game=await score(game,'K Looking');assert.equal(game.evaluation.rows.at(-1).delta,2);
  let second=await score(next,'K Looking');assert.equal(second.evaluation.rows.at(-1).delta,4);
  await participation(false);
  game=await score(game,'K Swinging');assert.equal(game.evaluation.rows.at(-1).delta,0);
  assert.equal(game.evaluation.rows.at(-1).beverageParticipating,false);
  assert.equal(game.evaluation.totals[id(101)].K,5,'opt-out does not remove baseball statistics');
  await participation(true);
  game=await score(game,'SOFO');assert.equal(game.evaluation.rows.at(-1).delta,1);
  legacy=await score(legacy,'K');assert.equal(legacy.evaluation.rows.at(-1).delta,1);
  // SQL totals match the reusable pure TypeScript projection for all new outcomes.
  const { evaluateGame }=await import('../src/lib/scoring.ts');
  const projection=evaluateGame({id:'local',opponent:'Synthetic',kind:'Tournament',lineup:[id(101)],next:0,complete:false,rules:{version:'Synthetic',fenceLimit:3,board:extended},plays:['K Looking','K Swinging','SOFO','DP'].map((outcome,i)=>({id:String(i),playerId:id(101),outcome,runs:0,rbi:0,voided:false}))},[]);
  assert.equal(projection.totals[id(101)].board,6);assert.equal(projection.totals[id(101)].K,3);
  // Members can score but cannot change the creator's team defaults.
  await db.exec(`select set_config('request.jwt.claim.sub','${id(2)}',false)`);
  await assert.rejects(()=>settings(extended),/creator/);
  await assert.rejects(()=>rpc('da_read_scoring_season',[id(999),id(21),'Overall']),/access denied/);
  await db.exec(`reset role;update public.team_memberships set active=false where team_id='${id(10)}' and user_id='${id(1)}';select set_config('request.jwt.claim.sub','${id(1)}',false);set role authenticated`);
  await assert.rejects(()=>read(),/access denied/);
  await assert.rejects(()=>change(game,body),/access denied/);
  await db.exec('reset role;set role anon');
  await assert.rejects(()=>read(),/permission denied/);
  await db.exec('reset role');
  const privileges=(await db.query(`select has_function_privilege('anon','public.da_apply_scoring_game_change(uuid,uuid,uuid,uuid,uuid,bigint,bigint,jsonb)','execute') as anon,has_table_privilege('authenticated','public.scoring_rule_versions','insert,update,delete') as direct,has_function_privilege('authenticated','private.scoring_beverage_board(public.scoring_rule_versions)','execute') as helper`)).rows[0];
  assert.deepEqual(privileges,{anon:false,direct:false,helper:false});
  console.log('PASS extended outcomes SQL: positive owed amounts, totals parity, old history, rules/HR correction, immutable defaults, void/correction, opt-out/rejoin, retries and permissions. Disposable database only.');
 } finally {await db.close()}
})().catch(error=>{console.error(error.stack);process.exitCode=1});
