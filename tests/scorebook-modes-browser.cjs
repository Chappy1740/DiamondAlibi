// Actual scorebook layout using an authorized, synthetic season snapshot.
const { chromium } = require("playwright");
const esbuild = require("esbuild");
const fs = require("node:fs");
const http = require("node:http");
const assert = require("node:assert/strict");
(async () => {
  let browser,server;
  const errors=[];
  try {
    const bundle=await esbuild.build({stdin:{resolveDir:process.cwd(),loader:"tsx",contents:`
      import React from 'react';import{createRoot}from'react-dom/client';import{ConnectedScorebook}from'./src/components/connected-scorebook';import{DEFAULT_BOARD}from'./src/lib/scoring';
      const rules={version_label:'Synthetic rules',fence_limit:9,strikeout:DEFAULT_BOARD.strikeout,solo:DEFAULT_BOARD.solo,band_solo:DEFAULT_BOARD.bandSolo,grand_slam:DEFAULT_BOARD.grandSlam,over_limit:DEFAULT_BOARD.overLimit,inside_park:DEFAULT_BOARD.insidePark,multi_run:DEFAULT_BOARD.multiRun};
      const g=(id,kind,competition,opponent)=>({game:{id,kind,league_id:kind==='League'?competition:null,tournament_id:kind==='Tournament'?competition:null,day_id:'synthetic-day',opponent,completed:false,next_batter_position:0},playedOn:'2026-10-13',dayRevision:1,tournamentRevision:kind==='Tournament'?1:null,lineup:['synthetic-player'],rules,evaluation:{rows:[],fenceUsed:0,totals:{}}});
      const data={archived:false,roster:[{id:'synthetic-player',display_name:'Synthetic Player',is_guest:false}],bands:[{player_id:'synthetic-player',tournament_id:'synthetic-cup',has_band:true}],participation:[],leagueBands:[],snapshot:{teamId:'synthetic-team',seasonId:'synthetic-season',scope:'Overall',totals:{},board:{'synthetic-player':-2},leagues:[{id:'synthetic-league',name:'Synthetic league',fenceLimit:0},{id:'other-league',name:'Other synthetic league',fenceLimit:5}],tournaments:[{id:'synthetic-cup',name:'Synthetic cup',revision:1,fenceLimit:2,guaranteedGames:2}],games:[g('league-game','League','synthetic-league','League opponent'),g('other-game','League','other-league','Other opponent'),g('cup-game','Tournament','synthetic-cup','Cup opponent')]}};
      const query=new URLSearchParams(location.search);window.__writes=[];
      createRoot(document.getElementById('app')).render(<main className="connected-wrap"><h1>Synthetic scorebook</h1><ConnectedScorebook storageKey="synthetic.mode-test" teamId="synthetic-team" seasonId="synthetic-season" initial={{status:'ok',data}} mode={query.get('mode')||'score'} initialGameId={query.get('game')||''} initialLeagueId={query.get('league')||''} initialTournamentId={query.get('tournament')||''} submitAction={async(input)=>{window.__writes.push(input);return{status:'invalid'}}} reloadAction={async()=>({status:'ok',data})}/></main>);
    `},bundle:true,write:false,platform:"browser",jsx:"automatic"});
    const css=fs.readFileSync("src/app/globals.css","utf8");
    server=http.createServer((req,res)=>{res.setHeader("content-type",req.url==="/bundle.js"?"text/javascript":"text/html");res.end(req.url==="/bundle.js"?bundle.outputFiles[0].text:`<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic mode validation</title><style>${css}</style></head><body><div id="app"></div><script src="/bundle.js"></script></body></html>`);});
    await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
    const base=`http://127.0.0.1:${server.address().port}`;
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
    const page=await browser.newPage({viewport:{width:390,height:844}});page.on("pageerror",error=>errors.push(error.message));
    await page.goto(`${base}/?mode=score&game=league-game&league=synthetic-league`);
    await page.getByRole("button",{name:"Record plate appearance",exact:true}).waitFor();
    assert.equal(await page.getByRole("heading",{name:"Set up a game",exact:true}).count(),0);
    assert.equal(await page.getByLabel("Choose a game",{exact:true}).locator("option").count(),1);
    assert.equal(await page.getByRole("region",{name:"Season statistics",exact:true}).isVisible(),false);
    assert.equal(await page.getByRole("button",{name:"Load audit history",exact:true}).isVisible(),false);
    await page.goto(`${base}/?mode=setup&league=synthetic-league`);
    await page.getByRole("heading",{name:"Set up a game",exact:true}).waitFor();
    assert.equal(await page.getByRole("button",{name:"Record plate appearance",exact:true}).count(),0);
    assert.equal(await page.getByLabel("Fence HR limit for this game",{exact:true}).inputValue(),"0");
    assert.equal(await page.getByLabel("Game kind",{exact:true}).isVisible(),false);
    assert.equal(await page.getByRole("region",{name:"Season statistics",exact:true}).count(),0);
    await page.goto(`${base}/?mode=setup&tournament=synthetic-cup`);
    const next=page.getByRole("form",{name:"Next game for Synthetic cup",exact:true});await next.waitFor();
    assert.equal(await next.getByLabel("Opponent",{exact:true}).isVisible(),true);
    assert.equal(await next.getByLabel("Game date",{exact:true}).isVisible(),false);
    assert.equal(await next.getByLabel("Fence HR limit for this game",{exact:true}).inputValue(),"2");
    await next.getByRole("button",{name:"Start Game 2",exact:true}).waitFor();
    assert.equal(await page.getByRole("button",{name:"Record plate appearance",exact:true}).count(),0);
    for(const width of [320,390,800,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);}
    await page.goto(`${base}/?mode=score&game=missing`);
    await page.getByText("That game is unavailable in this scorebook.",{exact:false}).waitFor();
    assert.equal(await page.getByRole("button",{name:"Record plate appearance",exact:true}).count(),0);
    assert.deepEqual(await page.evaluate(()=>window.__writes),[]);assert.deepEqual(errors,[]);
    console.log("PASS score/setup modes: selected competition isolation, no unrelated scoring during setup, inherited zero/2 limits, opponent-only tournament continuation, collapsed statistics/audit, missing-game denial and mobile overflow. Synthetic snapshot; no writes.");
  } finally{if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
