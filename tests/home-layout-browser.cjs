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
        const context=new URLSearchParams({team:p.teamId,season:p.seasonId,scope:p.scope,...(p.sample?{sample:'1',player:p.userId}:{})}).toString();
        createRoot(document.getElementById('app')).render(<><PlayerDashboard {...p}/><BottomNavigationView pathname={location.pathname} context={context}/></>);` },
      bundle: true, write: false, platform: "browser", jsx: "automatic",
      plugins: [{ name: "synthetic-home", setup(build) {
        build.onResolve({ filter: /^(next\/(navigation|link|image)|@\/app\/(login\/actions|club\/beverage-actions)|\.\/personal-alibis)$/ }, args => ({ path: args.path, namespace: "synthetic" }));
        build.onLoad({ filter: /.*/, namespace: "synthetic" }, args => ({ loader: "tsx", resolveDir: process.cwd(), contents:
          args.path === "next/navigation" ? "export const useRouter=()=>({refresh(){}});export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);" :
          args.path === "next/link" ? "import React from 'react';export default function Link({children,...props}){return <a {...props}>{children}</a>}" :
          args.path === "next/image" ? "import React from 'react';export default function Image({unoptimized,...props}){return <img {...props}/>}" :
          args.path === "./personal-alibis" ? "export function PersonalAlibis(){return null}" :
          args.path === "@/app/club/beverage-actions" ? "export async function beverageAction(){return {status:'unsupported'}}" :
          "export async function signout(){}"
        }));
      }}],
    });
    const css = fs.readFileSync("src/app/globals.css", "utf8");
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
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole("heading", { name: "Your game, Test Player." }).waitFor();
    assert.equal(await page.getByText("2 in credit", { exact: true }).isVisible(), true);
    assert.equal(await page.locator(".dashboard-notice").count(), 0);
    assert.equal(await page.getByRole("link", { name: "Explore sample history" }).count(), 0);
    assert.equal(await page.getByText("Other Synthetic Player", { exact: true }).count(), 0);
    assert.equal(await page.getByText("Other synthetic opponent", { exact: false }).count(), 0);
    assert.equal(await page.getByRole("heading", { name: "Team summary" }).count(), 0);
    assert.equal(await page.getByText("Season activity", { exact: true }).count(), 0);
    assert.equal(await page.getByRole("link", { name: "All player statistics" }).count(), 0);
    assert.match(await page.locator(".dashboard-metrics").innerText(), /HR\s+1/);
    assert.match(await page.locator(".dashboard-metrics").innerText(), /OBP%\s+25\.0%/);
    assert.match(await page.locator(".dashboard-metrics").innerText(), /Hits\s+1/);
    assert.match(await page.locator(".dashboard-metrics").innerText(), /RBI\s+3/);
    assert.equal(await page.evaluate(() => {
      const heading = document.querySelector("h1").getBoundingClientRect();
      const actions = document.querySelector(".competition-entry").getBoundingClientRect();
      const summary = document.querySelector(".dashboard-selected-context").closest("section").getBoundingClientRect();
      const controls = document.querySelector(".dashboard-context-panel").getBoundingClientRect();
      return heading.bottom <= actions.top && actions.bottom <= summary.top && summary.bottom <= controls.top && actions.bottom < 600;
    }), true);
    if (process.env.LAYOUT_SCREENSHOT) await page.screenshot({ path: process.env.LAYOUT_SCREENSHOT, fullPage: true });
    await page.getByLabel("Team", { exact: true }).selectOption("long");
    await page.getByLabel("Season", { exact: true }).selectOption("history");
    for (const width of [320,390,430,800,1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const bounds = await page.evaluate(() => ({ viewport: window.innerWidth, document: document.documentElement.scrollWidth, outside: Array.from(document.querySelectorAll('body *')).filter(el => el.getBoundingClientRect().right > window.innerWidth + 1).map(el => ({ tag: el.tagName, class: el.className, width: el.getBoundingClientRect().width, right: el.getBoundingClientRect().right })).slice(0, 15) }));
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
    await page.evaluate(() => { Object.defineProperty(navigator, "onLine", { configurable: true, value: false }); window.dispatchEvent(new Event("offline")); });
    await page.getByRole("status").getByText("Offline · displayed records may be out of date", { exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Refresh records" }).isDisabled(), true);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(".bottom-nav").getByRole("link", { name: "Stats", exact: true }).click();
    await page.getByRole("heading", { name: "Team leaders" }).waitFor();
    const leaders=page.getByRole('region',{name:'Team player leaderboard',exact:true});
    assert.equal(await leaders.locator('.leaderboard-summary button').count(),5);
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
    assert.deepEqual(errors, []);
    console.log(`PASS ${process.env.BROWSER_ENGINE || "chromium"} Home: heading/actions/summary before controls, complete long selected names at 320–1440px, native keyboard and form selection, own HR/credit only on signed-in Home, no brown notice or team activity, team/roster stats under bottom Stats, sample history under More with its sample notice, and offline refresh handling. Synthetic data only.`);
  } finally { if (browser) await browser.close(); if (server) await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
