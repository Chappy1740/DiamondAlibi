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
      import React from 'react';import{createRoot}from'react-dom/client';import{ConnectedScorebook}from'./src/components/connected-scorebook';import{DEFAULT_BOARD}from'./src/lib/scoring';import ScorePage from'./src/app/club/score/page';
      const rules={version_label:'Synthetic rules',fence_limit:9,strikeout:DEFAULT_BOARD.strikeout,solo:DEFAULT_BOARD.solo,band_solo:DEFAULT_BOARD.bandSolo,grand_slam:DEFAULT_BOARD.grandSlam,over_limit:DEFAULT_BOARD.overLimit,inside_park:DEFAULT_BOARD.insidePark,multi_run:DEFAULT_BOARD.multiRun};
      const g=(id,kind,competition,opponent)=>({game:{id,kind,league_id:kind==='League'?competition:null,tournament_id:kind==='Tournament'?competition:null,day_id:'synthetic-day',opponent,completed:false,next_batter_position:0},playedOn:'2026-10-13',dayRevision:1,tournamentRevision:kind==='Tournament'?1:null,lineup:['synthetic-player'],rules,evaluation:{rows:[],fenceUsed:0,totals:{}}});
      const data={archived:false,roster:[{id:'synthetic-player',display_name:'Synthetic Player',is_guest:false}],bands:[{player_id:'synthetic-player',tournament_id:'synthetic-cup',has_band:true}],participation:[],leagueBands:[],snapshot:{teamId:'synthetic-team',seasonId:'synthetic-season',scope:'Overall',totals:{},board:{'synthetic-player':-2},leagues:[{id:'synthetic-league',name:'Synthetic league',fenceLimit:0},{id:'other-league',name:'Other synthetic league',fenceLimit:5}],tournaments:[{id:'synthetic-cup',name:'M3-5 Synthetic Cup',revision:1,fenceLimit:2,guaranteedGames:2}],games:[g('league-game','League','synthetic-league','League opponent'),g('other-game','League','other-league','Other opponent'),g('cup-game','Tournament','synthetic-cup','Cup opponent')]}};
      const query=new URLSearchParams(location.search);window.__writes=[];window.__writeResult='invalid';window.__reloadStatus='ok';
      if(query.has('empty')){data.snapshot.games=data.snapshot.games.filter(g=>!g.game.tournament_id);data.bands=[];}
      if(query.has('manual')){data.snapshot.capabilities={manualBatting:true};data.roster.push({id:'adam-player',display_name:'Adam Jones',is_guest:false});data.snapshot.games.forEach(game=>{game.game.batting_mode='manual';game.lineup=[];});if(query.has('first-band'))data.bands=[];}
      if(query.has('voice'))window.SpeechRecognition=class{start(){window.__recognition=this;}stop(){}abort(){window.__aborted=true;}};
      window.__fixture=data;
      if(query.has('page')) ScorePage({searchParams:Promise.resolve({setup:query.has('scoring-page')?undefined:'1',game:query.has('scoring-page')?'cup-game':undefined,tournament:query.get('tournament')||undefined,league:query.get('league')||undefined})}).then(ui=>createRoot(document.getElementById('app')).render(ui));
      else
      createRoot(document.getElementById('app')).render(<main className="connected-wrap"><h1>Synthetic scorebook</h1><ConnectedScorebook storageKey="synthetic.mode-test" teamId="synthetic-team" seasonId="synthetic-season" initial={{status:'ok',data}} mode={query.get('mode')||'score'} initialGameId={query.get('game')||''} initialLeagueId={query.get('league')||''} initialTournamentId={query.get('tournament')||''} submitAction={async(input)=>{window.__writes.push(input);return query.has('quick')?{status:'ok',data:{status:'ok'}}:{status:'invalid'}}} reloadAction={async()=>({status:'ok',data})}/></main>);
    `},bundle:true,write:false,platform:"browser",jsx:"automatic",plugins:[{name:"synthetic-page-context",setup(build){
      build.onResolve({filter:/^(next\/(headers|navigation|link|image)|@\/lib\/supabase\/server|@\/app\/(club\/scoring-actions|login\/actions))$/},args=>({path:args.path,namespace:"synthetic"}));
      build.onLoad({filter:/.*/,namespace:"synthetic"},args=>({loader:"tsx",resolveDir:process.cwd(),contents:
        args.path === "next/headers" ? "export async function cookies(){return {get(){return undefined}}}" :
        args.path === "next/navigation" ? "export function redirect(path){throw Error('Synthetic redirect: '+path)}" :
        args.path === "next/link" ? "import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}" :
        args.path === "next/image" ? "import React from 'react';export default function Image({unoptimized,...props}){return <img {...props}/>}" :
        args.path === "@/app/login/actions" ? "export async function signout(){}" :
        args.path === "@/lib/supabase/server" ? "export async function supabaseServer(){return {auth:{getUser:async()=>({data:{user:{id:'synthetic-user'}},error:null})},from:(table)=>({select(){return this},eq(){return this},order(){return Promise.resolve({data:table==='teams'?[{id:'synthetic-team',name:'M3-5 Synthetic Test'}]:[{id:'synthetic-season',name:'M3-5 Synthetic Season',archived:false}]})}})}}" :
        "export async function loadScorebook(){return window.__reloadStatus==='ok'?{status:'ok',data:window.__fixture}:{status:window.__reloadStatus}};export async function scoringAction(input){window.__writes.push(input);return{status:window.__writeResult,commandId:input.commandId}}"
      }));
    }}]});
    const css=fs.readFileSync("src/app/globals.css","utf8");
    server=http.createServer((req,res)=>{if(req.url==="/brand/diamond-alibi-icon-64.png"){res.setHeader("content-type","image/png");res.end(fs.readFileSync("public/brand/diamond-alibi-icon-64.png"));return;}res.setHeader("content-type",req.url==="/bundle.js"?"text/javascript":"text/html");res.end(req.url==="/bundle.js"?bundle.outputFiles[0].text:`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic mode validation</title><style>${css}</style></head><body><div id="app"></div><script src="/bundle.js"></script></body></html>`);});
    await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
    const base=`http://127.0.0.1:${server.address().port}`;
    const engine=process.env.BROWSER_ENGINE === "webkit" ? webkit : chromium;
    browser=await engine.launch({headless:true,...(engine === chromium && process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
    const page=await browser.newPage({viewport:{width:390,height:844},...(engine === webkit ? {isMobile:true,hasTouch:true} : {})});page.on("pageerror",error=>errors.push(error.message));
    // Quick taps and typed/native voice contracts; all writes remain local synthetic mocks.
    await page.goto(`${base}/?mode=score&quick=1&game=league-game`);
    await page.getByRole("group",{name:"Batting outcome",exact:true}).waitFor();
    await page.getByRole("button",{name:"Hit",exact:true}).click();
    await page.getByText("Saved to the team scorebook.",{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.__writes.length),1);
    await page.getByRole("button",{name:"2 RBI",exact:true}).click();
    await page.getByRole("button",{name:"Fence home run",exact:true}).click();
    await page.waitForFunction(()=>window.__writes.length===2 && !document.querySelector('.batting-outcomes button').disabled);
    assert.deepEqual(await page.evaluate(()=>{const c=window.__writes[1].change;return[c.playerId,c.outcome,c.runs,c.rbi]}),['synthetic-player','Fence HR',2,2]);
    assert.equal(await page.locator('input[name="at-bat-rbi"]').inputValue(),'0');
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
    await page.goto(`${base}/?mode=full&game=league-game&league=synthetic-league`);
    await page.getByRole("button",{name:"Record plate appearance",exact:true}).waitFor();
    assert.equal(await page.getByRole("heading",{name:"Set up a game",exact:true}).count(),1);
    assert.equal(await page.getByLabel("Choose a game",{exact:true}).locator("option").count(),1);
    assert.equal(await page.getByRole("region",{name:"Season statistics",exact:true}).isVisible(),true);
    assert.equal(await page.getByRole("button",{name:"Load audit history",exact:true}).isVisible(),true);
    const picker=page.getByRole("group",{name:"Batting outcome",exact:true});
    assert.equal(await picker.getByRole("button").count(),9);
    for(const [name,runs] of [["Fence home run",1],["Inside-the-park HR",1],["Strikeout",0],["Walk",0],["Hit by pitch",0],["Sacrifice fly",0],["Reached on error",0],["Out",0],["Hit",0]]){
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
    assert.equal(await page.locator(".at-bat-form").evaluate(el=>el.getBoundingClientRect().bottom<900),true);
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
    assert.equal(await next.getByLabel("Game date",{exact:true}).isVisible(),false);
    assert.equal(await next.getByLabel("Fence HR limit for this game",{exact:true}).inputValue(),"2");
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
    // Continuation uses the same compact page and exposes nested invalid settings.
    await page.goto(`${base}/?page=1&tournament=synthetic-cup`);
    await page.getByText("Game 2 · Tournament",{exact:true}).waitFor();
    const carried=page.getByRole("form",{name:"Next game for M3-5 Synthetic Cup",exact:true});
    await carried.getByRole("button",{name:"Start Game 2",exact:true}).waitFor();
    assert.equal(await page.getByRole("heading",{name:"Tournament games and Band corrections",exact:true}).count(),0);
    assert.equal(await carried.getByRole("button",{name:"Start Game 2",exact:true}).evaluate(el=>el.getBoundingClientRect().bottom<600),true);
    await carried.getByLabel("Opponent",{exact:true}).fill("Synthetic Game 2 opponent");
    await carried.getByText("Edit game settings",{exact:true}).click();
    await carried.getByText("Beverage rules for this game",{exact:true}).click();
    await carried.locator('input[name="board-strikeout"]').fill("");
    await carried.getByText("Edit game settings",{exact:true}).click();
    await carried.getByRole("button",{name:"Start Game 2",exact:true}).click();
    assert.equal(await carried.locator('input[name="board-strikeout"]').isVisible(),true);
    assert.deepEqual(await page.evaluate(()=>window.__writes),[]);
    await page.goto(`${base}/?mode=score&game=missing`);
    await page.getByText("That game is unavailable in this scorebook.",{exact:false}).waitFor();
    assert.equal(await page.getByRole("button",{name:"Record plate appearance",exact:true}).count(),0);
    assert.deepEqual(await page.evaluate(()=>window.__writes),[]);assert.deepEqual(errors,[]);
    console.log(`PASS ${process.env.BROWSER_ENGINE || "chromium"} compact at-bat: RBI before instant results; settings/history absent from scorer, separate game-details link. Legacy draft selection/save preserved; actual page primary controls within 900px. Grouped outcome buttons: all nine choices, selected/keyboard state, HR defaults/reset, no write until confirmed, unchanged score payload, offline disabling and readable touch targets at 320–1440px. Compact setup: actual page heading, first/next-game primary actions above the fold, native date containment, hidden-field validation, preserved HR/Bands payloads and prominent uncertain/offline handling. Score/setup modes: selected competition isolation, no unrelated scoring during setup, inherited zero/2 limits, opponent-only tournament continuation, collapsed statistics/audit, missing-game denial and mobile overflow. Synthetic services only; no hosted writes.`);
  } finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
