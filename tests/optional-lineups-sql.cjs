// Optional-lineup proposal in disposable PostgreSQL. No live records or auth sessions.
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
(async()=>{
 const db=new PGlite();
 try {
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema private;
 create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,private to authenticated;
 create table public.teams(id uuid primary key);
 create table public.team_seasons(team_id uuid references public.teams(id),id uuid primary key,archived boolean default false,unique(team_id,id));
 create table public.team_players(team_id uuid references public.teams(id),id uuid primary key,display_name text,is_guest boolean,unique(team_id,id));
 create table public.team_memberships(team_id uuid,user_id uuid,active boolean,primary key(team_id,user_id));
 create table private.audit_events(id bigint generated always as identity primary key,team_id uuid,actor_id uuid references auth.users(id),operation text,entity_id uuid,created_at timestamptz default now());
 create function private.is_member(p_team uuid) returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and exists(select 1 from public.team_memberships m where m.team_id=p_team and m.user_id=auth.uid() and m.active)$$;
 revoke all on function private.is_member(uuid) from public,anon;grant execute on function private.is_member(uuid) to authenticated;
 grant select on public.team_players,public.team_seasons to authenticated;
 insert into auth.users values('${id(1)}'),('${id(2)}');insert into public.teams values('${id(10)}'),('${id(20)}');
 insert into public.team_seasons values('${id(10)}','${id(11)}',false),('${id(20)}','${id(21)}',false);
 insert into public.team_memberships values('${id(10)}','${id(1)}',true),('${id(20)}','${id(2)}',true);
 insert into public.team_players values('${id(10)}','${id(101)}','Synthetic Alex',false),('${id(10)}','${id(102)}','Synthetic Morgan',false),('${id(10)}','${id(103)}','Synthetic Guest',true),('${id(20)}','${id(201)}','Other Synthetic Player',false);`);
 for(const name of ['20261009192021_m43_tournament_season_scoring.sql','20261009210007_tournament_games_guaranteed.sql','20261009203125_tournament_only_bands.sql','20261009224553_game_scoreboard_tournament_numbers.sql','20261009234045_competition_hr_limits.sql']) await db.exec(fs.readFileSync('supabase/migrations/'+name,'utf8'));
 const baseline=await db.query("select proname,md5(pg_get_functiondef(oid)) hash from pg_proc where pronamespace='private'::regnamespace and proname in ('apply_scoring_game_change','start_scoring_game','read_scoring_season') order by proname");
 assert.deepEqual(baseline.rows.map(r=>r.hash),['d6f883359209cb7b1bb7b73e094ff549','d84cfeb15f9422dd5555a9e8cd78da0b','4756d36b59d1c47df7c7ebabba59de8b'],'Disposable definitions must match the reviewed live schema hashes');
 await db.exec(fs.readFileSync('supabase/migrations/20261013235234_optional_lineups.sql','utf8'));
 await db.exec(`select set_config('request.jwt.claim.sub','${id(1)}',false);set role authenticated;`);
 const rpc=async(name,args)=>{const r=await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args);return r.rows[0].result};
 const read=()=>rpc('da_read_scoring_season',[id(10),id(11),'Overall']);
 const board={strikeout:1,solo:1,bandSolo:-1,grandSlam:-1,overLimit:1,insidePark:-1,multiRun:0};
 let seq=1000;const uuid=()=>id(++seq);
 await rpc('da_create_scoring_competition',[id(10),id(11),id(13),'Tournament','Synthetic Manual Cup',2,2]);
 const start=async({mode='manual',lineup=[],date='2026-10-13',game=uuid(),day=uuid(),bands={},kind='Tournament'}={})=>{
  const view=await read(),existing=view.games.find(g=>g.playedOn===date),t=view.tournaments.find(t=>t.id===id(13));
  const result=await rpc('da_start_scoring_game',[id(10),id(11),existing?.game.day_id||day,date,kind==='Tournament'?id(13):null,uuid(),existing?.dayRevision||0,kind==='Tournament'?t.revision:null,JSON.stringify({type:'start',gameId:game,opponent:'Synthetic opponent',kind,...(mode===null?{}:{battingMode:mode}),lineup,rules:{version:'Synthetic '+game,fenceLimit:2,board},bands})]);
  assert.equal(result.status,'accepted');return (await read()).games.find(g=>g.game.id===game);
 };
 const change=async(g,cmd,command=uuid(),revision=g.dayRevision,tRevision=g.tournamentRevision)=>rpc('da_apply_scoring_game_change',[id(10),id(11),g.game.day_id,g.game.id,command,revision,tRevision,JSON.stringify({...cmd,gameId:g.game.id})]);
 const latest=async(g)=>(await read()).games.find(x=>x.game.id===g.game.id);
 await assert.rejects(()=>start({mode:'wrong'}),/Invalid batting mode/);
 await assert.rejects(()=>start({mode:'ordered',lineup:[]}),/lineup/i);
 const legacy=await start({mode:null,lineup:[id(101)],bands:{[id(101)]:false},kind:'League',date:'2026-10-11'});assert.equal(legacy.game.batting_mode,'ordered');
 let game=await start();assert.deepEqual(game.lineup,[]);assert.equal(game.game.batting_mode,'manual');assert.equal((await read()).capabilities.manualBatting,true);
 await assert.rejects(()=>change(game,{type:'score',playId:uuid(),playerId:id(102),outcome:'Hit',runs:0,rbi:0}),/Choose Band or no Band/);
 const command=uuid(),play=uuid(),request={type:'score',playId:play,playerId:id(102),outcome:'Fence HR',runs:1,rbi:1,firstGameBand:true};
 assert.equal((await change(game,request,command)).status,'accepted');
 assert.equal((await change(game,request,command)).duplicate,true);
 await assert.rejects(()=>change(game,{...request,runs:2,rbi:2},command),/Command ID reused/);
 game=await latest(game);assert.equal(game.evaluation.rows.length,1);assert.equal(game.evaluation.rows[0].delta,-1);assert.deepEqual(game.lineup,[]);assert.equal(game.game.next_batter_position,0);
 await assert.rejects(()=>change(game,{...request,playId:uuid()}),/assignment stays fixed/);
 assert.equal((await change(game,{type:'score',playId:uuid(),playerId:id(101),outcome:'Hit',runs:2,rbi:2,firstGameBand:false})).status,'accepted');
 game=await latest(game);assert.equal((await change(game,{type:'score',playId:uuid(),playerId:id(102),outcome:'Fence HR',runs:1,rbi:1})).status,'accepted');
 game=await latest(game);assert.equal(game.evaluation.fenceUsed,2);
 assert.equal((await change(game,{type:'score',playId:uuid(),playerId:id(102),outcome:'Fence HR',runs:1,rbi:1})).status,'accepted');
 game=await latest(game);assert.equal(game.evaluation.rows.at(-1).official,'OLHR');assert.equal(game.evaluation.rows.at(-1).runs,1); // original input retained; effective totals replay separately
 assert.equal((await change(game,{type:'score',playId:uuid(),playerId:id(103),outcome:'BB',runs:0,rbi:0,firstGameBand:false})).status,'accepted');
 game=await latest(game);await assert.rejects(()=>change(game,{type:'score',playId:uuid(),playerId:id(201),outcome:'Hit',runs:0,rbi:0}),/Player context unavailable/);
 const stale=game;assert.equal((await change(game,{type:'score',playId:uuid(),playerId:id(101),outcome:'Out',runs:0,rbi:0})).status,'accepted');
 assert.equal((await change(stale,{type:'score',playId:uuid(),playerId:id(101),outcome:'Hit',runs:0,rbi:0})).status,'conflict');
 game=await latest(game);assert.deepEqual(game.lineup,[]);
 const second=await start({date:'2026-10-14'});assert.equal(second.game.tournament_game_number,2);assert.equal(second.rules.fence_limit,2);
 assert.equal((await change(second,{type:'score',playId:uuid(),playerId:id(102),outcome:'Fence HR',runs:1,rbi:1})).status,'accepted');
 const secondRead=await latest(second);assert.equal(secondRead.evaluation.fenceUsed,1);assert.equal(secondRead.evaluation.rows[0].delta,-1);
 const historical=await start({date:'2026-10-12'});await assert.rejects(()=>change(historical,{type:'score',playId:uuid(),playerId:id(102),outcome:'Hit',runs:0,rbi:0}),/Historical first participation/);
 game=await latest(game);await assert.rejects(()=>change(game,{type:'lineup',lineup:[id(101),id(102)],battingMode:'ordered'}),/Reason required/);
 assert.equal((await change(game,{type:'lineup',lineup:[id(101),id(102)],battingMode:'ordered',reason:'Synthetic coach order',nextBatter:id(101),firstGameBands:{}})).status,'accepted');
 game=await latest(game);assert.equal(game.game.batting_mode,'ordered');await assert.rejects(()=>change(game,{type:'score',playId:uuid(),playerId:id(102),outcome:'Hit',runs:0,rbi:0}),/Next batter changed/);
 assert.equal((await change(game,{type:'score',playId:uuid(),playerId:id(101),outcome:'Hit',runs:0,rbi:0})).status,'accepted');
 game=await latest(game);assert.equal(game.game.next_batter_position,1);
 await change(game,{type:'lineup',lineup:[],battingMode:'manual',reason:'Synthetic return to manual',firstGameBands:{}});game=await latest(game);assert.equal(game.game.batting_mode,'manual');
 await change(game,{type:'complete'});game=await latest(game);await assert.rejects(()=>change(game,{type:'score',playId:uuid(),playerId:id(101),outcome:'Hit',runs:0,rbi:0}),/Game complete/);
 await change(game,{type:'correct',playId:play,playerId:id(102),outcome:'Hit',runs:0,rbi:0,voided:false,reason:'Synthetic completed correction'});
 // A guarantee is a minimum: the actual RPC accepts nine games in one tournament/day.
 const longCup=uuid(),longDay=uuid();await rpc('da_create_scoring_competition',[id(10),id(11),longCup,'Tournament','Synthetic Nine Game Cup',2,2]);
 for(let number=1;number<=9;number++){
  const current=await read(),cup=current.tournaments.find(t=>t.id===longCup),day=current.games.find(g=>g.playedOn==='2026-10-20');
  const result=await rpc('da_start_scoring_game',[id(10),id(11),day?.game.day_id||longDay,'2026-10-20',longCup,uuid(),day?.dayRevision||0,cup.revision,JSON.stringify({type:'start',gameId:uuid(),opponent:'Synthetic opponent '+number,kind:'Tournament',battingMode:'manual',lineup:[],rules:{version:'Synthetic same-day game '+number,fenceLimit:2,board},bands:{}})]);
  assert.equal(result.status,'accepted');
 }
 const longGames=(await read()).games.filter(g=>g.game.tournament_id===longCup);
 assert.deepEqual(longGames.map(g=>g.game.tournament_game_number).sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9]);assert.equal(longGames.every(g=>g.playedOn==='2026-10-20'),true);
 await db.exec(`select set_config('request.jwt.claim.sub','${id(2)}',false);`);await assert.rejects(read,/Team access denied/);
 await db.exec(`select set_config('request.jwt.claim.sub','${id(1)}',false);`);
 await assert.rejects(()=>rpc('da_read_scoring_season',[id(10),id(21),'Overall']),/Season context/);
 await db.exec(`reset role;update public.team_seasons set archived=true where id='${id(11)}';set role authenticated;`);
 await assert.rejects(()=>change(game,{type:'score',playId:uuid(),playerId:id(101),outcome:'Hit',runs:0,rbi:0}),/Archived season/);
 await db.exec(`reset role;`);
 const permissions=await db.query("select has_table_privilege('authenticated','public.scoring_games','INSERT') ins,has_table_privilege('authenticated','public.scoring_games','UPDATE') upd,has_function_privilege('anon','public.da_apply_scoring_game_change(uuid,uuid,uuid,uuid,uuid,bigint,bigint,jsonb)','EXECUTE') anon");assert.deepEqual(permissions.rows[0],{ins:false,upd:false,anon:false});
 console.log('PASS optional-lineup SQL: reviewed live-definition hashes, empty manual order, arbitrary/repeated scoped players and guests, atomic first Bands, retries/fingerprints/conflicts, unchanged HR/credit/replay, Game 2 reset/Bands, historical denial, audited mode changes, ordered advancement, completed corrections, cross-team denial and unchanged grants. Disposable synthetic PostgreSQL only.');
 }finally{await db.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
