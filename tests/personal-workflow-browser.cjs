// Actual React controls, synthetic transport only. No hosted data or sharing.
const { chromium } = require("playwright");
const esbuild = require("esbuild");
const fs = require("node:fs");
const http = require("node:http");
const assert = require("node:assert/strict");
(async () => {
  let server, browser;
  let items = [], lostReceipt = false;
  const competitionCalls = [];
  const errors = [];
  try {
    const bundle = await esbuild.build({
      stdin: {
        contents: `import React from 'react';import{createRoot}from'react-dom/client';import{AlibiEditor}from'./src/components/alibi-editor';import{CompetitionForm}from'./src/components/competition-form';
          const post=async(path,input)=>{const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(input)});return r.json()};
          window.__routes=[];window.__competition=(input)=>post('/competition',input);window.__loadCompetition=()=>post('/competition-load',{});
          post('/list',{}).then(initial=>createRoot(document.getElementById('app')).render(<main className="connected-wrap"><AlibiEditor initial={initial} saveAction={input=>post('/save',input)} reloadAction={()=>post('/list',{})}/><section className="card detail-card"><h2>Synthetic league setup</h2><CompetitionForm team="00000000-0000-4000-8000-000000000001" season="00000000-0000-4000-8000-000000000002" kind="League" archived={false}/><CompetitionForm team="00000000-0000-4000-8000-000000000001" season="00000000-0000-4000-8000-000000000002" kind="League" archived={false} existing={{id:'fixed-league',name:'Fixed synthetic league',fenceLimit:2}}/></section></main>));`,
        resolveDir: process.cwd(), loader: "tsx",
      },
      bundle: true, write: false, platform: "browser", jsx: "automatic",
      plugins: [{ name: "synthetic-navigation-and-actions", setup(build) {
        build.onResolve({ filter: /^(next\/navigation|@\/app\/club\/scoring-actions)$/ }, args => ({path:args.path,namespace:"synthetic"}));
        build.onLoad({filter:/.*/,namespace:"synthetic"}, args => ({contents:args.path === "next/navigation"
          ? "export const useRouter=()=>({push:(path)=>window.__routes.push(path),refresh(){}});"
          : "export const scoringAction=(input)=>window.__competition(input);export const loadScorebook=()=>window.__loadCompetition();"}));
      }}],
    });
    const css = fs.readFileSync("src/app/globals.css", "utf8");
    server = http.createServer((req,res) => {
      if (req.method === "GET") {
        res.setHeader("content-type",req.url === "/bundle.js" ? "text/javascript" : "text/html");
        res.end(req.url === "/bundle.js" ? bundle.outputFiles[0].text : `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic personal workflow</title><style>${css}</style></head><body><div id="app"></div><script src="/bundle.js"></script></body></html>`);
        return;
      }
      let raw="";req.on("data",chunk=>raw+=chunk);req.on("end",()=>{
        const input=JSON.parse(raw);let result;
        if(req.url === "/list") result={status:"ok",items,hasMore:false};
        else if(req.url === "/save") {
          const prior=items.find(i=>i.id===input.id);
          if(input.action === "delete") {
            if(prior && prior.revision!==input.revision) result={status:"conflict"};
            else {items=items.filter(i=>i.id!==input.id);result={status:"deleted"};}
          } else if(prior && prior.commandId===input.commandId) result={status:"saved",item:prior};
          else if((prior?.revision ?? 0)!==input.revision) result={status:"conflict"};
          else {
            const item={id:input.id,title:input.title,body:input.body,category:input.category,revision:(prior?.revision??0)+1,updated_at:"2026-10-13T18:00:00Z",commandId:input.commandId};
            items=[item,...items.filter(i=>i.id!==item.id)];result=lostReceipt?{status:"uncertain"}:{status:"saved",item};lostReceipt=false;
          }
        } else if(req.url === "/competition") {competitionCalls.push(input);result={status:"ok",data:input.competitionId};}
        else if(req.url === "/competition-load") {
          const c=competitionCalls.at(-1);result={status:"ok",data:{snapshot:{leagues:[{id:c.competitionId,name:c.name,fenceLimit:c.fenceLimit}]}}};
        }
        res.setHeader("content-type","application/json");res.end(JSON.stringify(result));
      });
    });
    await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
    const base=`http://127.0.0.1:${server.address().port}`;
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.addInitScript(()=>{
      window.__copies=[];window.__shares=[];
      Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async(text)=>window.__copies.push(text)}});
      Object.defineProperty(navigator,"share",{configurable:true,value:async(data)=>window.__shares.push(data)});
    });
    const page=await context.newPage();page.on("pageerror",error=>errors.push(error.message));
    await page.goto(base);
    await page.getByLabel("Your alibi",{exact:true}).fill("Synthetic manual alibi <script>window.injected=true</script>");
    await page.getByRole("button",{name:"Save alibi",exact:true}).click();
    await page.getByText("Alibi saved to your account.",{exact:true}).waitFor();
    assert.equal(items.length,1);assert.equal(await page.evaluate(()=>window.injected),undefined);
    assert.deepEqual(await page.evaluate(()=>window.__copies),[]);assert.deepEqual(await page.evaluate(()=>window.__shares),[]);
    const second=await context.newPage();second.on("pageerror",error=>errors.push(error.message));
    await second.goto(base);await second.getByRole("button",{name:/Untitled alibi.*Reopen/}).click();
    assert.equal(await second.getByLabel("Your alibi",{exact:true}).inputValue(),items[0].body);
    await second.getByLabel("Your alibi",{exact:true}).fill("Synthetic newer-device edit");
    await second.getByRole("button",{name:"Save alibi",exact:true}).click();
    await second.getByText("Alibi saved to your account.",{exact:true}).waitFor();
    await page.getByLabel("Your alibi",{exact:true}).fill("Synthetic stale edit");
    await page.getByRole("button",{name:"Save alibi",exact:true}).click();
    await page.getByText("This alibi changed on another device.",{exact:false}).waitFor();
    assert.equal(items[0].body,"Synthetic newer-device edit");
    assert.equal(await page.getByLabel("Your alibi",{exact:true}).inputValue(),"Synthetic stale edit");
    await page.getByRole("button",{name:"Refresh saved alibis",exact:true}).click();
    await page.getByRole("button",{name:/Untitled alibi.*Reopen/}).click();
    await page.getByRole("button",{name:"New alibi",exact:true}).click();
    for(const category of ["New Gear","At Home","Bad Plays","Team Shenanigans"]) {
      await page.getByLabel("Category",{exact:true}).selectOption(category);
      const generate=page.getByRole("button",{name:"Plead the Fifth? Nah. Generate an Alibi.",exact:true});
      await generate.click();const before=await page.getByLabel("Your alibi",{exact:true}).inputValue();
      await generate.click();assert.notEqual(await page.getByLabel("Your alibi",{exact:true}).inputValue(),before);
    }
    await page.getByLabel("Your alibi",{exact:true}).fill("Synthetic generated then edited alibi");
    lostReceipt=true;
    await page.getByRole("button",{name:"Save alibi",exact:true}).click();
    await page.getByRole("button",{name:"Retry the same change",exact:true}).waitFor();
    assert.equal(await page.getByLabel("Your alibi",{exact:true}).isDisabled(),true);
    await page.getByRole("button",{name:"Retry the same change",exact:true}).click();
    await page.getByText("Alibi saved to your account.",{exact:true}).waitFor();assert.equal(items.length,2);
    await page.getByRole("button",{name:"Copy alibi",exact:true}).click();
    await page.getByRole("button",{name:"Share alibi",exact:true}).click();
    assert.equal((await page.evaluate(()=>window.__copies)).length,1);assert.equal((await page.evaluate(()=>window.__shares)).length,1);
    await page.getByRole("button",{name:"Delete alibi",exact:true}).click();assert.equal(items.length,2);
    await page.getByRole("button",{name:"Confirm delete",exact:true}).click();
    await page.getByText("Alibi deleted.",{exact:true}).waitFor();assert.equal(items.length,1);
    assert.equal(await page.getByRole("button",{name:"Save competition settings",exact:true}).count(),0);
    await page.getByLabel("League name",{exact:true}).fill("Synthetic league");
    await page.getByLabel("Fence HR limit",{exact:true}).fill("0");
    await page.getByRole("button",{name:"Create league",exact:true}).click();
    await page.getByText("Competition saved.",{exact:false}).waitFor();
    assert.equal(competitionCalls[0].fenceLimit,0);assert.equal(competitionCalls[0].guaranteedGames,null);
    assert.ok((await page.evaluate(()=>window.__routes))[0].startsWith(`/leagues/${competitionCalls[0].competitionId}?team=`));
    for(const width of [320,390,800,1440]) {await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);}
    assert.deepEqual(errors,[]);
    console.log("PASS actual React personal workflow: manual/generated editing, reopen, two-view conflict preservation, uncertain retry without duplicates, explicit copy/share/delete, zero-limit competition creation/navigation, and responsive overflow checks. Synthetic transport only.");
  } finally {if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
