// Real components, local synthetic services. No hosted writes or real roster data.
const { chromium, webkit } = require("playwright"),
  esbuild = require("esbuild"),
  fs = require("node:fs"),
  http = require("node:http"),
  assert = require("node:assert/strict");
(async () => {
  let browser, server;
  const errors = [];
  try {
    const bundle = await esbuild.build({
      stdin: {
        resolveDir: process.cwd(),
        loader: "tsx",
        contents: `
 import React from 'react';import{createRoot}from'react-dom/client';import{CompetitionPage}from'./src/components/competition-page';
 const q=new URLSearchParams(location.search);window.__writes=[];window.__commits=0;window.__fault='';window.__receipts=new Map();window.__readFail=false;
 window.__data={archived:q.has('season-archived'),roster:[],bands:[],participation:[],leagueBands:[],snapshot:{teamId:'team',seasonId:'season',scope:'Overall',totals:{},board:{},capabilities:q.has('unsupported')?{}:{tournamentStartTime:true},leagues:[],tournaments:[{id:'cup',name:'Synthetic November Tournament',revision:2,fenceLimit:3,guaranteedGames:3,archived:q.has('archived'),firstGameTime:q.has('scheduled')?'08:00':null,firstGameZone:'America/Chicago'}],games:[1,2].map(n=>({game:{id:'game-'+n,day_id:'day',tournament_id:'cup',kind:'Tournament',opponent:n===1?'Synthetic Opener':'Synthetic Next Opponent',tournament_game_number:n,completed:false,next_batter_position:0},playedOn:'2026-11-07',dayRevision:1,tournamentRevision:2,lineup:[],rules:{version_label:'Synthetic saved rules',fence_limit:3},evaluation:{rows:[],totals:{},fenceUsed:0}}))}};
 window.__action=async(input)=>{
  window.__writes.push(input);await new Promise(r=>setTimeout(r,10));
  if(window.__receipts.has(input.commandId))return{status:'ok',data:window.__receipts.get(input.commandId)};
  const t=window.__data.snapshot.tournaments[0];
  if(window.__fault==='conflict'){t.revision++;t.firstGameTime='09:30';window.__fault='';return{status:'ok',data:{status:'conflict',revision:t.revision}};}
  t.firstGameTime=input.time;t.firstGameZone=input.zone;t.revision++;window.__commits++;
  const receipt={status:'accepted',revision:t.revision};window.__receipts.set(input.commandId,receipt);
  if(window.__fault==='uncertain'){window.__fault='';return{status:'uncertain',commandId:input.commandId}};
  return{status:'ok',data:receipt};
 };
 const root=createRoot(document.getElementById('app'));window.__render=()=>root.render(<CompetitionPage kind='Tournament' id='cup' settings={!q.has('detail')} data={{route:'tournaments',sample:q.has('sample'),userId:'user',teams:[{id:'team',name:'Synthetic Team'}],seasons:[{id:'season',name:'Synthetic season',archived:false}],teamId:'team',seasonId:'season',scope:'Overall',loaded:structuredClone(window.__data)}}/>);window.__render();
 `,
      },
      bundle: true,
      write: false,
      platform: "browser",
      jsx: "automatic",
      plugins: [
        {
          name: "synthetic-services",
          setup(build) {
            build.onResolve(
              {
                filter:
                  /^(next\/(navigation|link|image)|@\/app\/(club\/scoring-actions|login\/actions))$/,
              },
              (args) => ({ path: args.path, namespace: "fixture" }),
            );
            build.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
              loader: "tsx",
              resolveDir: process.cwd(),
              contents:
                args.path === "next/navigation"
                  ? "export const useRouter=()=>({refresh(){window.__render()},push(){}});export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);"
                  : args.path === "next/link"
                    ? "import React from'react';export default function Link({children,...p}){return <a {...p}>{children}</a>}"
                    : args.path === "next/image"
                      ? "import React from'react';export default function Image({unoptimized,...p}){return <img {...p}/>}"
                      : args.path === "@/app/login/actions"
                        ? "export async function signout(){}"
                        : "export const scoringAction=input=>window.__action(input);export const loadScorebook=async()=>window.__readFail?{status:'unavailable'}:{status:'ok',data:structuredClone(window.__data)}",
            }));
          },
        },
      ],
    });
    const css = fs.readFileSync("src/app/globals.css", "utf8");
    server = http.createServer((req, res) => {
      if (req.url.startsWith("/brand/")) {
        res.setHeader("content-type", "image/png");
        res.end(fs.readFileSync("public/brand/diamond-alibi-icon-64.png"));
        return;
      }
      res.setHeader("content-type", "text/html");
      res.end(
        '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local first game time preview</title><style>' +
          css +
          '</style><body><div id="app"></div><script>' +
          bundle.outputFiles[0].text +
          "</script></body></html>",
      );
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const base = "http://127.0.0.1:" + server.address().port;
    const engine = process.env.BROWSER_ENGINE === "webkit" ? webkit : chromium;
    browser = await engine.launch({
      headless: true,
      ...(engine === chromium && process.env.BROWSER_EXECUTABLE
        ? { executablePath: process.env.BROWSER_EXECUTABLE }
        : {}),
    });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      timezoneId: "Asia/Tokyo",
    });
    page.on("pageerror", (e) => errors.push(e.message));
    const save = () =>
      page
        .getByRole("button", { name: "Save first game time", exact: true })
        .click();
    await page.goto(base);
    await page.getByLabel("Start time", { exact: true }).fill("08:00");
    await save();
    await page
      .getByText("First game start time saved.", { exact: true })
      .waitFor();
    assert.equal(await page.evaluate(() => window.__commits), 1);
    assert.equal(
      await page.getByLabel("Time zone", { exact: true }).inputValue(),
      "America/Chicago",
    );
    await page.reload();
    assert.equal(
      await page.getByLabel("Start time", { exact: true }).inputValue(),
      "",
      "fresh synthetic page starts without an invented saved time",
    );
    await page.goto(base + "?scheduled");
    assert.equal(
      await page.getByLabel("Start time", { exact: true }).inputValue(),
      "08:00",
    );
    await page.getByLabel("Start time", { exact: true }).fill("");
    await save();
    await page
      .getByText("First game start time cleared.", { exact: true })
      .waitFor();
    await page.goto(base);
    await page.evaluate(() => (window.__fault = "uncertain"));
    await page.getByLabel("Start time", { exact: true }).fill("08:00");
    await save();
    await page
      .getByRole("button", { name: "Retry the same start time", exact: true })
      .waitFor();
    assert.equal(
      await page.getByLabel("Start time", { exact: true }).isDisabled(),
      true,
    );
    await page
      .getByRole("button", { name: "Retry the same start time", exact: true })
      .click();
    await page
      .getByText("First game start time saved.", { exact: true })
      .waitFor();
    assert.equal(await page.evaluate(() => window.__commits), 1);
    assert.equal(
      await page.evaluate(
        () => window.__writes[0].commandId === window.__writes[1].commandId,
      ),
      true,
    );
    await page.goto(base);
    await page.evaluate(() => (window.__fault = "conflict"));
    await page.getByLabel("Start time", { exact: true }).fill("08:00");
    await save();
    await page
      .getByText(
        "Tournament settings changed. Latest start time loaded; review before saving again.",
        { exact: true },
      )
      .waitFor();
    assert.equal(
      await page.getByLabel("Start time", { exact: true }).inputValue(),
      "09:30",
    );
    assert.equal(await page.evaluate(() => window.__commits), 0);
    await page.goto(base);
    await page.evaluate(() => (window.__readFail = true));
    await page.getByLabel("Start time", { exact: true }).fill("08:00");
    await save();
    await page
      .getByRole("button", { name: "Retry the same start time", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByText("First game start time saved.", { exact: true })
        .count(),
      0,
      "read failure never claims Saved",
    );
    await page.goto(base);
    await page.evaluate(() =>
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: false,
      }),
    );
    await save();
    await page
      .getByText("Offline. Reconnect before saving the start time.", {
        exact: true,
      })
      .waitFor();
    assert.equal(await page.evaluate(() => window.__writes.length), 0);
    for (const query of ["archived", "season-archived"]) {
      await page.goto(base + "?" + query);
      assert.equal(
        await page
          .getByRole("button", { name: "Save first game time", exact: true })
          .isDisabled(),
        true,
      );
    }
    for (const query of ["sample", "unsupported"]) {
      await page.goto(base + "?" + query);
      assert.equal(
        await page
          .getByRole("region", { name: "First game start time", exact: true })
          .count(),
        0,
      );
    }
    await page.goto(base + "?detail&scheduled");
    const rows = page.locator(".game-entry-row");
    await rows.first().waitFor();
    assert(
      (await rows.nth(0).innerText()).includes(
        "Game 1 · 2026-11-07 · 8:00 AM Central",
      ),
    );
    assert(
      !(await rows.nth(1).innerText()).includes("AM"),
      "Game 2 does not inherit Game 1 time",
    );
    for (const width of [320, 390, 800, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        "detail fits " + width,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    if (process.env.TIME_DETAIL_SCREENSHOT)
      await page.screenshot({
        path: process.env.TIME_DETAIL_SCREENSHOT,
        fullPage: true,
      });
    await page.goto(base + "?scheduled");
    for (const width of [320, 390, 800, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        "settings fit " + width,
      );
    }
    await page.setViewportSize({ width: 320, height: 900 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "24px";
    });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "large text fits",
    );
    await page.getByLabel("Time zone", { exact: true }).focus();
    await page.keyboard.press("Tab");
    assert.equal(
      await page
        .getByRole("button", { name: "Save first game time", exact: true })
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
    });
    if (process.env.TIME_SETTINGS_SCREENSHOT)
      await page.screenshot({
        path: process.env.TIME_SETTINGS_SCREENSHOT,
        fullPage: true,
      });
    assert.deepEqual(errors, []);
    console.log(
      "PASS browser: save/clear, no false Saved, same-ID retry, conflict, offline, archived/sample/unsupported, venue zone on Tokyo device, first-game-only display, keyboard and320–1440px. Synthetic only.",
    );
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((r) => server.close(r));
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
