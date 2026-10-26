// Actual Home component and native selectors; isolated synthetic account only.
const { chromium, webkit } = require("playwright");
const esbuild = require("esbuild");
const fs = require("node:fs");
const http = require("node:http");
const assert = require("node:assert/strict");
(async () => {
  let server, browser;
  const errors = [];
  try {
    const bundle = await esbuild.build({
      stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
        import React from 'react';import{createRoot}from'react-dom/client';import{PlayerDashboard}from'./src/components/player-dashboard';import{BottomNavigationView}from'./src/components/bottom-navigation';import{emptyTotals}from'./src/lib/scoring';
        const long='M3-5 Synthetic Test with an exceptionally long team name';
        const data={archived:false,roster:[{id:'player',user_id:'synthetic-user',display_name:'Test Player',is_guest:false},{id:'teammate',user_id:'other-user',display_name:'Other Synthetic Player',is_guest:false}],snapshot:{teamId:'team',seasonId:'season',scope:'Overall',games:[{game:{id:'other-game',kind:'League',opponent:'Other synthetic opponent',completed:false,next_batter_position:0},lineup:['teammate'],playedOn:'2026-10-13'}],totals:{player:{...emptyTotals(),PA:4,AB:4,H:1,HR:1,RBI:3},teammate:{...emptyTotals(),PA:20,AB:20,H:9,HR:9,RBI:9}},board:{player:-2},tournaments:[],leagues:[]}};
        const p={route:location.pathname.slice(1),sample:location.search.includes('sample=1'),userId:'synthetic-user',teams:[{id:'team',name:'M3-5 Synthetic Test'},{id:'long',name:long}],seasons:[{id:'season',name:'M3-5 Synthetic Season',archived:false},{id:'history',name:'Synthetic Season with an exceptionally long history name',archived:true}],teamId:'team',seasonId:'season',scope:'Overall',loaded:data};
        const fixtureQuery=new URLSearchParams(location.search);
        if(fixtureQuery.has('owed'))data.snapshot.board.player=4;
        if(fixtureQuery.has('settled'))data.snapshot.board.player=0;
        if(fixtureQuery.has('missing-balance'))delete data.snapshot.board.player;
        if(fixtureQuery.has('no-stats'))delete data.snapshot.totals.player;
        if(fixtureQuery.has('unlinked'))data.roster[0].user_id='unlinked-user';
        const context=new URLSearchParams({team:p.teamId,season:p.seasonId,scope:p.scope,...(p.sample?{sample:'1',player:p.userId}:{})}).toString();
        createRoot(document.getElementById('app')).render(<><PlayerDashboard {...p}/><BottomNavigationView pathname={location.pathname} context={context}/></>);` },
      bundle: true, write: false, platform: "browser", jsx: "automatic",
      plugins: [{ name: "synthetic-home", setup(build) {
        build.onResolve({ filter: /^(next\/(navigation|link|image)|@\/app\/(login\/actions|club\/beverage-actions)|\.\/personal-alibis)$/ }, args => ({ path: args.path, namespace: "synthetic" }));
        build.onLoad({ filter: /.*/, namespace: "synthetic" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents:
          args.path === "next/navigation" ? "const router={refresh(){window.__refreshes=(window.__refreshes||0)+1}};export const useRouter=()=>router;export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);" :
          args.path === "next/link" ? "import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}" :
          args.path === "next/image" ? "import React from 'react';export default function Image({unoptimized,...props}){return <img {...props}/>}" :
          args.path === "./personal-alibis" ? "export function PersonalAlibis(){return null}" :
          args.path === "@/app/club/beverage-actions" ? "export async function beverageAction(){return {status:'unsupported'}}" :
          "export async function signout(){}"
        }));
      }}],
    });
    const fonts=[400,700].map(weight=>'@font-face{font-family:Inter;font-style:normal;font-weight:'+weight+';font-display:swap;src:url(data:font/woff2;base64,'+fs.readFileSync('node_modules/@fontsource/inter/files/inter-latin-'+weight+'-normal.woff2').toString('base64')+') format("woff2")}').join('');
    const css = fonts+fs.readFileSync("src/app/globals.css", "utf8");
    server = http.createServer((req, res) => {
      if (req.url.startsWith("/brand/")) { res.setHeader("content-type", "image/webp"); res.end(fs.readFileSync("public/brand/diamond-alibi-primary.webp")); return; }
      res.setHeader("content-type", req.url === "/bundle.js" ? "text/javascript" : "text/html");
      res.end(req.url === "/bundle.js" ? bundle.outputFiles[0].text : `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic Home</title><style>${css}</style></head><body><div id="app"></div><script src="/bundle.js"></script></body></html>`);
    });
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    const engine = process.env.BROWSER_ENGINE === "webkit" ? webkit : chromium;
    browser = await engine.launch({ headless: true, ...(engine === chromium && process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, ...(engine === webkit ? { isMobile: true, hasTouch: true } : {}) });
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(() => {
      window.__refreshes=0;window.__polls=0;
      const original=window.setInterval;
      window.setInterval=(fn,delay,...args)=>{if(delay===15000)window.__polls++;return original(fn,delay,...args)};
    });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole("heading", { name: "Your game, Test Player." }).waitFor();
    await page.evaluate(()=>document.fonts.ready);
    assert.match(await page.locator('.home-stat').last().innerText(),/BEVs\s+-2/);
    assert.equal(await page.locator('.home-stat-note').count(),0,'Compact total tiles have no balance qualifiers or blank note rows');
    assert.equal(await page.locator(".dashboard-notice").count(), 0);
    assert.equal(await page.getByRole("link", { name: "Explore sample history" }).count(), 0);
    assert.equal(await page.getByText("Other Synthetic Player", { exact: true }).count(), 0);
    assert.equal(await page.getByText("Other synthetic opponent", { exact: false }).count(), 0);
    assert.equal(await page.getByRole("heading", { name: "Team summary" }).count(), 0);
    assert.equal(await page.getByText("Season activity", { exact: true }).count(), 0);
    assert.equal(await page.getByRole("link", { name: "All player statistics" }).count(), 0);
    assert.match(await page.locator(".dashboard-metrics").innerText(), /HRs\s+1/);
    assert.match(await page.locator(".dashboard-metrics").innerText(), /OBP\s+\.250/);
    assert.match(await page.locator(".dashboard-metrics").innerText(), /Hits\s+1/);
    assert.match(await page.locator(".dashboard-metrics").innerText(), /RBIs\s+3/);
    assert.equal(await page.evaluate(() => {
      const heading = document.querySelector("h1").getBoundingClientRect();
      const actions = document.querySelector(".competition-entry").getBoundingClientRect();
      const summary = document.querySelector(".dashboard-selected-context").closest("section").getBoundingClientRect();
      const controls = document.querySelector(".dashboard-context-panel").getBoundingClientRect();
      return heading.bottom <= actions.top && actions.bottom <= summary.top && summary.bottom <= controls.top && actions.bottom < 600;
    }), true);
    await page.addScriptTag({path:require.resolve('axe-core')});
    assert.deepEqual(await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[]);
    if (process.env.LAYOUT_SCREENSHOT) {
      // A tall capture keeps fixed navigation below the controls being reviewed.
      await page.setViewportSize({width:390,height:1200});
      await page.screenshot({path:process.env.LAYOUT_SCREENSHOT,fullPage:true});
      if(process.env.SUMMARY_SCREENSHOT)await page.locator('.home-season-card').screenshot({path:process.env.SUMMARY_SCREENSHOT});
      if(process.env.CONTEXT_SCREENSHOT)await page.locator('.dashboard-context-panel').screenshot({path:process.env.CONTEXT_SCREENSHOT});
      await page.setViewportSize({width:390,height:844});
    }
    await page.getByLabel("Team", { exact: true }).selectOption("long");
    await page.getByLabel("Season", { exact: true }).selectOption("history");
    for (const width of [320,390,430,800,1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const bounds = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, outside: Array.from(document.querySelectorAll('body *')).filter(el => el.getBoundingClientRect().right > window.innerWidth + 1).map(el => ({ tag: el.tagName, class: el.className, width: el.getBoundingClientRect().width, right: el.getBoundingClientRect().right })).slice(0, 15) }));
      const summaryBounds=await page.locator('.home-season-card').evaluate(card=>{const summary=card.getBoundingClientRect(),actions=document.querySelector('.competition-entry').getBoundingClientRect();return{left:summary.left,right:summary.right,center:(summary.left+summary.right)/2,actionsLeft:actions.left,actionsRight:actions.right,actionsCenter:(actions.left+actions.right)/2}});
      assert(Math.abs(summaryBounds.left-summaryBounds.actionsLeft)<1 && Math.abs(summaryBounds.right-summaryBounds.actionsRight)<1 && Math.abs(summaryBounds.center-summaryBounds.actionsCenter)<1,'Home summary fills and centers in the available content width at '+width+'px: '+JSON.stringify(summaryBounds));
      if(width===1440 && process.env.DESKTOP_SCREENSHOT)await page.screenshot({path:process.env.DESKTOP_SCREENSHOT,fullPage:true});
      const rows=await page.locator('.home-stat-row').evaluateAll(rows=>rows.map(row=>Array.from(row.children).map(tile=>{const r=tile.getBoundingClientRect();const label=tile.querySelector('dt'),value=tile.querySelector('strong');const lr=label.getBoundingClientRect(),vr=value.getBoundingClientRect();return{label:label.textContent,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,labelCenter:(lr.left+lr.right)/2,valueCenter:(vr.left+vr.right)/2,center:(r.left+r.right)/2}})));
      assert.deepEqual(rows.map(row=>row.map(tile=>tile.label)),[['OBP','Reach Base %'],['Hits','RBIs','HRs','BEVs']]);
      for(const row of rows)assert(row.every(tile=>Math.abs(tile.top-row[0].top)<1&&Math.abs(tile.width-row[0].width)<1&&Math.abs(tile.height-row[0].height)<1&&Math.abs(tile.labelCenter-tile.center)<1&&Math.abs(tile.valueCenter-tile.center)<1),'Equal centered statistic tiles at '+width+'px: '+JSON.stringify(rows));
      assert(rows[0][0].bottom<rows[1][0].top,'Rates stay on the first row');
      assert.equal(await page.locator('.home-stat-row--counts dt').last().evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return range.getClientRects().length}),1,'BEVs stays on one line with the real Inter font at '+width+'px');
      const controls=await page.locator('.dashboard-context-panel--home .dashboard-select, .dashboard-context-action > button').evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect();return{left:r.left,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}));
      assert.equal(controls.length,4);
      assert(controls.every(box=>Math.abs(box.width-controls[0].width)<1 && box.height>=48), 'Two equal columns with accessible controls at '+width+'px: '+JSON.stringify(controls));
      for(const start of [0,2])assert(Math.abs(controls[start].top-controls[start+1].top)<1 && Math.abs(controls[start].height-controls[start+1].height)<1,'Controls align within each row at '+width+'px');
      assert(Math.abs(controls[0].left-controls[2].left)<1 && Math.abs(controls[1].left-controls[3].left)<1 && controls[2].top>controls[0].bottom,'Context stays in two columns at '+width+'px');
      if(width<=430)assert(controls[2].height<controls[0].height,'Short options and action do not inherit the long-name row height at '+width+'px');
      assert.equal(bounds.document <= bounds.viewport, true, `${width}px overflow: ${JSON.stringify(bounds)}`);
      assert.equal(await page.locator(".dashboard-select-value").evaluateAll(values => values.every(el => {
        const text = document.createRange(); text.selectNodeContents(el);
        const box = el.getBoundingClientRect();
        return getComputedStyle(el).textOverflow !== "ellipsis" && el.scrollHeight <= el.clientHeight && Array.from(text.getClientRects()).every(line => line.left >= box.left - 1 && line.right <= box.right + 1);
      })), true, `Complete selected names fit at ${width}px`);
    }
    assert.equal(await page.locator(".dashboard-select-value").first().innerText(), "M3-5 Synthetic Test with an exceptionally long team name");
    assert.match(await page.locator(".dashboard-select-value").nth(1).innerText(), /long history name · history$/);
    await page.getByLabel("Statistics view", { exact: true }).focus();
    await page.keyboard.press("ArrowDown");
    assert.equal(await page.getByLabel("Statistics view", { exact: true }).inputValue(), "League");
    assert.equal(await page.locator(".dashboard-select-value").nth(2).innerText(), "League");
    assert.equal(await page.locator("form.dashboard-context").evaluate(form => new FormData(form).get("team")), "long");
    assert.equal(await page.evaluate(()=>window.__polls),0,'Home never starts recurring polling');
    assert.equal(await page.getByText('refreshes every 15 seconds',{exact:false}).count(),0);
    await page.getByRole('button',{name:'Refresh records',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__refreshes),1,'Manual refresh still works');
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'))});
    assert.equal(await page.evaluate(()=>window.__refreshes),1,'Hidden Home does not fetch');
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'));document.dispatchEvent(new Event('visibilitychange'))});
    await page.waitForFunction(()=>window.__refreshes===2);
    assert.equal(await page.evaluate(()=>window.__refreshes),2,'Return refresh events are coalesced');
    await page.evaluate(() => { Object.defineProperty(navigator, "onLine", { configurable: true, value: false }); window.dispatchEvent(new Event("offline")); });
    await page.getByRole("status").getByText("Offline · displayed records may be out of date", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Refresh records" }).isDisabled(), true);
    await page.waitForTimeout(1100);
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});Object.defineProperty(navigator,'onLine',{configurable:true,value:true});window.dispatchEvent(new Event('online'))});
    assert.equal(await page.evaluate(()=>window.__refreshes),2,'Reconnect stays quiet while hidden');
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'))});
    await page.waitForFunction(()=>window.__refreshes===3);
    await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).some(button=>button.textContent==='Refresh records'&&!button.disabled));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".bottom-nav").getByRole("link", { name: "Stats", exact: true }).click();
    await page.getByRole("heading", { name: "Team leaders" }).waitFor();
    const leaders=page.getByRole('region',{name:'Team player leaderboard',exact:true});
    assert.equal(await leaders.locator('.leaderboard-summary button').count(),7);
    assert.equal(await page.locator('.dashboard-table').count(),0,'leaders replace the mixed statistics table');
    assert.equal(await leaders.locator('.leaderboard-scope').textContent(),'M3-5 Synthetic Test · M3-5 Synthetic Season · Overall');
    await leaders.getByRole('button',{name:'View HR rankings',exact:true}).click();
    assert.deepEqual(await leaders.locator('.leaderboard-player strong').allTextContents(),['Other Synthetic Player','Test Player']);
    assert.deepEqual(await leaders.locator('.leaderboard-counts strong').allTextContents(),['9','1']);
    await leaders.getByRole('button',{name:'← Back to leaders',exact:true}).click();
    for(const width of [320,390,800,1440]){
      await page.setViewportSize({width,height:900});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert(await leaders.getByRole('button').evaluateAll(buttons=>buttons.every(button=>button.getBoundingClientRect().height>=44&&button.getBoundingClientRect().width>=44)));
    }
    await page.locator(".bottom-nav").getByRole("link", { name: "More", exact: true }).click();
    await page.getByRole("link", { name: "Explore sample history" }).click();
    await page.locator(".dashboard-notice").getByText("Sample history", { exact: false }).waitFor();
    await page.locator('.bottom-nav').getByRole('link',{name:'Home',exact:true}).click();
    await page.getByRole('heading',{name:'Your game, Test Player.',exact:true}).waitFor();
    assert.equal(await page.getByLabel('Sample player',{exact:true}).count(),1);
    assert.equal(await page.getByRole('button',{name:'Refresh records',exact:true}).count(),0);
    await page.setViewportSize({width:320,height:844});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Sample Home still fits');
    for(const [query,value] of [['owed','4'],['settled','0'],['missing-balance','—']]){
      await page.goto('http://127.0.0.1:'+server.address().port+'/?'+query+'=1');
      const beverage=page.locator('.home-stat-row--counts .home-stat').last();
      await beverage.waitFor();assert.equal(await beverage.locator('strong').innerText(),value);assert.equal(await beverage.innerText(),'BEVs\n'+value,'BEVs shows only its label and signed balance');
    }
    for(const [query,message] of [['no-stats','No recorded plate appearances in this view.'],['unlinked','No player record is linked to this account. Use your player-specific membership invite to link existing roster history.']]){
      await page.goto('http://127.0.0.1:'+server.address().port+'/?'+query+'=1');await page.getByText(message,{exact:true}).waitFor();
      assert.equal(await page.locator('.home-stat-row').count(),0,'Missing player statistics are never shown as zero');
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${process.env.BROWSER_ENGINE || "chromium"} Home: heading/actions/summary before controls, complete long selected names at 320–1440px, native keyboard and form selection, own HR/credit only on signed-in Home, no brown notice or team activity, team/roster stats under bottom Stats, sample history under More with its sample notice, two rate tiles above four equal centered total/balance tiles, owed/credit/settled/missing balance and unlinked/empty states, automated accessibility, two-column content-sized controls, decimal OBP, no Home polling, quiet return/reconnect refresh and offline refresh handling. Synthetic data only.`);
  } finally { if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
