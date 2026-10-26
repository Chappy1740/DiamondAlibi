// Disposable PostgreSQL only. No hosted records, sessions or migrations.
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
  for(const name of ['20261009192021_m43_tournament_season_scoring.sql','20261009210007_tournament_games_guaranteed.sql','20261009203125_tournament_only_bands.sql','20261009224553_game_scoreboard_tournament_numbers.sql','20261009234045_competition_hr_limits.sql','20261013235234_optional_lineups.sql','20261014022554_team_beverage_rules.sql','20261014115637_manager_beverage_rules.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+name,'utf8'));
  // Reuse the unchanged season archive implementation rather than invent a replacement.
  const membership=fs.readFileSync('supabase/migrations/20261009053237_m42_membership_seasons.sql','utf8');
  const seasonFunction=membership.match(/create function private\.archive_season\([\s\S]*?\nend \$\$;/)[0];
  await db.exec(`create function private.actor() returns uuid language plpgsql stable security invoker set search_path='' as $$begin if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;return auth.uid();end$$;`+seasonFunction+`create function public.da_archive_season(p_team uuid,p_season uuid,p_archived boolean) returns void language sql security invoker set search_path='' as $$select private.archive_season(p_team,p_season,p_archived)$$;revoke all on function public.da_archive_season(uuid,uuid,boolean) from public,anon;grant execute on function public.da_archive_season(uuid,uuid,boolean),private.archive_season(uuid,uuid,boolean) to authenticated;`);
  if(process.env.WITH_EXTENDED==='1')await db.exec(fs.readFileSync('supabase/migrations/20261026175817_strikeout_types_double_play.sql','utf8'));
  const baseline=(await db.query(`select md5(pg_get_functiondef('private.read_scoring_season(uuid,uuid,text)'::regprocedure)) hash`)).rows[0].hash;
  if(process.env.SHOW_BASELINE)console.log('read_scoring_season baseline',baseline);
  const migration=fs.readFileSync('supabase/migrations/20261026183312_season_tournament_archive.sql','utf8');
  const originalRead=(await db.query("select pg_get_functiondef('private.read_scoring_season(uuid,uuid,text)'::regprocedure) definition")).rows[0].definition;
  await db.exec('alter function private.read_scoring_season(uuid,uuid,text) cost 101');
  await assert.rejects(()=>db.exec(migration),/Season read definition changed/);await db.exec('rollback');
  assert.equal((await db.query("select count(*)::integer count from information_schema.columns where table_schema='public' and table_name='scoring_tournaments' and column_name='archived'")).rows[0].count,0,'drift rejection precedes schema changes');
  await db.exec(originalRead);
  await db.exec(migration);
  let serial=2000;const uuid=()=>id(++serial);
  const rpc=async(name,args)=>(await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args)).rows[0].result;
  const read=()=>rpc('da_read_scoring_season',[id(10),id(11),'Overall']);
  const tour=async(t=id(13))=>(await read()).tournaments.find(row=>row.id===t);
  const archive=(t,command,expected,archived)=>rpc('da_archive_scoring_tournament',[id(10),id(11),t,command,expected,archived]);
  const board={strikeout:1,solo:1,bandSolo:-1,grandSlam:-1,overLimit:1,insidePark:-1,multiRun:0};
  await db.exec(`select set_config('request.jwt.claim.sub','${id(1)}',false);set role authenticated`);
  await rpc('da_change_team_beverage',[id(10),uuid(),0,JSON.stringify({type:'finalize',rules:board})]);
  await rpc('da_create_scoring_competition',[id(10),id(11),id(13),'Tournament','Synthetic Archive Cup',3,3]);
  await rpc('da_create_scoring_competition',[id(10),id(11),id(14),'Tournament','Other Synthetic Cup',3,3]);
  async function start(t=id(13),kind='Tournament'){
   const snapshot=await read(),day=snapshot.games[0],gameId=uuid();
   const result=await rpc('da_start_scoring_game',[id(10),id(11),day?.game.day_id??uuid(),'2026-11-07',kind==='Tournament'?t:null,uuid(),day?.dayRevision??0,kind==='Tournament'?(await tour(t)).revision:null,JSON.stringify({type:'start',gameId,opponent:'Synthetic Opponent',kind,battingMode:'manual',lineup:[],rules:{version:'Synthetic '+gameId,fenceLimit:3,board},bands:{}})]);
   assert.equal(result.status,'accepted');return (await read()).games.find(g=>g.game.id===gameId);
  }
  const current=async(g)=>(await read()).games.find(row=>row.game.id===g.game.id);
  async function change(g,body,command=uuid(),override={}){
   const saved=await current(g);
   return rpc('da_apply_scoring_game_change',[id(10),id(11),saved.game.day_id,saved.game.id,command,saved.dayRevision,override.tournamentRevision??saved.tournamentRevision,JSON.stringify({...body,gameId:saved.game.id})]);
  }
  let game=await start();
  await change(game,{type:'score',playId:uuid(),playerId:id(101),outcome:'K',runs:0,rbi:0,firstGameBand:false});
  game=await current(game);const before=structuredClone(game),balance=structuredClone((await read()).board);
  assert.equal((await read()).capabilities.tournamentArchive,true);
  const command=uuid(),revision=(await tour()).revision;
  const accepted=await archive(id(13),command,revision,true);assert.equal(accepted.status,'accepted');assert.equal(accepted.archived,true);
  assert.equal((await archive(id(13),command,revision,true)).duplicate,true);
  await assert.rejects(()=>archive(id(13),command,revision,false),/reused/);
  assert.equal((await archive(id(13),uuid(),revision,false)).status,'conflict');
  assert.equal((await tour()).archived,true);
  assert.deepEqual((await current(game)).evaluation,before.evaluation);
  assert.deepEqual((await current(game)).rules,before.rules);
  assert.deepEqual((await read()).board,balance,'archive never erases or recomputes balances');
  for(const body of [
   {type:'score',playId:uuid(),playerId:id(101),outcome:'K',runs:0,rbi:0},
   {type:'correct',playId:before.evaluation.rows[0].id,outcome:'Out',runs:0,rbi:0,voided:false,reason:'Synthetic correction'},
   {type:'scoreboard',teamRuns:1,opponentRuns:2,inning:1,half:'Top',reason:'Synthetic scoreboard'},
   {type:'hrLimit',fenceLimit:2,reason:'Synthetic HR correction'},
   {type:'lineup',lineup:[id(101)],battingMode:'ordered',nextBatter:id(101),firstGameBands:{},reason:'Synthetic order'},
   {type:'complete'},
  ])await assert.rejects(()=>change(game,body),/archived/);
  await assert.rejects(()=>start(),/archived/);
  await assert.rejects(async()=>rpc('da_correct_tournament_band',[id(10),id(11),id(13),uuid(),(await tour()).revision,id(101),true,'Synthetic Band correction']),/archived/);
  // A stale scoring client cannot bypass the archive through a different mutation route.
  assert.deepEqual((await current(game)).evaluation,before.evaluation);
  await db.exec('reset role');
  await assert.rejects(()=>db.exec(`update public.scoring_games set team_runs=10 where id='${game.game.id}'`),/archived/);
  await db.exec('set role authenticated');
  const other=await start(id(14));const league=await start(null,'League');
  assert.equal((await change(other,{type:'score',playId:uuid(),playerId:id(101),outcome:'K',runs:0,rbi:0,firstGameBand:false})).status,'accepted');
  assert.equal((await change(league,{type:'score',playId:uuid(),playerId:id(101),outcome:'K',runs:0,rbi:0})).status,'accepted');
  const restoreId=uuid();assert.equal((await archive(id(13),restoreId,(await tour()).revision,false)).status,'accepted');
  assert.equal((await tour()).archived,false);
  assert.equal((await change(game,{type:'score',playId:uuid(),playerId:id(101),outcome:'K',runs:0,rbi:0})).status,'accepted','restored games resume without resetting history');
  const state=(await tour()).revision;
  assert.equal((await archive(id(13),command,revision,true)).duplicate,true,'late archive retry cannot rearchive a restored tournament');
  assert.equal((await tour()).revision,state);assert.equal((await tour()).archived,false);
  await rpc('da_archive_season',[id(10),id(11),true]);
  await assert.rejects(()=>archive(id(13),uuid(),state,true),/Restore the season/);
  await assert.rejects(()=>change(game,{type:'complete'}),/Archived season/);
  assert.deepEqual((await current(game)).rules,before.rules);
  await rpc('da_archive_season',[id(10),id(11),false]);
  await assert.rejects(()=>archive(id(999),uuid(),0,true),/Tournament context/);
  await assert.rejects(()=>rpc('da_archive_scoring_tournament',[id(10),id(21),id(13),uuid(),0,true]),/Season context/);
  await assert.rejects(()=>db.exec(`update public.scoring_tournaments set archived=true`),/permission denied/);
  await db.exec(`select set_config('request.jwt.claim.sub','${id(2)}',false)`);
  await assert.rejects(()=>archive(id(13),command,revision,true),/reused/);
  assert.equal((await archive(id(13),uuid(),(await tour()).revision,true)).status,'accepted','ordinary authorized members match existing season-management permissions');
  await db.exec(`reset role;update public.team_memberships set active=false where team_id='${id(10)}' and user_id='${id(2)}';set role authenticated`);
  await assert.rejects(()=>archive(id(13),uuid(),0,false),/access denied/);
  await db.exec('reset role;set role anon');await assert.rejects(()=>archive(id(13),uuid(),0,false),/permission denied/);await db.exec('reset role');
  const privileges=(await db.query(`select has_function_privilege('anon','public.da_archive_scoring_tournament(uuid,uuid,uuid,uuid,bigint,boolean)','execute') anon,has_table_privilege('authenticated','public.scoring_tournaments','update,delete') direct,(select relrowsecurity from pg_class where oid='public.scoring_tournaments'::regclass) rls`)).rows[0];assert.deepEqual(privileges,{anon:false,direct:false,rls:true});
  console.log('PASS reversible archive SQL: immutable games/rules/BEVs, restore, every scoring mutation blocked while archived, other competitions unaffected, stale/duplicate/late retry, parent season, member/revoked/anonymous/direct-write denial. Disposable database only. Extended rules '+(process.env.WITH_EXTENDED==='1'?'enabled':'not required')+'.');
 }finally{await db.close()}
})().catch(error=>{console.error(error.stack);process.exitCode=1});
