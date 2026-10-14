// Actual React controls with synthetic, isolated RPC responses. No external writes.
const { chromium, webkit } = require("playwright");
const esbuild = require("esbuild"),
  fs = require("node:fs"),
  http = require("node:http"),
  assert = require("node:assert/strict");
(async () => {
  let browser, server;
  try {
    const build = await esbuild.build({
      stdin: {
        resolveDir: process.cwd(),
        loader: "tsx",
        contents: `
 import React from 'react';import{createRoot}from'react-dom/client';import{BeverageControls}from'./src/components/beverage-controls';import{DEFAULT_BOARD}from'./src/lib/scoring';
 const q=new URLSearchParams(location.search),teamId='00000000-0000-4000-8000-000000000010';
 window.__writes=[];window.__commits=0;window.__responses=new Map();window.__nextResult='accepted';
 window.__state={teamId,revision:0,finalized:!q.has('draft'),rules:q.has('draft')?null:DEFAULT_BOARD,canToggle:!q.has('guest'),participating:true,management:q.has('legacy')?undefined:{canEdit:!q.has('member'),lockedBy:q.has('draft')?null:'Synthetic Manager',lockedAt:q.has('draft')?null:'2026-10-14T11:00:00Z'}};
 window.__action=async request=>{
  if(request.type==='read')return q.has('unsupported')?{status:'unsupported'}:{status:'ok',data:{...window.__state}};
  window.__writes.push(request);await new Promise(r=>setTimeout(r,25));
  if(window.__responses.has(request.commandId))return{status:'accepted',duplicate:true};
  if(window.__nextResult==='conflict'){window.__nextResult='accepted';window.__state={...window.__state,revision:window.__state.revision+1,participating:false};return{status:'conflict'}};
  window.__state={...window.__state,revision:window.__state.revision+1,...(['finalize','replace'].includes(request.change.type)?{finalized:true,rules:request.change.rules,management:{canEdit:true,lockedBy:'Synthetic Manager',lockedAt:'2026-10-14T11:05:00Z'}}:{participating:request.change.participating})};
  window.__commits++;window.__responses.set(request.commandId,true);
  if(window.__nextResult==='uncertain'){window.__nextResult='accepted';return{status:'uncertain',commandId:request.commandId}};
  return{status:'accepted',duplicate:false};
 };
 const root=createRoot(document.getElementById('app'));window.__render=team=>root.render(<BeverageControls teamId={team||teamId} teamSettings={q.has('team')} />);window.__render();
 `,
      },
      bundle: true,
      write: false,
      jsx: "automatic",
      platform: "browser",
      plugins: [
        {
          name: "synthetic-rpc",
          setup(build) {
            build.onResolve({ filter: /club\/beverage-actions$/ }, () => ({
              path: "beverage-action",
              namespace: "synthetic",
            }));
            build.onLoad({ filter: /.*/, namespace: "synthetic" }, () => ({
              contents:
                "export const beverageAction=input=>window.__action(input)",
              loader: "js",
            }));
          },
        },
      ],
    });
    const css = fs.readFileSync("src/app/globals.css", "utf8");
    server = http.createServer((req, res) => {
      res.setHeader("Content-Type", "text/html");
      res.end(
        '<html><meta name="viewport" content="width=device-width, initial-scale=1"><style>' +
          css +
          '</style><body><main class="connected-wrap"><div id="app"></div></main><script>' +
          build.outputFiles[0].text +
          "</script></body></html>",
      );
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const base = "http://127.0.0.1:" + server.address().port;
    browser = await (
      process.env.BROWSER_ENGINE === "webkit" ? webkit : chromium
    ).launch({
      headless: true,
      ...(process.env.BROWSER_EXECUTABLE
        ? { executablePath: process.env.BROWSER_EXECUTABLE }
        : {}),
      args: process.env.BROWSER_ENGINE === "webkit" ? [] : ["--no-sandbox"],
    });
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.getByRole("button", { name: "Opt out", exact: true }).waitFor();
    assert.equal(
      await page.locator("select,input,details").count(),
      0,
      "personal choice has no menu or form",
    );
    for (const width of [320, 375, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      const box = await page
        .getByRole("button", { name: "Opt out", exact: true })
        .boundingBox();
      assert(box.width >= 44 && box.height >= 44);
    }
    await page.evaluate(() => {
      const button = [...document.querySelectorAll("button")].find(
        (b) => b.textContent === "Opt out",
      );
      button.click();
      button.click();
    });
    await page
      .getByRole("button", { name: "Participate", exact: true })
      .waitFor();
    assert.equal(await page.evaluate(() => window.__writes.length), 1);
    assert.equal(
      await page.evaluate(() => window.__state.participating),
      false,
    );
    await page
      .getByRole("button", { name: "Participate", exact: true })
      .click();
    await page.getByRole("button", { name: "Opt out", exact: true }).waitFor();
    assert.equal(await page.evaluate(() => window.__state.participating), true);
    await page.evaluate(() => (window.__nextResult = "uncertain"));
    await page.getByRole("button", { name: "Opt out", exact: true }).click();
    await page
      .getByRole("button", { name: "Retry the same change", exact: true })
      .waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "Opt out", exact: true })
        .isDisabled(),
      true,
    );
    await page
      .getByRole("button", { name: "Retry the same change", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Participate", exact: true })
      .waitFor();
    assert.equal(
      await page.evaluate(
        () =>
          window.__writes.at(-1).commandId === window.__writes.at(-2).commandId,
      ),
      true,
    );
    assert.equal(
      await page.evaluate(() => window.__commits),
      3,
      "uncertain retry does not commit twice",
    );
    await page.evaluate(() => window.dispatchEvent(new Event("offline"))); // navigator stays online; test actual offline event separately.
    await page.evaluate(() => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event("offline"));
    });
    assert.equal(
      await page
        .getByRole("button", { name: "Participate", exact: true })
        .isDisabled(),
      true,
    );
    await page.goto(base + "?team&draft");
    await page.getByRole('button',{name:'Set Rules',exact:true}).click();
    await page
      .getByRole("button", {
        name: "Finalize team Beverage Rules",
        exact: true,
      })
      .waitFor();
    assert.equal(await page.locator("input[type=number]").count(), 7);
    await page
      .getByRole("button", {
        name: "Finalize team Beverage Rules",
        exact: true,
      })
      .click();
    await page.locator(".beverage-rule-list").waitFor();
    assert.equal(await page.locator("input,select").count(), 0);
    assert.equal(
      await page
        .getByRole("button", {
          name: "Finalize team Beverage Rules",
          exact: true,
        })
        .count(),
      0,
    );
    assert.equal(await page.locator(".beverage-rule-list dd").count(), 7);
    await page.getByText('Locked by Synthetic Manager',{exact:false}).waitFor();
    await page.getByRole('button',{name:'Change',exact:true}).click();
    await page.getByLabel('Strikeout',{exact:true}).fill('4');
    await page.getByRole('button',{name:'Save Beverage Rules',exact:true}).click();
    await page.getByRole('button',{name:'Change',exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>window.__writes.at(-1).change.type),'replace');
    assert.equal(await page.evaluate(()=>window.__writes.at(-1).change.rules.strikeout),4);
    assert.equal(await page.locator('input').count(),0);
    for(const width of [320,390,800,1440]){
      await page.setViewportSize({width,height:900});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    }
    await page.getByRole('button',{name:'Change',exact:true}).click();
    assert.equal(await page.getByLabel('Strikeout',{exact:true}).inputValue(),'4');
    await page.getByRole('button',{name:'Cancel',exact:true}).click();
    await page.goto(base+'?team&member');
    await page.getByText('Locked by Synthetic Manager',{exact:false}).waitFor();
    assert.equal(await page.getByRole('button',{name:'Change',exact:true}).count(),0,'member cannot edit');
    assert.equal(await page.locator('input').count(),0);
    assert.equal(await page.locator('.beverage-rule-list dd').count(),7);
    await page.goto(base+'?team&legacy');
    await page.locator('.beverage-rule-list').waitFor();
    assert.equal(await page.getByRole('button',{name:'Change',exact:true}).count(),0,'missing manager capability fails closed');

    await page.goto(base + "?guest");
    await page
      .getByText(
        "Sign in with your account-linked player to choose participation.",
      )
      .waitFor();
    assert.equal(await page.getByRole("button").count(), 0);
    await page.goto(base + "?unsupported");
    await page.waitForTimeout(150);
    assert.equal(
      await page.locator("#app").textContent(),
      "",
      "unapplied migration never exposes a fake toggle",
    );
    await page.goto(base);
    await page.getByRole("button", { name: "Opt out", exact: true }).waitFor();
    await page.evaluate(() => (window.__nextResult = "conflict"));
    await page.getByRole("button", { name: "Opt out", exact: true }).click();
    await page
      .getByText(
        "Settings changed. Review the current choice before trying again.",
      )
      .waitFor();
    assert.equal(await page.evaluate(() => window.__commits), 0);
    assert.deepEqual(errors, []);
    console.log(
      "Beverage controls: one-click opt-out/rejoin, duplicate protection, same-ID retry, offline/conflict, finalized read-only rules, ownership fallback and 320–1440px passed.",
    );
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
