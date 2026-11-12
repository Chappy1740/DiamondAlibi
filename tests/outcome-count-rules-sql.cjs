// Disposable PostgreSQL only. No hosted connection, credentials or data.
// Covers 20261111200000_outcome_count_rules.sql: strikeouts score nothing; ROE and DP never earn RBI.
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs'),assert=require('node:assert/strict');
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
(async()=>{
 const db=new PGlite();
 try {
  const source=fs.readFileSync('tests/optional-lineups-sql.cjs','utf8');
  const fixture=source.slice(source.indexOf('await db.exec(`')+15,source.indexOf('`);\n for(const name'));
  await db.exec(fixture.replaceAll(/\$\{id\((\d+)\)\}/g,(_,n)=>id(Number(n))));
  await db.exec(`alter table public.teams add column name text,add column created_by uuid references auth.users(id);update public.teams set created_by='${id(1)}';alter table public.team_players add column user_id uuid references auth.users(id);update public.team_players set user_id='${id(1)}' where id='${id(101)}';`);
  // The same reviewed chain as tests/hit-types-sql.cjs, then the ROE rule this migration builds on.
  for(const name of ['20261009192021_m43_tournament_season_scoring.sql','20261009210007_tournament_games_guaranteed.sql','20261009203125_tournament_only_bands.sql','20261009224553_game_scoreboard_tournament_numbers.sql','20261009234045_competition_hr_limits.sql','20261013235234_optional_lineups.sql','20261014022554_team_beverage_rules.sql','20261014115637_manager_beverage_rules.sql','20261026175817_strikeout_types_double_play.sql','20261026183312_season_tournament_archive.sql','20261027012821_tournament_first_game_time.sql','20261028004103_slow_pitch_hit_types.sql','20261111020047_reject_roe_rbi.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+name,'utf8'));
  let serial=5000;const uuid=()=>id(++serial);
  const rpc=async(name,args)=>(await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)).rows[0].result;
  const read=()=>rpc('da_read_scoring_season',[id(10),id(11),'Overall']);
  const board={strikeout:1,solo:1,bandSolo:-1,grandSlam:-1,overLimit:1,insidePark:-1,multiRun:0,strikeoutLooking:2,strikeoutSwinging:2,strikeoutFoul:1,doublePlay:1};
  await db.exec(`select set_config('request.jwt.claim.sub','${id(1)}',false);set role authenticated`);
  await rpc('da_change_team_beverage',[id(10),uuid(),0,JSON.stringify({type:'finalize',rules:board})]);
  await rpc('da_create_scoring_competition',[id(10),id(11),id(13),'Tournament','Synthetic count rules',1,3]);
  const gameId=uuid(),dayId=uuid();
  assert.equal((await rpc('da_start_scoring_game',[id(10),id(11),dayId,'2026-11-07',id(13),uuid(),0,(await read()).tournaments[0].revision,JSON.stringify({type:'start',gameId,opponent:'Synthetic opponent',kind:'Tournament',battingMode:'manual',lineup:[],rules:{version:'Synthetic counts',fenceLimit:1,board},bands:{}})])).status,'accepted');
  async function change(body,command=uuid()){const g=(await read()).games[0];return rpc('da_apply_scoring_game_change',[id(10),id(11),dayId,gameId,command,g.dayRevision,g.tournamentRevision,JSON.stringify({...body,gameId})]);}
  async function score(outcome,extra={}){const playId=uuid();assert.equal((await change({type:'score',playId,playerId:id(101),outcome,runs:0,rbi:0,...extra})).status,'accepted');return playId;}
  const correction=(playId,outcome,runs,rbi,voided=false)=>({type:'correct',playId,outcome,runs,rbi,voided,reason:'Synthetic correction'});
  const revisions=async()=>(await db.query('select * from public.scoring_play_revisions where game_id=$1 order by play_id,revision',[gameId])).rows;
  const totals=async()=>(await read()).games[0].evaluation.totals[id(101)];
  const audit=fs.readFileSync('supabase/audits/outcome-count-rules.sql','utf8');
  const broken=async()=>(await db.query(audit)).rows;
  // Seed the Nov 7 shape before the rule exists: a strikeout saved with runs and RBI, plus DP RBI.
  const legacyK=await score('K Swinging',{runs:4,rbi:4,firstGameBand:false});
  const legacySofo=await score('SOFO',{runs:1,rbi:0});
  const legacyDp=await score('DP',{runs:2,rbi:1});
  await score('K Looking');await score('DP',{runs:1});await score('ROE',{runs:1});
  const oldRows=await revisions(),oldGame=(await read()).games[0];
  assert.equal(oldGame.evaluation.totals[id(101)].RBI,5);assert.equal(oldGame.evaluation.totals[id(101)].runs,9);
  await db.exec('reset role');
  assert.deepEqual((await broken()).map(row=>[row.play_id,row.outcome,row.runs,row.rbi]),[[legacyK,'K Swinging',4,4],[legacySofo,'SOFO',1,0],[legacyDp,'DP',2,1]].sort((a,b)=>a[0]<b[0]?-1:1),'audit lists only plays whose latest revision breaks a rule');
  // The migration refuses a scoring change function that differs from the reviewed one, and changes nothing when refused.
  const migration=fs.readFileSync('supabase/migrations/20261111200000_outcome_count_rules.sql','utf8');
  const scoringChange='private.apply_scoring_game_change(uuid,uuid,uuid,uuid,uuid,bigint,bigint,jsonb)';
  const definition=async()=>(await db.query(`select pg_get_functiondef('${scoringChange}'::regprocedure) definition`)).rows[0].definition;
  const reviewed=await definition();
  await db.exec(`alter function ${scoringChange} cost 101`);
  const altered=await definition();
  await assert.rejects(()=>db.exec(migration),/Scoring change definition changed/);
  await db.exec('rollback');
  assert.equal(await definition(),altered,'Refused migration leaves the function untouched');
  await db.exec(reviewed);assert.equal(await definition(),reviewed);
  await db.exec(migration);
  await assert.rejects(()=>db.exec(migration),/Scoring change definition changed/,'Applying twice is refused');
  await db.exec('rollback');
  await db.exec('set role authenticated');
  assert.deepEqual(await revisions(),oldRows,'History is preserved');
  assert.deepEqual((await read()).games[0],oldGame,'Existing evaluation is unchanged until an audited correction');
  // New scores follow the rules for every strikeout type, ROE and DP.
  const strikeout={code:'22023',message:/A strikeout cannot score runs or earn RBI/};
  for(const outcome of ['K','K Looking','K Swinging','SOFO']){
    await assert.rejects(()=>score(outcome,{runs:1,rbi:0}),strikeout,`${outcome} with runs`);
    await assert.rejects(()=>score(outcome,{runs:1,rbi:1}),strikeout,`${outcome} with runs and RBI`);
    await score(outcome);
  }
  await assert.rejects(()=>score('DP',{runs:1,rbi:1}),{code:'22023',message:/A double play cannot earn RBI/});
  await score('DP',{runs:3});
  await assert.rejects(()=>score('ROE',{runs:1,rbi:1}),{code:'22023',message:/Reached on error cannot earn RBI/});
  await score('ROE',{runs:2});
  await score('Hit',{runs:2,rbi:2});
  // Corrections that keep broken counts are rejected atomically, void or not.
  const afterScores=await revisions(),afterGame=(await read()).games[0];
  await assert.rejects(()=>change(correction(legacyK,'K Swinging',4,4)),strikeout);
  await assert.rejects(()=>change(correction(legacyK,'K Swinging',4,4,true)),strikeout);
  await assert.rejects(()=>change(correction(legacyK,'K Swinging',1,1)),strikeout);
  await assert.rejects(()=>change(correction(legacySofo,'K',1,0)),strikeout);
  await assert.rejects(()=>change(correction(legacyDp,'DP',2,1)),{code:'22023',message:/A double play cannot earn RBI/});
  await assert.rejects(()=>change(correction(legacyDp,'DP',2,1,true)),{code:'22023',message:/A double play cannot earn RBI/});
  assert.deepEqual(await revisions(),afterScores);assert.deepEqual((await read()).games[0],afterGame);
  // Audited corrections to the rule succeed, append a revision and preserve the prior rows.
  assert.equal((await change(correction(legacyK,'K Swinging',0,0))).status,'accepted');
  assert.equal((await change(correction(legacySofo,'SOFO',0,0))).status,'accepted');
  assert.equal((await change(correction(legacyDp,'DP',2,0))).status,'accepted');
  const corrected=await revisions();
  assert.equal(corrected.length,afterScores.length+3);
  assert.deepEqual(corrected.filter(row=>row.revision===1),afterScores.filter(row=>row.revision===1));
  const rows=(await read()).games[0].evaluation.rows;
  assert.deepEqual([legacyK,legacySofo,legacyDp].map(playId=>{const row=rows.find(r=>r.id===playId);return [row.outcome,row.runs,row.rbi];}),[['K Swinging',0,0],['SOFO',0,0],['DP',2,0]]);
  const t=await totals();
  assert.equal(t.RBI,afterGame.evaluation.totals[id(101)].RBI-5);
  assert.equal(t.runs,afterGame.evaluation.totals[id(101)].runs-5);
  assert.equal(t.K,afterGame.evaluation.totals[id(101)].K);
  await db.exec('reset role');
  assert.deepEqual(await broken(),[],'audit is clean after the corrections');
  console.log('PASS outcome count rules SQL: audit lists broken latest revisions, migration refuses a changed function, preserves history, every strikeout type/ROE/DP write is rejected atomically, and audited corrections to the rule succeed. Disposable PostgreSQL only.');
 }finally{await db.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1});
