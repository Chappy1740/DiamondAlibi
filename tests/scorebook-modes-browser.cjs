// Actual scorebook layout using an authorized, synthetic season snapshot.
const { chromium, webkit } = require("playwright");
const esbuild = require("esbuild");
const fs = require("node:fs");
const http = require("node:http");
const assert = require("node:assert/strict");
(async () => {
  let browser,server;
  const errors=[];
  try {
    const bundle=await esbuild.build({stdin:{resolveDir:process.cwd(),loader:"tsx",contents:`
      import React from 'react';import{createRoot}from'react-dom/client';import{ConnectedScorebook}from'./src/components/connected-scorebook';import{DEFAULT_BOARD,EXTENDED_BOARD,evaluateGame}from'./src/lib/scoring';import ScorePage from'./src/app/club/score/page';import{CompetitionPage}from'./src/components/competition-page';import{emptyTotals}from'./src/lib/scoring';import{BottomNavigationView}from'./src/components/bottom-navigation';
      const rules={version_label:'Synthetic rules',fence_limit:9,strikeout:DEFAULT_BOARD.strikeout,solo:DEFAULT_BOARD.solo,band_solo:DEFAULT_BOARD.bandSolo,grand_slam:DEFAULT_BOARD.grandSlam,over_limit:DEFAULT_BOARD.overLimit,inside_park:DEFAULT_BOARD.insidePark,multi_run:DEFAULT_BOARD.multiRun};
      const g=(id,kind,competition,opponent)=>({game:{id,kind,league_id:kind==='League'?competition:null,tournament_id:kind==='Tournament'?competition:null,day_id:'synthetic-day',opponent,completed:false,next_batter_position:0},playedOn:'2026-10-13',dayRevision:1,tournamentRevision:kind==='Tournament'?1:null,lineup:['synthetic-player'],rules,evaluation:{rows:[],fenceUsed:0,totals:{}}});
      const data={archived:false,roster:[{id:'synthetic-player',display_name:'Synthetic Player',is_guest:false}],bands:[{player_id:'synthetic-player',tournament_id:'synthetic-cup',has_band:true}],participation:[],leagueBands:[],snapshot:{teamId:'synthetic-team',seasonId:'synthetic-season',scope:'Overall',totals:{},board:{'synthetic-player':-2},leagues:[{id:'synthetic-league',name:'Synthetic league',fenceLimit:0},{id:'other-league',name:'Other synthetic league',fenceLimit:5}],tournaments:[{id:'synthetic-cup',name:'M3-5 Synthetic Cup',revision:1,fenceLimit:2,guaranteedGames:2}],games:[g('league-game','League','synthetic-league','League opponent'),g('other-game','League','other-league','Other opponent'),g('cup-game','Tournament','synthetic-cup','Cup opponent')]}};
      const query=new URLSearchParams(location.search);window.__writes=[];window.__reloads=0;window.__writeResult='invalid';window.__reloadStatus='ok';
      const footer=document.createElement('div');document.body.append(footer);createRoot(footer).render(<BottomNavigationView pathname={query.has('leaderboard')?'/tournaments/synthetic-cup':'/club/score'} context='team=synthetic-team&season=synthetic-season'/>);
      if(query.has('extended'))Object.assign(rules,{strikeout_looking:2,strikeout_swinging:2,strikeout_foul:1,double_play:1});
      if(query.has('empty')){data.snapshot.games=data.snapshot.games.filter(g=>!g.game.tournament_id);data.bands=[];}
      if(query.has('team-beverage')){data.snapshot.capabilities={manualBatting:true,teamBeverage:true};data.snapshot.beverage={teamId:'synthetic-team',revision:1,finalized:!query.has('unfinalized'),rules:query.has('unfinalized')?null:{...DEFAULT_BOARD,solo:2},canToggle:true,participating:true};}
      if(query.has('manual')){data.snapshot.capabilities={manualBatting:true};data.roster.push({id:'adam-player',display_name:'Adam Jones',is_guest:false});data.snapshot.games.forEach(game=>{game.game.batting_mode='manual';game.lineup=[];});if(query.has('first-band'))data.bands=[];}
      if(query.has('full-roster'))data.roster.push(...Array.from({length:9},(_,i)=>({id:'roster-player-'+(i+3),display_name:'Roster Player '+(i+3),is_guest:false})));
      data.snapshot.capabilities={...data.snapshot.capabilities,hitTypes:!query.has('legacy-hits')};
      if(query.has('voice'))window.SpeechRecognition=class{start(){window.__recognition=this;}stop(){}abort(){window.__aborted=true;}};
      if(query.has('tournament-archived'))data.snapshot.tournaments[0].archived=true;
      if(query.has('start-time')){Object.assign(data.snapshot.tournaments[0],{firstGameTime:'08:00',firstGameZone:'America/Chicago'});data.snapshot.capabilities={...data.snapshot.capabilities,tournamentStartTime:true};const first=data.snapshot.games.find(g=>g.game.id==='cup-game');if(first)first.game.tournament_game_number=query.has('next-time')?2:1;}
      if(query.has('completed'))data.snapshot.games.forEach(g=>g.game.completed=true);if(query.has('archived'))data.archived=true;
      window.__fixture=data;window.__audit=[{action:'hrLimit',reason:'Tournament game history',after:{game:{id:'cup-game'},fenceLimit:2}},{action:'hrLimit',reason:'League game history',after:{game:{id:'league-game'},fenceLimit:0}},{action:'band',tournamentId:'synthetic-cup',reason:'Cup Band history',before:true,after:false},{action:'start',reason:'Other game history',after:{gameId:'other-game'}}];
      if(query.has('leaderboard')){
        data.roster.push({id:'other-player',display_name:'Synthetic Blair with a very long roster nickname',is_guest:true});
        const cupGame=data.snapshot.games.find(g=>g.game.id==='cup-game');cupGame.evaluation.totals={'synthetic-player':{...emptyTotals(),PA:3,AB:3,H:2,HR:1,RBI:1,board:-1},'other-player':{...emptyTotals(),PA:3,AB:3,H:2,HR:0,RBI:2,board:2}};
        data.snapshot.games.find(g=>g.game.id==='league-game').evaluation.totals={'synthetic-player':{...emptyTotals(),PA:99,H:99,HR:99,RBI:99,board:50}};
        if(query.has('new-leaders'))cupGame.evaluation=evaluateGame({id:'cup-game',opponent:'Synthetic',kind:'Tournament',lineup:['synthetic-player','other-player'],next:0,complete:false,rules:{version:'Synthetic expanded',fenceLimit:3,board:EXTENDED_BOARD},plays:[['synthetic-player','K Looking'],['synthetic-player','K Looking'],['synthetic-player','K Swinging'],['synthetic-player','DP'],['other-player','SOFO'],['other-player','SOFO'],['other-player','DP'],['other-player','DP']].map(([playerId,outcome],i)=>({id:String(i),playerId,outcome,runs:0,rbi:0,voided:false}))},[]);
        if(query.has('hit-leaders'))cupGame.evaluation=evaluateGame({id:'cup-game',opponent:'Synthetic',kind:'Tournament',lineup:['synthetic-player','other-player'],next:0,complete:false,rules:{version:'Synthetic hits',fenceLimit:3,board:DEFAULT_BOARD},plays:[['synthetic-player','2B'],['synthetic-player','2B'],['synthetic-player','3B'],['other-player','1B'],['other-player','3B'],['other-player','3B']].map(([playerId,outcome],i)=>({id:String(i),playerId,outcome,runs:0,rbi:0,voided:false}))},[]);
        if(query.has('nine-games')){data.snapshot.games=data.snapshot.games.filter(g=>g.game.kind==='League').concat(Array.from({length:9},(_,i)=>({...structuredClone(cupGame),game:{...cupGame.game,id:'cup-game-'+i,tournament_game_number:i+1}})));}
        createRoot(document.getElementById('app')).render(<CompetitionPage kind={query.has('league-page')?'League':'Tournament'} id={query.has('league-page')?'synthetic-league':'synthetic-cup'} data={{route:'tournaments',sample:false,userId:'synthetic-user',teams:[{id:'synthetic-team',name:'Synthetic Team'}],seasons:[{id:'synthetic-season',name:'Synthetic Season',archived:false}],teamId:'synthetic-team',seasonId:'synthetic-season',scope:'Overall',loaded:data}}/>);
      }else if(query.has('page')) ScorePage({searchParams:Promise.resolve({setup:query.has('scoring-page')||query.has('manage-page')?undefined:'1',manage:query.has('manage-page')?'1':undefined,game:query.has('manage-page')?(query.get('game')||'cup-game'):query.has('scoring-page')?'cup-game':undefined,tournament:query.get('tournament')||undefined,league:query.get('league')||undefined})}).then(ui=>createRoot(document.getElementById('app')).render(ui));
      else
      createRoot(document.getElementById('app')).render(<main className="connected-wrap"><h1>Synthetic scorebook</h1><ConnectedScorebook storageKey="synthetic.mode-test" teamId="synthetic-team" seasonId="synthetic-season" initial={{status:'ok',data}} mode={query.get('mode')||'score'} initialGameId={query.get('game')||''} initialLeagueId={query.get('league')||''} initialTournamentId={query.get('tournament')||''} submitAction={async(input)=>{window.__writes.push(input);return query.has('quick')?{status:'ok',data:{status:'ok'}}:{status:'invalid'}}} reloadAction={async()=>{window.__reloads++;return{status:'ok',data:structuredClone(data)}}}/></main>);
    `},bundle:true,write:false,platform:"browser",jsx:"automatic",plugins:[{name:"synthetic-page-context",setup(build){
      build.onResolve({filter:/^(next\/(headers|navigation|link|image)|@\/lib\/supabase\/server|@\/app\/(club\/scoring-actions|login\/actions))$/},args=>({path:args.path,namespace:"synthetic"}));
      build.onLoad({filter:/.*/,namespace:"synthetic"},args=>({loader:"tsx",resolveDir:process.cwd(),contents:
        args.path === "next/headers" ? "export async function cookies(){return {get(){return undefined}}}" :
        args.path === "next/navigation" ? "export function redirect(path){throw Error('Synthetic redirect: '+path)};export function useRouter(){return{push(){},refresh(){}}};export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);" :
        args.path === "next/link" ? "import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}" :
        args.path === "next/image" ? "import React from 'react';export default function Image({unoptimized,...props}){return <img {...props}/>}" :
        args.path === "@/app/login/actions" ? "export async function signout(){}" :
        args.path === "@/lib/supabase/server" ? "export async function supabaseServer(){return {auth:{getUser:async()=>({data:{user:{id:'synthetic-user'}},error:null})},from:(table)=>({select(){return this},eq(){return this},order(){return Promise.resolve({data:table==='teams'?[{id:'synthetic-team',name:'M3-5 Synthetic Test'}]:[{id:'synthetic-season',name:'M3-5 Synthetic Season',archived:false}]})}})}}" :
        "export async function loadScorebook(){return window.__reloadStatus==='ok'?{status:'ok',data:window.__fixture}:{status:window.__reloadStatus}};export async function scoringAction(input){window.__writes.push(input);if(input.type==='audit')return{status:'ok',data:{events:window.__audit,nextCursor:null}};return{status:window.__writeResult,commandId:input.commandId}}"
      }));
    }}]});
    const css=fs.readFileSync("src/app/globals.css","utf8");
    server=http.createServer((req,res)=>{if(req.url==="/brand/diamond-alibi-icon-64.png"){res.setHeader("content-type","image/png");res.end(fs.readFileSync("public/brand/diamond-alibi-icon-64.png"));return;}res.setHeader("content-type",req.url==="/bundle.js"?"text/javascript":"text/html");res.end(req.url==="/bundle.js"?bundle.outputFiles[0].text:`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic mode validation</title><style>${css}</style></head><body><div id="app"></div><script src="/bundle.js"></script></body></html>`);});
    await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
    const base=`http://127.0.0.1:${server.address().port}`;
    const engine=process.env.BROWSER_ENGINE === "webkit" ? webkit : chromium;
    browser=await engine.launch({headless:true,...(engine === chromium && process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
    const page=await browser.newPage({viewport:{width:390,height:844},...(engine === webkit ? {isMobile:true,hasTouch:true} : {})});page.on("pageerror",error=>errors.push(error.message));
    await page.addInitScript(()=>{
      window.__polls=new Map();let id=-1000;
      const original=window.setInterval,clear=window.clearInterval;
      window.setInterval=(fn,delay,...args)=>{if(delay!==15000)return original(fn,delay,...args);window.__polls.set(--id,fn);return id};
      window.clearInterval=timer=>{if(!window.__polls.delete(timer))clear(timer)};
    });
    // A saved venue-local opener time is shown in scoring/details, never copied to Game 2.
    for(const mode of ['score','manage']){
      await page.goto(base+'/?mode='+mode+'&game=cup-game&start-time');
      await page.getByText('Scheduled start: 8:00 AM Central',{exact:true}).waitFor();
      assert.equal(await page.evaluate(()=>window.__writes.length),0);
    }
    await page.goto(base+'/?mode=score&game=cup-game&start-time&next-time');
    assert.equal(await page.getByText('Scheduled start: 8:00 AM Central',{exact:true}).count(),0);
    await page.goto(base+'/?mode=setup&tournament=synthetic-cup&empty&manual&start-time');
    await page.getByRole('link',{name:'Set start time in Tournament settings',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.__writes.length),0);
    // Controlled polling: exercise real effects without waiting for wall-clock intervals.
    for(const query of ['mode=setup','mode=manage&game=league-game','mode=score&game=league-game&completed=1','mode=full&game=league-game&archived=1','mode=score&game=missing']){
      await page.goto(base+'/?'+query);await page.locator('.team-scorebook').waitFor();
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      assert.equal(await page.evaluate(()=>window.__polls.size),0,'No polling: '+query);
    }
    await page.goto(base+'/?mode=score&game=league-game');
    await page.waitForFunction(()=>window.__polls.size===1);
    await page.evaluate(()=>{for(const tick of window.__polls.values()){tick();tick()}});
    await page.waitForFunction(()=>window.__reloads===1 && !document.querySelector('.batting-outcomes button').disabled);
    assert.equal(await page.evaluate(()=>window.__reloads),1,'Concurrent refreshes share the save/read lock');
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));for(const tick of window.__polls.values())tick()});
    assert.equal(await page.evaluate(()=>window.__reloads),1,'Hidden game does not poll');
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'))});
    await page.waitForFunction(()=>window.__reloads===2 && !document.querySelector('.batting-outcomes button').disabled);
    await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,value:false});window.dispatchEvent(new Event('offline'));for(const tick of window.__polls.values())tick()});
    assert.equal(await page.evaluate(()=>window.__reloads),2,'Offline game does not poll');
    await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,value:true});window.dispatchEvent(new Event('online'))});
    await page.waitForFunction(()=>window.__reloads===3 && !document.querySelector('.batting-outcomes button').disabled);
    await page.evaluate(()=>{window.__fixture.snapshot.games.find(g=>g.game.id==='league-game').game.completed=true;for(const tick of window.__polls.values())tick()});
    await page.waitForFunction(()=>window.__polls.size===0);
    assert.equal(await page.evaluate(()=>window.__writes.length),0,'Read updates never record a play');
    // Actual tournament page: player leaderboard excludes league totals and
    // repeated dates, supports tied ranks, readable names and ninth-game Add.
    await page.goto(`${base}/?leaderboard=1`);
    const leaders=page.getByRole('region',{name:'Tournament player leaderboard',exact:true});await leaders.waitFor();
    assert.equal(await leaders.locator('.leaderboard-summary button').count(),9);
    assert.deepEqual((await leaders.locator('.leaderboard-summary button:not(:disabled) .leaderboard-player strong').allTextContents()).slice(0,5),['2 tied','2 tied','Synthetic Player','Synthetic Blair with a very long roster nickname','Synthetic Blair with a very long roster nickname']);
    assert.deepEqual((await leaders.locator('.leaderboard-summary .leaderboard-counts strong').allTextContents()).slice(0,5),['.667','2','1','2','2']);
    assert.equal(await leaders.locator('.leaderboard-players').count(),0,'leaders first, not the full ranking');
    async function onlyMetric(label,values){
      await leaders.getByRole('button',{name:'View '+label+' rankings',exact:true}).click();
      await leaders.getByRole('heading',{name:label+' rankings',exact:true}).waitFor();
      assert.equal(await leaders.getByRole('button',{name:'← Back to leaders',exact:true}).evaluate(el=>el===document.activeElement),true);
      assert.equal(await leaders.locator('.leaderboard-summary').count(),0);
      assert.deepEqual(await leaders.locator('.leaderboard-counts strong').allTextContents(),values);
      assert.equal(await leaders.locator('.leaderboard-counts > span').count(),2,'one selected statistic per player');
      assert.equal(await leaders.locator('.leaderboard-player .micro').count(),0,'no unrelated PA/OBP statistics');
      for(const text of await leaders.locator('.leaderboard-counts').allTextContents())assert(text.includes(label));
      assert.equal(await leaders.locator('.leaderboard-beverage').count(),label==='Beverages'?2:0);
    }
    async function back(label){
      await leaders.getByRole('button',{name:'← Back to leaders',exact:true}).click();
      assert.equal(await leaders.getByRole('button',{name:'View '+label+' rankings',exact:true}).evaluate(el=>el===document.activeElement),true);
    }
    await onlyMetric('OBP%',['.667','.667']);
    assert.deepEqual(await leaders.locator('.leaderboard-rank').allTextContents(),['1','1']);
    await back('OBP%');await onlyMetric('Hits',['2','2']);
    await back('Hits');await onlyMetric('HR',['1','0']);
    assert.equal(await leaders.locator('.leaderboard-player strong').first().textContent(),'Synthetic Player');
    await back('HR');await onlyMetric('RBI',['2','1']);
    assert.match(await leaders.locator('.leaderboard-player strong').first().textContent(),/Synthetic Blair/);
    await back('RBI');await onlyMetric('Beverages',['2','-1']);
    assert.deepEqual(await leaders.locator('.leaderboard-beverage').evaluateAll(cells=>cells.map(cell=>cell.getAttribute('aria-label'))),['Beverage: 2 owed','Beverage: 1 in credit']);
    assert.deepEqual(await leaders.locator('.leaderboard-rank').allTextContents(),['1','2']);
    await leaders.getByText('Most owed first',{exact:false}).waitFor();
    await back('Beverages');
    assert.equal(await page.locator('.tournament-date').textContent(),'2026-10-13');
    assert.equal(await page.locator('.page-heading .eyebrow').textContent().then(t=>t.includes('2026-10-13')),false);
    if(process.env.TOURNAMENT_SCREENSHOT)await page.screenshot({path:process.env.TOURNAMENT_SCREENSHOT,fullPage:true});
    for(const width of [320,390,430,800,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.equal(await leaders.getByRole('button').evaluateAll(buttons=>buttons.every(button=>button.getBoundingClientRect().height>=44&&button.getBoundingClientRect().width>=44)),true);}
    await page.goto(`${base}/?leaderboard=1&nine-games=1`);
    await page.getByRole('link',{name:'Add Game 10',exact:true}).waitFor();
    assert.equal(await page.locator('.game-entry-list .game-entry-row').count(),9);
    await page.goto(`${base}/?leaderboard=1&league-page=1`);
    await page.getByRole('heading',{name:'Synthetic league',exact:true}).waitFor();
    assert.equal(await page.getByRole('region',{name:'Tournament player leaderboard',exact:true}).count(),0);
    await page.setViewportSize({width:390,height:844});
    // Every roster player can be selected directly, including beyond the old six shortcuts.
    await page.goto(`${base}/?mode=score&quick=1&manual=1&full-roster=1&game=league-game`);
    const rosterPicker=page.getByRole('group',{name:'Choose batting player',exact:true});
    await rosterPicker.waitFor();
    assert.equal(await rosterPicker.getByRole('button').count(),11,'The full roster is shown without searching');
    for(const width of [320,390]){
      await page.setViewportSize({width,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Full roster fits phone width');
      assert(await rosterPicker.getByRole('button').evaluateAll(buttons=>buttons.every(button=>{const r=button.getBoundingClientRect();return r.width>=44&&r.height>=44&&button.scrollWidth<=button.clientWidth;})),'Every roster player has a readable touch target');
    }
    if(process.env.FULL_ROSTER_SCREENSHOT)await page.locator('.manual-batter').screenshot({path:process.env.FULL_ROSTER_SCREENSHOT});
    await rosterPicker.getByRole('button',{name:'Roster Player 11',exact:true}).click();
    assert.equal(await rosterPicker.getByRole('button').count(),11,'Selecting a batter keeps the full roster available');
    assert.equal(await rosterPicker.getByRole('button',{name:'Roster Player 11',exact:true}).getAttribute('aria-pressed'),'true');
    await rosterPicker.getByRole('button',{name:'Synthetic Player',exact:true}).click();
    assert.equal(await rosterPicker.getByRole('button',{name:'Synthetic Player',exact:true}).getAttribute('aria-pressed'),'true');
    assert.equal(await rosterPicker.getByRole('button',{name:'Roster Player 11',exact:true}).getAttribute('aria-pressed'),'false');
    await page.getByLabel('Find player',{exact:true}).fill('player 11');
    assert.deepEqual(await rosterPicker.getByRole('button').allTextContents(),['Roster Player 11'],'Optional search still filters the full roster');
    await page.getByLabel('Find player',{exact:true}).fill('');
    assert.equal(await rosterPicker.getByRole('button').count(),11,'Clearing search restores everyone');
    assert.equal(await page.evaluate(()=>window.__writes.length),0,'Choosing/searching players never records a play');
    await rosterPicker.getByRole('button',{name:'Roster Player 11',exact:true}).click();
    await page.getByRole('button',{name:'Single',exact:true}).click();
    await page.getByText('Saved to the team scorebook.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.__writes[0].change.playerId),'roster-player-11','A player past the former limit receives their own play');
    assert.equal(await rosterPicker.getByRole('button').count(),11,'The roster remains available after saving');
    // Quick taps and typed/native voice contracts; all writes remain local synthetic mocks.
    await page.goto(`${base}/?mode=score&quick=1&game=league-game`);
    await page.getByRole("group",{name:"Batting outcome",exact:true}).waitFor();
    await page.getByRole("button",{name:"Single",exact:true}).click();
    await page.getByText("Saved to the team scorebook.",{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.__writes.length),1);
    await page.getByRole("button",{name:"2 RBI",exact:true}).click();
    await page.getByRole("button",{name:"Fence home run",exact:true}).click();
    await page.waitForFunction(()=>window.__writes.length===2 && !document.querySelector('.batting-outcomes button').disabled);
    assert.deepEqual(await page.evaluate(()=>{const c=window.__writes[1].change;return[c.playerId,c.outcome,c.runs,c.rbi]}),['synthetic-player','Fence HR',2,2]);
    assert.equal(await page.locator('input[name="at-bat-rbi"]').inputValue(),'0');
    // Explicit hit types are real save payloads, with the usual RBI handling and no HBP choice.
    for (const width of [320,390]) {
      await page.setViewportSize({width,height:844});
      const hits=page.getByRole('group',{name:'Hits',exact:true});
      assert.deepEqual(await hits.locator('strong').allTextContents(),['1B','2B','3B','HR','ITP HR']);
      assert.equal(await page.getByRole('button',{name:'Hit by pitch',exact:true}).count(),0);
      assert(await hits.getByRole('button').evaluateAll(buttons=>buttons.every(button=>{const r=button.getBoundingClientRect();return r.width>=44&&r.height>=44&&button.scrollWidth<=button.clientWidth;})));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    }
    if(process.env.HIT_TYPES_SCREENSHOT)await page.locator('.batting-outcomes').screenshot({path:process.env.HIT_TYPES_SCREENSHOT});
    for(const [name,value] of [['Double','2B'],['Triple','3B']]){
      const before=await page.evaluate(()=>window.__writes.length);
      await page.getByRole('button',{name:'2 RBI',exact:true}).click();
      await page.getByRole('button',{name,exact:true}).click();
      await page.waitForFunction(n=>window.__writes.length===n+1&&!document.querySelector('.batting-outcomes button').disabled,before);
      assert.deepEqual(await page.evaluate(()=>{const c=window.__writes.at(-1).change;return[c.outcome,c.runs,c.rbi]}),[value,2,2]);
    }
    await page.goto(`${base}/?mode=score&quick=1&game=league-game&legacy-hits=1`);
    await page.getByRole('button',{name:'Hit',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Double',exact:true}).count(),0,'unsupported server cannot receive new outcomes');
    assert.equal(await page.getByRole('button',{name:'Hit by pitch',exact:true}).count(),0);
    await page.getByLabel('Player and result',{exact:true}).fill('Synthetic Player double');
    await page.getByRole('button',{name:'Record result',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__writes.length),0,'typed entry also respects server capability');
    await page.goto(`${base}/?mode=score&quick=1&game=league-game`);
    for(const text of ['Synthetic Player double','Synthetic Player triple 2 RBI']){
      const before=await page.evaluate(()=>window.__writes.length);
      await page.getByLabel('Player and result',{exact:true}).fill(text);
      await page.getByRole('button',{name:'Record result',exact:true}).click();
      await page.waitForFunction(n=>window.__writes.length===n+1&&!document.querySelector('.batting-outcomes button').disabled,before);
      assert.equal(await page.evaluate(()=>window.__writes.at(-1).change.outcome),text.includes('double')?'2B':'3B');
    }
    await page.getByLabel('Player and result',{exact:true}).fill('Synthetic Player hit by pitch');
    await page.getByRole('button',{name:'Record result',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__writes.length),2,'HBP is not accepted through new typed/voice entry');
    assert.equal(await page.locator('.game-management,.at-bat-history,.game-switcher').count(),0);
    await page.goto(`${base}/?mode=score&quick=1&manual=1&voice=1&first-band=1&game=cup-game`);
    await page.getByRole("button",{name:"Speak a result",exact:true}).waitFor();
    await page.getByLabel('Player and result',{exact:true}).fill('Adam home run 2 RBI');
    await page.getByRole('button',{name:'Record result',exact:true}).click();
    await page.getByRole('group',{name:'First tournament Band choice',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.__writes.length),0);
    await page.getByRole('button',{name:'No Band',exact:true}).click();
    await page.getByText('Saved to the team scorebook.',{exact:true}).waitFor();
    assert.deepEqual(await page.evaluate(()=>{const c=window.__writes[0].change;return[c.playerId,c.outcome,c.runs,c.rbi,c.firstGameBand]}),['adam-player','Fence HR',2,2,false]);
    assert.equal(await page.getByLabel('Player and result',{exact:true}).inputValue(),'');
    await page.getByLabel('Player and result',{exact:true}).fill('Unknown hit');
    await page.getByRole('button',{name:'Record result',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__writes.length),1);
    // Recognition final events must be consumed once; permission/error/late-offline events cannot save.
    await page.goto(`${base}/?mode=score&quick=1&manual=1&voice=1&game=league-game`);
    await page.getByRole('button',{name:'Speak a result',exact:true}).click();
    await page.evaluate(()=>{const r=window.__recognition;const event={results:[{isFinal:true,0:{transcript:'Adam hit'}}]};r.onresult(event);r.onresult(event)});
    await page.getByText('Saved to the team scorebook.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.__writes.length),1);
    await page.getByRole('button',{name:'Speak a result',exact:true}).click();
    await page.evaluate(()=>window.__recognition.onerror({error:'not-allowed'}));
    await page.getByText('Voice couldn’t be read. Type the result or use keyboard dictation.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.__writes.length),1);
    await page.getByRole('button',{name:'Speak a result',exact:true}).click();
    await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,value:false});window.dispatchEvent(new Event('offline'))});
    await page.waitForFunction(()=>window.__aborted);
    await page.evaluate(()=>window.__recognition.onresult({results:[{isFinal:true,0:{transcript:'Adam hit'}}]}));
    assert.equal(await page.evaluate(()=>window.__writes.length),1);
    await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,value:true});window.dispatchEvent(new Event('online'))});
    await page.getByRole('button',{name:'Speak a result',exact:true}).waitFor({state:'visible'});
    await page.waitForFunction(()=>!document.querySelector('.batting-outcomes button').disabled);
    await page.evaluate(()=>window.__recognition.onresult({results:[{isFinal:true,0:{transcript:'Adam hit'}}]}));
    assert.equal(await page.evaluate(()=>window.__writes.length),1);
    await page.goto(`${base}/?mode=manage&game=cup-game`);
    await page.getByText('Game details & settings',{exact:true}).waitFor();
    assert.equal(await page.getByRole('group',{name:'Batting outcome',exact:true}).count(),0);
    assert.equal(await page.getByRole('button',{name:'Mark game complete',exact:true}).count(),1);
    // Actual management route opened by Game details, without a competition query.
    // Mixed season fixtures must not leak setup, stats or another game into it.
    for(const game of ['cup-game','league-game']){
      await page.goto(`${base}/?page=1&manage-page=1&game=${game}`);
      await page.getByRole('heading',{name:'Game details',exact:true}).waitFor();
      assert.equal(await page.getByRole('form',{name:'Set up a game',exact:true}).count(),0);
      assert.equal(await page.getByLabel('Game kind',{exact:true}).count(),0);
      assert.equal(await page.getByLabel('Opponent',{exact:true}).count(),0);
      assert.equal(await page.getByLabel('League',{exact:true}).count(),0);
      assert.equal(await page.getByLabel('Choose a game',{exact:true}).count(),0);
      assert.equal(await page.getByRole('region',{name:'Season statistics',exact:true}).count(),0);
      assert.equal(await page.getByRole('button',{name:/Create Game/}).count(),0);
      assert.equal(await page.getByRole('button',{name:'Mark game complete',exact:true}).count(),1);
      await page.getByText('Audit history',{exact:true}).click();
      await page.getByRole('button',{name:'Load audit history',exact:true}).click();
      await page.locator('.scorebook-audit').waitFor();
      assert.equal(await page.getByText('Reason: Tournament game history',{exact:true}).count(),game==='cup-game'?1:0);
      assert.equal(await page.getByText('Reason: League game history',{exact:true}).count(),game==='league-game'?1:0);
      assert.equal(await page.getByText('Reason: Cup Band history',{exact:true}).count(),game==='cup-game'?1:0);
      assert.equal(await page.getByText('Reason: Other game history',{exact:true}).count(),0);
      const gameNav=page.getByRole('navigation',{name:'Game navigation',exact:true});
      const returnToScoring=gameNav.getByRole('link',{name:'Back to scoring',exact:true});
      assert.equal(await returnToScoring.getAttribute('href'),`/club/score?team=synthetic-team&season=synthetic-season&game=${game}`);
      assert.equal(await gameNav.getByRole('link',{name:'Games',exact:true}).getAttribute('href'),'/games?team=synthetic-team&season=synthetic-season');
      const details=page.locator('.game-management');
      const savedRules=details.locator('.saved-game-rules');
      await savedRules.getByText('Saved Beverage Rules for this game',{exact:true}).click();
      assert.deepEqual(await savedRules.locator('dd').allTextContents(),['+1','+1','-1','-1','+1','-1','0']);
      assert.equal(await savedRules.locator('input,select,button,textarea').count(),0,'saved game snapshot is read only');
      assert.equal(await savedRules.getByText('Rule version: Synthetic rules',{exact:true}).isVisible(),true);
      assert.equal(await details.getByText('Change HR limit for this game',{exact:true}).count(),1);
      await details.getByText('Change HR limit for this game',{exact:true}).click();
      assert.equal(await details.getByLabel('HR limit correction reason',{exact:true}).isVisible(),true);
      for(const width of [320,390,430,800,1440]){
        await page.setViewportSize({width,height:900});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${game} management overflow at ${width}`);
        await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
        assert(await gameNav.evaluate(nav=>{const r=nav.getBoundingClientRect();return r.top>=0&&r.bottom<innerHeight;}),'Game navigation stays visible at the end of history');
        assert(await returnToScoring.evaluate(link=>{const r=link.getBoundingClientRect();return r.height>=44&&r.width>=44&&link.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'Scoring shortcut remains touchable above game details');
      }
      assert.deepEqual(await page.evaluate(()=>window.__writes.filter(write=>write.type!=='audit')),[]);
      if(process.env.GAME_DETAILS_NAV_SCREENSHOT && game==='cup-game'){
        await page.setViewportSize({width:390,height:844});
        await page.screenshot({path:process.env.GAME_DETAILS_NAV_SCREENSHOT});
      }
      await returnToScoring.focus();
      await page.keyboard.press('Enter');
      await page.waitForURL(`**/club/score?team=synthetic-team&season=synthetic-season&game=${game}`);
      await page.getByRole('heading',{name:game==='cup-game'?'Cup opponent':'League opponent',exact:true}).waitFor();
      assert.equal(await page.getByRole('group',{name:'Batting outcome',exact:true}).count(),1,'Return opens scoring for the selected game');
      assert.equal(await page.evaluate(()=>window.__writes.length),0,'Returning to scoring never records a play');
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(`${base}/?mode=full&game=league-game&league=synthetic-league`);
    await page.getByRole("button",{name:"Record plate appearance",exact:true}).waitFor();
    assert.equal(await page.getByRole("heading",{name:"Set up a game",exact:true}).count(),1);
    assert.equal(await page.getByLabel("Choose a game",{exact:true}).locator("option").count(),1);
    assert.equal(await page.getByRole("region",{name:"Season statistics",exact:true}).isVisible(),true);
    assert.equal(await page.getByRole("button",{name:"Load audit history",exact:true}).isVisible(),true);
    const picker=page.getByRole("group",{name:"Batting outcome",exact:true});
    assert.equal(await picker.getByRole("button").count(),10);
    for(const [name,runs] of [["Fence home run",1],["Inside-the-park HR",1],["Strikeout",0],["Walk",0],["Sacrifice fly",0],["Reached on error",0],["Out",0],["Single",0],["Double",0],["Triple",0]]){
      await picker.getByRole("button",{name,exact:true}).click();
      assert.equal(await picker.getByRole("button",{name,exact:true}).getAttribute("aria-pressed"),"true");
      assert.equal(await picker.locator('[aria-pressed="true"]').count(),1);
      assert.equal(await page.getByLabel("Runs on this play",{exact:true}).inputValue(),String(runs));
      assert.equal(await page.locator('input[name="at-bat-rbi"]').inputValue(),String(runs));
    }
    assert.deepEqual(await page.evaluate(()=>window.__writes),[]);
    const hr=picker.getByRole("button",{name:"Fence home run",exact:true});
    await hr.focus();await page.keyboard.press("Space");
    await page.getByLabel("Runs on this play",{exact:true}).fill("2");
    await page.getByRole("button",{name:"2 RBI",exact:true}).click();
    await hr.click();
    assert.equal(await page.getByLabel("Runs on this play",{exact:true}).inputValue(),"2");
    assert.equal(await page.locator('input[name="at-bat-rbi"]').inputValue(),"2");
    await picker.getByRole("button",{name:"Out",exact:true}).click();await hr.click();
    for(const width of [320,390,430,800,1440]){
      await page.setViewportSize({width,height:900});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      const layout=await page.evaluate(()=>({width:innerWidth,document:document.documentElement.scrollWidth,outside:Array.from(document.querySelectorAll('body *')).filter(el=>el.getBoundingClientRect().right>innerWidth+1).map(el=>({tag:el.tagName,class:el.className,right:el.getBoundingClientRect().right})).slice(0,12)}));
      assert.equal(layout.document<=layout.width,true,`${width}px overflow: ${JSON.stringify(layout)}`);
      assert.equal(await picker.getByRole("button").evaluateAll(buttons=>buttons.every(button=>{
        const bounds=button.getBoundingClientRect();
        return bounds.width>=44 && bounds.height>=44 && Array.from(button.querySelectorAll('strong,span')).every(label=>label.scrollWidth<=label.clientWidth && label.scrollHeight<=label.clientHeight);
      })),true,`Readable outcome labels and touch targets at ${width}px`);
    }
    await page.setViewportSize({width:390,height:844});
    const savePlay=page.getByRole("button",{name:"Record plate appearance",exact:true});
    if(process.env.BATTING_SCREENSHOT)await page.locator('.at-bat-card').screenshot({path:process.env.BATTING_SCREENSHOT});
    const atBatSize=await savePlay.evaluate(el=>({height:el.getBoundingClientRect().bottom-document.querySelector('.at-bat-card').getBoundingClientRect().top,form:document.querySelector('.at-bat-form').getBoundingClientRect().height,picker:document.querySelector('.batting-outcomes').getBoundingClientRect().height}));
    assert.equal(atBatSize.form<660,true,JSON.stringify(atBatSize));
    assert.equal(await page.getByText("Score and inning have not been recorded.",{exact:true}).isVisible(),true);
    assert.equal(await page.getByLabel("New fence HR limit",{exact:true}).isVisible(),false);
    for(const value of [1,2,3,4,0]){
      await page.getByRole("button",{name:`${value} RBI`,exact:true}).click();
      assert.equal(await page.locator('input[name="at-bat-rbi"]').inputValue(),String(value));
      assert.equal(await page.getByRole("button",{name:`${value} RBI`,exact:true}).getAttribute("aria-pressed"),"true");
      assert.equal(Number(await page.getByLabel("Runs on this play",{exact:true}).inputValue())>=value,true);
    }
    await picker.getByRole("button",{name:"Out",exact:true}).click();await hr.click();
    if(process.env.BATTING_SCREENSHOT)await page.locator('.at-bat-card').screenshot({path:process.env.BATTING_SCREENSHOT});
    await page.getByRole("button",{name:"2 RBI",exact:true}).click();
    await page.getByRole("button",{name:"Record plate appearance",exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__writes.length),1);
    assert.deepEqual(await page.evaluate(()=>{const c=window.__writes[0].change;return{type:c.type,outcome:c.outcome,runs:c.runs,rbi:c.rbi}}),{type:"score",outcome:"Fence HR",runs:2,rbi:2});
    await page.goto(`${base}/?mode=score&game=league-game&league=synthetic-league`);
    await page.getByRole("group",{name:"Batting outcome",exact:true}).waitFor();
    await page.evaluate(()=>{Object.defineProperty(navigator,'onLine',{configurable:true,value:false});window.dispatchEvent(new Event('offline'))});
    await page.waitForFunction(()=>document.querySelector('.batting-outcomes button').disabled);
    assert.equal(await page.getByRole("group",{name:"Batting outcome",exact:true}).getByRole("button",{name:"Fence home run",exact:true}).isDisabled(),true);
    assert.equal(await page.getByRole("button",{name:"2 RBI",exact:true}).isDisabled(),true);
    await page.goto(`${base}/?page=1&scoring-page=1&tournament=synthetic-cup`);
    await page.getByRole("group",{name:"Batting outcome",exact:true}).waitFor();
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    // Scoring may scroll; every outcome must remain reachable above the fixed navigation.
    await page.getByRole('button',{name:'Reached on error',exact:true}).scrollIntoViewIfNeeded();
    assert.equal(await page.getByRole('button',{name:'Reached on error',exact:true}).evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('.app-bottom-nav').getBoundingClientRect().top),true);
    assert.equal(await page.getByRole("button",{name:"Record plate appearance",exact:true}).count(),0);
    assert.equal(await page.getByRole("link",{name:"Game details",exact:true}).count(),1);
    assert.equal(await page.getByText("Score and inning have not been recorded.",{exact:true}).count(),0);
    assert.equal(await page.getByRole("button",{name:"Start Game 2",exact:true}).count(),0);
    if(process.env.PAGE_SCREENSHOT)await page.screenshot({path:process.env.PAGE_SCREENSHOT,fullPage:true});
    await page.goto(`${base}/?mode=setup&league=synthetic-league`);
    await page.getByRole("form",{name:"Set up a game",exact:true}).waitFor();
    assert.equal(await page.getByRole("button",{name:"Record plate appearance",exact:true}).count(),0);
    assert.equal(await page.getByLabel("Fence HR limit for this game",{exact:true}).inputValue(),"0");
    assert.equal(await page.getByLabel("Game kind",{exact:true}).isVisible(),false);
    assert.equal(await page.getByRole("region",{name:"Season statistics",exact:true}).count(),0);
    await page.goto(`${base}/?mode=setup&tournament=synthetic-cup`);
    const next=page.getByRole("form",{name:"Next game for M3-5 Synthetic Cup",exact:true});await next.waitFor();
    assert.equal(await next.getByLabel("Opponent",{exact:true}).isVisible(),true);
    assert.equal(await next.locator("input").count(),1);
    assert.equal(await next.getByLabel("Game date",{exact:true}).count(),0);
    assert.equal(await next.getByText("Beverage rules for this game",{exact:true}).count(),0);
    assert.equal(await next.getByText("Set up a different league or tournament",{exact:true}).count(),0);
    await next.getByRole("button",{name:"Start Game 2",exact:true}).waitFor();
    assert.equal(await page.getByRole("button",{name:"Record plate appearance",exact:true}).count(),0);
    for(const width of [320,390,800,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);}
    // Capability-gated setup starts with no fake batting order, or an explicit coach order.
    for(const ordered of [false,true]){
      await page.goto(`${base}/?page=1&empty=1&manual=1&tournament=synthetic-cup`);
      const setup=page.getByRole('form',{name:'Set up a game',exact:true});
      await setup.getByLabel('Opponent',{exact:true}).fill('Synthetic optional lineup opponent');
      assert.equal(await setup.locator('input[name="player"]:checked').count(),0);
      if(ordered){await setup.getByText('Add batting order (optional)',{exact:true}).click();await setup.locator('input[name="player"]').first().check();}
      await page.evaluate(()=>window.__writeResult='uncertain');
      await setup.getByRole('button',{name:'Start Game 1',exact:true}).click();
      await page.getByRole('button',{name:'Retry the same change',exact:true}).waitFor();
      const value=await page.evaluate(()=>window.__writes[0].setup);
      assert.equal(value.battingMode,ordered?'ordered':'manual');assert.deepEqual(value.lineup,ordered?['synthetic-player']:[]);
      await page.evaluate(()=>sessionStorage.removeItem('diamond-alibi.pending.synthetic-user.synthetic-team.synthetic-season'));
    }
    // Actual server-page heading and first tournament setup, with synthetic services.
    await page.setViewportSize({width:390,height:844});
    await page.goto(`${base}/?page=1&empty=1&tournament=synthetic-cup`);
    await page.getByRole("heading",{name:"M3-5 Synthetic Cup",exact:true}).waitFor();
    await page.getByText("Game 1 · Tournament",{exact:true}).waitFor();
    const firstSetup=page.getByRole("form",{name:"Set up a game",exact:true});
    const firstStart=firstSetup.getByRole("button",{name:"Start Game 1",exact:true});
    assert.equal(await page.getByRole("heading",{name:"Team scorebook",exact:true}).count(),0);
    assert.equal(await page.getByRole("heading",{name:"Tournament games and Band corrections",exact:true}).count(),0);
    assert.equal(await page.locator('.scorebook-status').evaluate(el=>el.getBoundingClientRect().height<=64),true);
    assert.equal(await firstSetup.getByLabel("Opponent",{exact:true}).isVisible(),true);
    assert.equal(await firstSetup.getByLabel("Game date",{exact:true}).isVisible(),false);
    assert.equal(await firstSetup.getByLabel("Fence HR limit for this game",{exact:true}).inputValue(),"2");
    assert.equal(await firstStart.evaluate(el=>el.getBoundingClientRect().bottom<600),true);
    if(process.env.LAYOUT_SCREENSHOT)await page.screenshot({path:process.env.LAYOUT_SCREENSHOT,fullPage:true});
    await firstSetup.getByText("Date & HR limit",{exact:true}).click();
    const date=firstSetup.getByLabel("Game date",{exact:true});
    for(const width of [320,390,430,800,1440]){
      await page.setViewportSize({width,height:844});
      assert.equal(await date.evaluate(el=>{const field=el.getBoundingClientRect(),card=el.closest('.game-setup-card').getBoundingClientRect();return field.left>=card.left+8 && field.right<=card.right-8}),true);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);
    }
    await page.setViewportSize({width:390,height:844});
    await date.fill("");await firstSetup.getByText("Date & HR limit",{exact:true}).click();
    await firstSetup.getByLabel("Opponent",{exact:true}).fill("Synthetic Game 1 opponent");
    await firstStart.click();
    assert.equal(await date.isVisible(),true);assert.deepEqual(await page.evaluate(()=>window.__writes),[]);
    await date.fill("2026-10-13");await firstSetup.getByText("Date & HR limit",{exact:true}).click();
    await firstSetup.getByText("Lineup & HR Bands",{exact:true}).click();
    await firstSetup.locator('input[name="player"]').uncheck();
    await firstSetup.getByText("Lineup & HR Bands",{exact:true}).click();await firstStart.click();
    await page.getByRole("alert").getByText("Choose at least one player",{exact:false}).waitFor();
    assert.equal(await firstSetup.locator('input[name="player"]').isVisible(),true);
    assert.deepEqual(await page.evaluate(()=>window.__writes),[]);
    await firstSetup.locator('input[name="player"]').check();
    await firstSetup.getByLabel("HR Band for Synthetic Player",{exact:false}).check();
    await firstSetup.getByText("Lineup & HR Bands",{exact:true}).click();
    await page.evaluate(()=>window.__writeResult="uncertain");await firstStart.click();
    await page.getByRole("button",{name:"Retry the same change",exact:true}).waitFor();
    assert.equal(await firstStart.isDisabled(),true);
    await page.getByRole("alert").getByText("Save could not be confirmed.",{exact:false}).waitFor();
    await page.getByRole("button",{name:"Retry the same change",exact:true}).click();
    const writes=await page.evaluate(()=>window.__writes);assert.equal(writes.length,2);assert.deepEqual(writes[0],writes[1]);
    assert.equal(writes[0].tournamentId,"synthetic-cup");assert.equal(writes[0].setup.kind,"Tournament");
    assert.equal(writes[0].setup.rules.fenceLimit,2);assert.equal(writes[0].setup.bands['synthetic-player'],true);
    await page.evaluate(()=>window.dispatchEvent(new Event("offline")));
    await page.getByRole("alert").getByText("Offline.",{exact:false}).waitFor();
    assert.equal(await page.getByRole("button",{name:"Retry the same change",exact:true}).isDisabled(),true);
    // Start an independent synthetic scenario; real uncertain saves remain retained.
    await page.evaluate(()=>sessionStorage.removeItem("diamond-alibi.pending.synthetic-user.synthetic-team.synthetic-season"));
    // Team rules are finalized once, never edited again during setup.
    await page.goto(`${base}/?page=1&team-beverage=1&unfinalized=1&tournament=synthetic-cup`);
    await page.getByRole('link',{name:'Set team Beverage Rules',exact:true}).waitFor();
    const rulesUrl=new URL(await page.getByRole('link',{name:'Set team Beverage Rules',exact:true}).getAttribute('href'),base);
    const resume=new URL(rulesUrl.searchParams.get('returnTo'),base);
    assert.equal(resume.pathname,'/club/score');
    assert.equal(resume.searchParams.get('team'),'synthetic-team');
    assert.equal(resume.searchParams.get('season'),'synthetic-season');
    assert.equal(resume.searchParams.get('tournament'),'synthetic-cup');
    assert.equal(resume.searchParams.get('setup'),'1');
    assert.equal(await page.getByRole('button',{name:'Start Game 2',exact:true}).count(),0);
    assert.equal(await page.locator('input[name^="board-"]').count(),0);
    await page.goto(`${base}/?page=1&team-beverage=1&league=synthetic-league`);
    const teamRuleSetup=page.getByRole('form',{name:'Set up a game',exact:true});
    await teamRuleSetup.getByLabel('Opponent',{exact:true}).fill('Synthetic finalized rules opponent');
    assert.equal(await teamRuleSetup.getByText('Beverage rules for this game',{exact:true}).count(),0);
    assert.equal(await teamRuleSetup.locator('input[name^="board-"]').count(),0);
    await page.evaluate(()=>window.__writeResult='uncertain');
    await teamRuleSetup.getByRole('button',{name:'Start game',exact:true}).click();
    await page.getByRole('button',{name:'Retry the same change',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.__writes[0].setup.rules.board.solo),2,'uses canonical team rules instead of per-game defaults');
    await page.evaluate(()=>sessionStorage.removeItem('diamond-alibi.pending.synthetic-user.synthetic-team.synthetic-season'));
    await page.goto(`${base}/?page=1&team-beverage=1&tournament=synthetic-cup`);
    const finalizedNext=page.getByRole('form',{name:'Next game for M3-5 Synthetic Cup',exact:true});
    await finalizedNext.getByLabel('Opponent',{exact:true}).fill('Synthetic finalized continuation');
    await page.evaluate(()=>window.__writeResult='uncertain');
    await finalizedNext.getByRole('button',{name:'Start Game 2',exact:true}).click();
    await page.getByRole('button',{name:'Retry the same change',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.__writes[0].setup.rules.board.solo),2,'continuation also uses canonical team rules');
    await page.evaluate(()=>sessionStorage.removeItem('diamond-alibi.pending.synthetic-user.synthetic-team.synthetic-season'));
    // Continuing a tournament asks only for its opponent. Frozen rules/date/order
    // are submitted from the retained template, not editable settings.
    await page.goto(`${base}/?page=1&tournament=synthetic-cup`);
    await page.getByText("Game 2 · Tournament",{exact:true}).waitFor();
    const carried=page.getByRole("form",{name:"Next game for M3-5 Synthetic Cup",exact:true});
    await carried.getByRole("button",{name:"Start Game 2",exact:true}).waitFor();
    assert.equal(await carried.locator('input').count(),1);
    assert.equal(await carried.getByText('Edit game settings',{exact:true}).count(),0);
    assert.equal(await carried.getByRole('button',{name:'Start Game 2',exact:true}).evaluate(el=>el.getBoundingClientRect().bottom<600),true);
    await carried.getByLabel('Opponent',{exact:true}).fill('Synthetic Game 2 opponent');
    if(process.env.NEXT_GAME_SCREENSHOT)await page.screenshot({path:process.env.NEXT_GAME_SCREENSHOT,fullPage:true});
    await page.evaluate(()=>window.__writeResult='uncertain');
    await carried.getByRole('button',{name:'Start Game 2',exact:true}).click();
    await page.getByRole('button',{name:'Retry the same change',exact:true}).waitFor();
    const retained=await page.evaluate(()=>window.__writes[0]);
    assert.equal(retained.playedOn,'2026-10-13');assert.equal(retained.tournamentId,'synthetic-cup');
    assert.deepEqual(retained.setup.lineup,['synthetic-player']);assert.equal(retained.setup.rules.fenceLimit,2);
    assert.deepEqual(retained.setup.bands,{});assert.equal(retained.setup.rules.board.bandSolo,-1);
    await page.getByRole('button',{name:'Retry the same change',exact:true}).click();
    assert.deepEqual(await page.evaluate(()=>window.__writes[0]),await page.evaluate(()=>window.__writes[1]));
    await page.evaluate(()=>sessionStorage.removeItem('diamond-alibi.pending.synthetic-user.synthetic-team.synthetic-season'));
    await page.goto(`${base}/?page=1&manual=1&tournament=synthetic-cup`);
    const noOrder=page.getByRole('form',{name:'Next game for M3-5 Synthetic Cup',exact:true});
    await noOrder.getByLabel('Opponent',{exact:true}).fill('Synthetic manual continuation');
    await page.evaluate(()=>window.__writeResult='uncertain');await noOrder.getByRole('button',{name:'Start Game 2',exact:true}).click();
    await page.getByRole('button',{name:'Retry the same change',exact:true}).waitFor();
    const manualStart=await page.evaluate(()=>window.__writes[0]);assert.equal(manualStart.setup.battingMode,'manual');assert.deepEqual(manualStart.setup.lineup,[]);assert.equal(manualStart.playedOn,'2026-10-13');
    await page.evaluate(()=>sessionStorage.removeItem('diamond-alibi.pending.synthetic-user.synthetic-team.synthetic-season'));
    await page.goto(`${base}/?mode=score&game=missing`);
    await page.getByText("That game is unavailable in this scorebook.",{exact:false}).waitFor();
    assert.equal(await page.getByRole("button",{name:"Record plate appearance",exact:true}).count(),0);
    assert.deepEqual(await page.evaluate(()=>window.__writes),[]);assert.deepEqual(errors,[]);

    // New outcomes are available only when the selected game saved their explicit amounts.
    await page.goto(`${base}/?mode=score&quick=1&extended=1&game=league-game`);
    await page.getByRole('button',{name:'Strikeout looking',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Strikeout',exact:true}).count(),0,'legacy unspecified K is replaced by explicit choices');
    assert.equal(await page.getByRole('button',{name:'Strikeout looking',exact:true}).locator('strong').innerText(),'ꓘ');
    for(const width of [320,390,430,800,1440]){
      await page.setViewportSize({width,height:900});
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Extended choices fit '+width);
      assert(await page.locator('.batting-outcomes button').evaluateAll(buttons=>buttons.every(b=>{const r=b.getBoundingClientRect();return r.width>=44&&r.height>=44&&b.scrollWidth<=b.clientWidth&&b.scrollHeight<=b.clientHeight})), 'Readable, contained outcome targets at '+width);
    }
    await page.setViewportSize({width:390,height:844});
    if(process.env.OUTCOME_SCREENSHOT)await page.locator('.batting-outcomes').screenshot({path:process.env.OUTCOME_SCREENSHOT});
    for(const [i,name] of ['Strikeout looking','Strikeout swinging','Strikeout foul out','Hit into double play'].entries()){
      await page.getByRole('button',{name,exact:true}).click();
      await page.waitForFunction(count=>window.__writes.length===count&&!document.querySelector('.batting-outcomes button').disabled,i+1);
    }
    assert.deepEqual(await page.evaluate(()=>window.__writes.map(w=>[w.change.outcome,w.change.runs,w.change.rbi])),[['K Looking',0,0],['K Swinging',0,0],['SOFO',0,0],['DP',0,0]]);
    await page.getByLabel('Player and result',{exact:true}).fill('strikeout');
    await page.getByRole('button',{name:'Record result',exact:true}).click();
    await page.getByText('Choose strikeout looking, strikeout swinging, or SOFO.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.__writes.length),4,'unspecified strikeout cannot guess the subtype');
    await page.goto(`${base}/?mode=manage&extended=1&game=league-game`);
    await page.getByText('Saved Beverage Rules for this game',{exact:true}).click();
    const savedExtended=page.locator('.saved-game-rules');
    for(const label of ['Strikeout looking','Strikeout swinging','Strikeout foul out (SOFO)','Hit into double play'])assert.equal(await savedExtended.getByText(label,{exact:true}).count(),1);
    assert.deepEqual((await savedExtended.locator('dd').allTextContents()).slice(-4),['+2','+2','+1','+1']);
    await page.goto(`${base}/?mode=score&game=league-game`);
    await page.getByRole('button',{name:'Strikeout',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Strikeout looking',exact:true}).count(),0,'older saved game keeps its original options');


    // Doubles/triples rankings use saved effective hit types, including real zero counts.
    await page.goto(`${base}/?leaderboard=1&hit-leaders=1`);
    const hitLeaders=page.getByRole('region',{name:'Tournament player leaderboard',exact:true});await hitLeaders.waitFor();
    for(const [label,values] of [['Doubles',['2','0']],['Triples',['2','1']]]){
      await hitLeaders.getByRole('button',{name:'View '+label+' rankings',exact:true}).click();
      assert.deepEqual(await hitLeaders.locator('.leaderboard-counts strong').allTextContents(),values);
      await page.setViewportSize({width:320,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      await hitLeaders.getByRole('button',{name:'← Back to leaders',exact:true}).click();
    }
    await page.setViewportSize({width:390,height:844});

    // All competition and Stats pages share the same nine-category component.
    await page.goto(`${base}/?leaderboard=1&extended=1&new-leaders=1`);
    const expandedLeaders=page.getByRole('region',{name:'Tournament player leaderboard',exact:true});await expandedLeaders.waitFor();
    assert.equal(await expandedLeaders.locator('.leaderboard-summary button').count(),9);
    for(const [label,expected] of [['SO','3'],['Hit into double play','2']]){
      const button=expandedLeaders.getByRole('button',{name:'View '+label+' rankings',exact:true});
      assert.equal(await button.locator('.leaderboard-counts strong').innerText(),expected);
      await button.click();
      assert.equal(await expandedLeaders.locator('.leaderboard-counts strong').first().innerText(),expected);
      for(const width of [320,390,800,1440]){
        await page.setViewportSize({width,height:900});
        await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,label+' rankings fit '+width);
      }
      await expandedLeaders.getByRole('button',{name:'← Back to leaders',exact:true}).click();
      await button.waitFor({state:'visible'});
      assert.equal(await button.evaluate(el=>el===document.activeElement),true,'Back restores category focus');
    }
    await page.setViewportSize({width:390,height:844});
    if(process.env.LEADERBOARD_SCREENSHOT)await expandedLeaders.screenshot({path:process.env.LEADERBOARD_SCREENSHOT});
    await page.goto(`${base}/?leaderboard=1`);
    await expandedLeaders.waitFor();
    assert.equal(await expandedLeaders.getByRole('button',{name:'View Hit into double play rankings',exact:true}).isDisabled(),true,'old DP count has no fabricated leader');
    assert.equal(await expandedLeaders.getByRole('button',{name:'View SO rankings',exact:true}).isDisabled(),false,'historical generic K remains countable under SO');

    await page.goto(`${base}/?mode=score&game=cup-game&tournament-archived=1`);
    await page.getByText('Archived tournament · read only. Restore it in Tournament settings to score again.',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Single',exact:true}).isDisabled(),true);
    assert.equal(await page.evaluate(()=>window.__polls.size),0,'archived tournaments stop live polling');
    assert.equal(await page.evaluate(()=>window.__writes.length),0,'opening archived history does not write');
    await page.goto(`${base}/?mode=setup&tournament=synthetic-cup&tournament-archived=1`);
    await page.getByRole('heading',{name:'Synthetic scorebook',exact:true}).waitFor();
    assert.equal(await page.getByLabel('Tournament',{exact:true}).getByRole('option',{name:'M3-5 Synthetic Cup',exact:true}).count(),0,'archived tournaments are absent from new-game choices');
    assert.equal(await page.evaluate(()=>window.__writes.length),0);
    console.log(`PASS ${process.env.BROWSER_ENGINE || "chromium"} compact at-bat: RBI before instant results; settings/history absent from scorer, separate game-details link. Legacy draft selection/save preserved; all scoring choices reachable above fixed navigation. Grouped outcome buttons: explicit 1B/2B/3B, no HBP, supported-server guards and ten base choices, selected/keyboard state, HR defaults/reset, no write until confirmed, unchanged score payload, offline disabling and readable touch targets at 320–1440px. Compact setup: actual page heading, first/next-game primary actions above the fold, native date containment, hidden-field validation, preserved HR/Bands payloads and prominent uncertain/offline handling. Score/setup modes: selected competition isolation, no unrelated scoring during setup, inherited zero/2 limits, opponent-only tournament continuation, collapsed statistics/audit, missing-game denial and mobile overflow. Live polling only for active, visible, online games; completed/setup/manage/archived/missing games do not poll. Hidden/offline reads are skipped and returning/reconnecting refreshes without recording plays. Decimal leaderboard rates and effective doubles/triples rankings. Synthetic services only; no hosted writes.`);
  } finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
