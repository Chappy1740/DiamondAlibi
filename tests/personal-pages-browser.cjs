// Built Next.js pages with explicit synthetic history. No Supabase credentials.
const { chromium } = require("playwright");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
(async () => {
  let app,browser;
  let output="";
  const errors=[];
  try {
    const base="http://127.0.0.1:3100";
    app=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port","3100"],{
      env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:"",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"",NEXT_TELEMETRY_DISABLED:"1"},stdio:["ignore","pipe","pipe"],
    });
    app.stdout.on("data",chunk=>output=(output+chunk).slice(-4000));app.stderr.on("data",chunk=>output=(output+chunk).slice(-4000));
    let ready=false;
    for(let attempt=0;attempt<100;attempt++){
      if(app.exitCode!==null)throw Error(`Next.js stopped before readiness: ${output}`);
      try{const r=await fetch(base+"/?sample=1");if(r.ok){ready=true;break;}}catch{}
      await new Promise(resolve=>setTimeout(resolve,200));
    }
    assert.equal(ready,true,`Next.js readiness: ${output}`);
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
    const page=await browser.newPage({viewport:{width:390,height:844}});page.on("pageerror",error=>errors.push(error.message));
    await page.goto(base+"/?sample=1");
    await page.getByRole("heading",{name:/Your game,/}).waitFor();
    await page.getByRole("link",{name:"Leagues",exact:true}).click();
    await page.getByRole("heading",{name:"Leagues",exact:true}).waitFor();
    assert.equal(await page.locator('.connected-header img').getAttribute("src"),"/brand/diamond-alibi-primary.webp");
    await page.goto(base+"/?sample=1");
    await page.getByRole("link",{name:"Tournaments",exact:true}).click();
    await page.getByRole("heading",{name:"Tournaments",exact:true}).waitFor();
    const first=page.locator(".competition-link").first();
    const name=await first.locator("strong").innerText();await first.click();
    await page.getByRole("heading",{name,exact:true}).waitFor();
    await page.getByRole("heading",{name:"Games",exact:true}).waitFor();
    await page.getByRole("region",{name:"Tournament player leaderboard",exact:true}).waitFor();
    await page.getByRole("group",{name:"Rank players by",exact:true}).getByRole("button",{name:"HR",exact:true}).click();
    assert.equal(await page.getByRole("group",{name:"Rank players by",exact:true}).getByRole("button",{name:"HR",exact:true}).getAttribute("aria-pressed"),"true");
    assert.equal(await page.getByRole("link",{name:/Add Game/}).count(),0);
    assert.equal(await page.locator('.connected-header img').getAttribute("src"),"/brand/diamond-alibi-icon-64.png");
    await page.locator(".profile-menu > summary").click();
    await page.getByRole("navigation",{name:"Profile",exact:true}).getByRole("link",{name:"Sign in",exact:true}).waitFor();
    await page.goto(base+"/more/alibi?sample=1");
    await page.getByRole("heading",{name:"My alibis",exact:true}).waitFor();
    await page.getByLabel("Your alibi",{exact:true}).fill("Synthetic unsaved draft");
    assert.equal(await page.getByRole("button",{name:"Save alibi",exact:true}).isDisabled(),true);
    for(const width of [320,390,800,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);}
    assert.deepEqual(errors,[]);
    console.log("PASS built Next.js routes: personal Home, league/tournament entry and detail pages, primary/secondary logos, profile control, editable alibi route and disabled saving without setup. Synthetic history only; hosted acceptance remains separate.");
  } finally{
    if(browser)await browser.close();
    if(app && app.exitCode===null){app.kill("SIGTERM");await new Promise(resolve=>app.once("exit",resolve));}
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
