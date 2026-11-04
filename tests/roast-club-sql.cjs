// Entirely disposable PostgreSQL and synthetic identities. Never contacts Supabase.
const {PGlite} = require('@electric-sql/pglite');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
(async()=>{
 const db=new PGlite();
 try {
 // Reuse the reviewed scoring schema fixture and the real account linkage, as the Beverage test does.
 const existing=fs.readFileSync('tests/optional-lineups-sql.cjs','utf8');
 const fixture=existing.slice(existing.indexOf('await db.exec(`')+15,existing.indexOf('`);\n for(const name'));
 await db.exec(fixture.replaceAll(/\$\{id\((\d+)\)\}/g,(_,n)=>id(Number(n))));
 await db.exec(`alter table public.teams add column name text, add column created_by uuid references auth.users(id);
 alter table public.team_memberships add column is_captain boolean not null default false;
 alter table public.team_memberships alter column active set default true;
 alter table public.team_seasons add column name text, add column created_by uuid references auth.users(id);
 alter table public.team_players add column user_id uuid references auth.users(id);
 update public.team_players set user_id='${id(1)}' where id='${id(101)}';
 update public.team_players set user_id='${id(2)}' where id='${id(102)}';
 insert into public.team_memberships values('${id(10)}','${id(2)}',true);
 insert into public.team_seasons values('${id(10)}','${id(12)}',false);
 update public.team_players set user_id='${id(1)}' where id='${id(201)}';
 insert into public.team_memberships values('${id(20)}','${id(1)}',true);
 insert into auth.users values('${id(3)}');`);
 for(const name of ['20261009192021_m43_tournament_season_scoring.sql','20261009210007_tournament_games_guaranteed.sql','20261009203125_tournament_only_bands.sql','20261009224553_game_scoreboard_tournament_numbers.sql','20261009234045_competition_hr_limits.sql','20261013235234_optional_lineups.sql','20261014022554_team_beverage_rules.sql','20261104180000_roast_club_consent.sql'])
   await db.exec(fs.readFileSync('supabase/migrations/'+name,'utf8'));

 const as=async user=>{await db.exec('reset role');await db.exec(`select set_config('request.jwt.claim.sub','${user??''}',false);set role authenticated;`)};
 const admin=async sql=>{await db.exec('reset role');return db.query(sql)};
 const rpc=async(name,args)=>{const r=await db.query(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) result`,args);return r.rows[0].result};
 let seq=5000;const uuid=()=>id(++seq);
 const read=(team=id(10))=>rpc('da_read_roast_club',[team]);
 const choose=(optedIn,{team=id(10),command=uuid()}={})=>rpc('da_change_roast_club',[team,command,optedIn]);
 const count=async table=>(await admin(`select count(*)::int n from private.${table}`)).rows[0].n;

 // 1. Everyone starts opted OUT.
 await as(id(1));
 let view=await read();
 assert.deepEqual([view.canToggle,view.optedIn,view.optedInPlayerIds],[true,false,[]]);
 await as(id(2));
 view=await read();
 assert.deepEqual([view.canToggle,view.optedIn,view.optedInPlayerIds],[true,false,[]]);

 // 2. The account-linked player opts in; teammates can see only the effective opt-in list.
 await as(id(1));
 const c1=uuid();
 let result=await choose(true,{command:c1});
 assert.deepEqual([result.status,result.duplicate,result.optedIn,result.revision],['accepted',false,true,1]);
 view=await read();
 assert.deepEqual([view.optedIn,view.optedInPlayerIds],[true,[id(101)]]);
 await as(id(2));
 view=await read();
 assert.deepEqual([view.optedIn,view.optedInPlayerIds],[false,[id(101)]],'a teammate cannot opt anyone else in');

 // 3. Replays are idempotent; command ids cannot be reused with other content or by another actor.
 await as(id(1));
 result=await choose(true,{command:c1});
 assert.equal(result.duplicate,true);
 assert.equal(await count('roast_club_consent_events'),1);
 assert.equal(await count('roast_club_commands'),1);
 await as(id(1));
 await assert.rejects(()=>choose(false,{command:c1}),/command ID reused/);
 await as(id(2));
 await assert.rejects(()=>choose(true,{command:c1}),/command ID reused/);

 // 4. Each player controls only their own row.
 const c2=uuid();
 result=await choose(true,{command:c2});
 assert.equal(result.revision,1);
 view=await read();
 assert.deepEqual(view.optedInPlayerIds,[id(101),id(102)]);
 const rows=(await admin('select player_id,revision,opted_in from private.roast_club_consent_events order by player_id,revision')).rows;
 assert.deepEqual(rows,[{player_id:id(101),revision:1,opted_in:true},{player_id:id(102),revision:1,opted_in:true}]);

 // 5. Opting out takes effect immediately and the latest choice wins.
 await as(id(1));
 result=await choose(false);
 assert.deepEqual([result.optedIn,result.revision],[false,2]);
 await as(id(2));
 view=await read();
 assert.deepEqual(view.optedInPlayerIds,[id(102)],'opt-out is immediately effective for every reader');
 await as(id(1));
 await choose(true);
 result=await choose(false);
 assert.equal(result.revision,4);
 view=await read();
 assert.deepEqual([view.optedIn,view.optedInPlayerIds],[false,[id(102)]]);

 // 6. Invalid input never writes.
 await assert.rejects(()=>rpc('da_change_roast_club',[id(10),uuid(),null]),/explicitly/);
 await assert.rejects(()=>rpc('da_change_roast_club',[id(10),null,true]),/explicitly/);
 assert.equal(await count('roast_club_consent_events'),5);

 // 7. Team isolation: outsiders are denied; another team's consent is never visible.
 await as(id(3));
 await assert.rejects(()=>read(),/Team access denied/);
 await assert.rejects(()=>choose(true),/Team access denied/);
 await as(id(1));
 await choose(true);
 view=await read(id(20));
 assert.deepEqual([view.optedIn,view.optedInPlayerIds],[false,[]],'team 10 consent does not apply to team 20');
 await as(id(2));
 view=await read(id(20));
 assert.equal(view.canToggle,false,'a member without a linked player cannot toggle');
 await assert.rejects(()=>choose(true,{team:id(20)}),/account-linked player is required/);

 // 8. Guests are never effective, even if a row were inserted directly.
 await db.exec('reset role');
 await db.exec(`insert into private.roast_club_commands(team_id,command_id,actor_id,payload,response) values('${id(10)}','${id(9001)}','${id(1)}','{}','{}');
   insert into private.roast_club_consent_events(team_id,player_id,revision,opted_in,command_id) values('${id(10)}','${id(103)}',1,true,'${id(9001)}')`);
 await as(id(1));
 view=await read();
 assert.ok(!view.optedInPlayerIds.includes(id(103)),'guest consent is never effective');

 // 9. Revoked membership fails closed; the revoked account can no longer read or change anything.
 await admin(`update public.team_memberships set active=false where team_id='${id(10)}' and user_id='${id(2)}'`);
 await as(id(1));
 view=await read();
 assert.ok(!view.optedInPlayerIds.includes(id(102)),'consent of a removed member is not effective');
 await as(id(2));
 await assert.rejects(()=>read(),/Team access denied/);
 await assert.rejects(()=>choose(true),/Team access denied/);
 await admin(`update public.team_memberships set active=true where team_id='${id(10)}' and user_id='${id(2)}'`);

 // 10. Direct table access, anonymous callers and history edits are all refused.
 await as(id(1));
 for(const sql of ['select * from private.roast_club_consent_events','select * from private.roast_club_commands',`insert into private.roast_club_consent_events(team_id,player_id,revision,opted_in,command_id) values('${id(10)}','${id(101)}',99,true,'${id(9001)}')`,'update private.roast_club_consent_events set opted_in=true','delete from private.roast_club_consent_events'])
   await assert.rejects(()=>db.exec(sql),/permission denied/);
 await db.exec('reset role');
 await db.exec(`select set_config('request.jwt.claim.sub','',false);set role anon`);
 await assert.rejects(()=>read(),/permission denied/);
 await assert.rejects(()=>choose(true),/permission denied/);
 await db.exec('reset role');
 await assert.rejects(()=>db.exec('update private.roast_club_consent_events set opted_in=not opted_in'));
 await assert.rejects(()=>db.exec('delete from private.roast_club_consent_events'));
 await assert.rejects(()=>db.exec('update private.roast_club_commands set payload=payload'));
 await assert.rejects(()=>db.exec('delete from private.roast_club_commands'));

 // 11. Independent from Beverage Board participation, in both directions.
 await as(id(1));
 const beverage=()=>rpc('da_read_team_beverage',[id(10)]);
 assert.equal((await beverage()).participating,true);
 await choose(false);
 assert.equal((await beverage()).participating,true,'a Roast Club choice never changes Beverage participation');
 const before=await read();
 const bev=await beverage();
 result=await rpc('da_change_team_beverage',[id(10),uuid(),bev.revision,JSON.stringify({type:'participation',participating:false})]);
 assert.equal(result.status,'accepted');
 assert.equal((await beverage()).participating,false);
 assert.deepEqual((await read()).optedInPlayerIds,before.optedInPlayerIds,'a Beverage choice never changes Roast Club consent');
 await choose(true);
 assert.equal((await beverage()).participating,false,'opting in to Roast Club does not restore Beverage participation');
 console.log('Roast Club consent SQL checks passed');
 } finally { await db.close(); }
})().catch(error=>{console.error(error);process.exit(1)});
