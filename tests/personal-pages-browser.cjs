// Built Next.js pages with explicit synthetic history. No Supabase credentials.
const { chromium, webkit } = require("playwright");
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
(async () => {
  let app,browser;
  let output="";
  const errors=[];
  try {
    const port=process.env.BROWSER_ENGINE==='webkit'?3101:3100;
    const base=`http://127.0.0.1:${port}`;
    app=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(port)],{
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
    const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
    browser=await engine.launch({headless:true,...(engine===chromium&&process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
    const page=await browser.newPage({viewport:{width:390,height:844}});page.on("pageerror",error=>errors.push({message:error.message,at:page.url()}));
    await page.goto(base+"/?sample=1");
    await page.getByRole("heading",{name:/Your game,/}).waitFor();
    const nav=page.getByRole('navigation',{name:'Mobile primary',exact:true});
    async function checkNavigation(active){
      await page.waitForLoadState('networkidle');
      await nav.getByRole('link',{name:'Beverage',exact:true}).waitFor();
      assert.equal(await nav.count(),1,'exactly one shared bottom menu');
      assert.deepEqual(await nav.getByRole('link').allTextContents(),['Home','Games','Stats','Beverage','More']);
      assert.equal(await nav.locator('[aria-current=page]').textContent(),active);
      for(const width of [320,390,800,1440]){
        await page.setViewportSize({width,height:900});
        const menu=await nav.boundingBox();assert(menu&&Math.abs(menu.y+menu.height-900)<2,'menu stays at viewport bottom');
        for(const link of await nav.getByRole('link').all()){const b=await link.boundingBox();assert(b.width>=44&&b.height>=44)}
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      }
      await page.setViewportSize({width:390,height:844});
    }
    await checkNavigation('Home');
    await nav.getByRole('link',{name:'Games',exact:true}).click();
    await page.getByRole('heading',{name:'Games',level:1,exact:true}).waitFor();
    assert.equal(await page.locator('.game-entry-row,.competition-link').count(),0,'Games starts with no games or tournament cards');
    await page.getByRole('link',{name:'League',exact:true}).click();
    await page.getByRole('heading',{name:'League',level:1,exact:true}).waitFor();
    assert.equal(await page.locator('.game-entry-row').count(),16,'League choice opens the selected season league games');
    const enter=page.locator('.game-entry-row a').first();
    const recorded=new URL(await enter.getAttribute('href'),base);
    assert.equal(recorded.pathname,'/games/live');assert.equal(recorded.searchParams.get('sample'),'1');
    await enter.click();
    await page.getByRole('heading',{name:/Sample scorebook/}).waitFor();
    await checkNavigation('Games');
    await page.goto(base+"/?sample=1");
    await page.getByRole('heading',{name:/Your game,/}).waitFor();
    await page.getByRole("link",{name:"Leagues",exact:true}).click();
    await page.getByRole("heading",{name:"Leagues",exact:true}).waitFor();
    await checkNavigation('Games');
    assert.equal(await page.locator('.connected-header img').getAttribute("src"),"/brand/diamond-alibi-primary.webp");
    await page.goto(base+"/?sample=1");
    await page.getByRole("link",{name:"Tournaments",exact:true}).click();
    await page.getByRole("heading",{name:"Tournaments",exact:true}).waitFor();
    await checkNavigation('Games');
    await page.getByRole('heading',{name:'Overall tournament stats',exact:true}).waitFor();
    const overall=page.getByRole('region',{name:'Overall tournament statistics',exact:true});
    assert.equal(await overall.getByRole('region',{name:'Overall tournament player leaderboard',exact:true}).count(),1);
    assert.equal(await overall.locator('.home-stat-row--counts strong').count(),4);
    const first=page.locator(".competition-link").first();
    const name=await first.locator("strong").innerText();await first.click();
    await page.getByRole("heading",{name,exact:true}).waitFor();
    await page.getByRole("heading",{name:"Games",exact:true}).waitFor();
    await page.getByRole('heading',{name:'Tournament stats',exact:true}).waitFor();
    await page.getByRole('link',{name:'Tournament settings',exact:true}).click();
    await page.getByRole('heading',{name:'Tournament settings',level:1,exact:true}).waitFor();
    assert.equal(await page.locator('form.club-form').count(),0,'Sample settings are read only');
    await page.getByRole('link',{name:'Back to tournament',exact:true}).click();
    await page.getByRole('heading',{name,exact:true}).waitFor();
    await checkNavigation('Games');
    const savedContext=new URL(await nav.getByRole('link',{name:'Stats',exact:true}).getAttribute('href'),base);
    assert.equal(savedContext.searchParams.get('sample'),'1');
    assert(savedContext.searchParams.get('team')&&savedContext.searchParams.get('season'),'competition context retained in every destination');
    await nav.getByRole('link',{name:'Stats',exact:true}).click();
    await page.getByRole('heading',{name:'Team leaders',exact:true}).waitFor();
    await checkNavigation('Stats');
    const teamLeaders=page.getByRole('region',{name:'Team player leaderboard',exact:true});
    assert.equal(await teamLeaders.locator('.leaderboard-summary button').count(),5);
    await teamLeaders.getByRole('button',{name:'View Hits rankings',exact:true}).click();
    await teamLeaders.getByRole('heading',{name:'Hits rankings',exact:true}).waitFor();
    assert(await teamLeaders.locator('.leaderboard-players li').count()>0);
    await teamLeaders.getByRole('button',{name:'← Back to leaders',exact:true}).click();
    const contextAfter=new URL(await nav.getByRole('link',{name:'Games',exact:true}).getAttribute('href'),base);
    assert.equal(contextAfter.searchParams.get('team'),savedContext.searchParams.get('team'));
    assert.equal(contextAfter.searchParams.get('season'),savedContext.searchParams.get('season'));
    await page.goBack();await page.getByRole('heading',{name:'Games',exact:true}).waitFor();
    await checkNavigation('Games');
    await page.getByRole('heading',{name:'Tournament stats',exact:true}).waitFor();
    const leaderboard=page.getByRole('region',{name:'Tournament player leaderboard',exact:true});
    await leaderboard.waitFor();
    assert.equal(await leaderboard.locator('.leaderboard-summary button').count(),5);
    for(const metric of ['OBP%','Hits','HR','RBI','Beverages']){
      await leaderboard.getByRole('button',{name:'View '+metric+' rankings',exact:true}).click();
      const rows=await leaderboard.locator('.leaderboard-players li').count();
      assert(rows>0);
      assert.equal(await leaderboard.locator('.leaderboard-counts > span').count(),rows);
      for(const text of await leaderboard.locator('.leaderboard-counts').allTextContents())assert(text.includes(metric));
      assert.equal(await leaderboard.locator('.leaderboard-beverage').count(),metric==='Beverages'?rows:0);
      await leaderboard.getByRole('button',{name:'← Back to leaders',exact:true}).click();
    }
    assert.equal(await page.getByRole("link",{name:/Add Game/}).count(),0);
    assert.equal(await page.locator('.connected-header img').getAttribute("src"),"/brand/diamond-alibi-icon-64.png");
    await page.locator(".profile-menu > summary").click();
    await page.getByRole("navigation",{name:"Profile",exact:true}).getByRole("link",{name:"Sign in",exact:true}).waitFor();
    await page.goto(base+'/more?sample=1');
    await page.getByRole('link',{name:'Beverage Rules',exact:true}).click();
    await page.getByRole('heading',{name:'Beverage Rules',level:1,exact:true}).waitFor();
    await page.getByText('Sign in and select your team to view its current rules.',{exact:true}).waitFor();
    await checkNavigation('More');
    assert.equal(await page.getByRole('button',{name:'Change',exact:true}).count(),0,'samples have no fake manager action');
    await page.goto(base+"/more/alibi?sample=1");
    await page.getByRole("heading",{name:"My alibis",exact:true}).waitFor();
    await page.getByLabel("Your alibi",{exact:true}).fill("Synthetic unsaved draft");
    assert.equal(await page.getByRole("button",{name:"Save alibi",exact:true}).isDisabled(),true);
    await checkNavigation('More');
    await page.getByRole('button',{name:'Save alibi',exact:true}).evaluate(el=>el.scrollIntoView({block:'end'}));
    assert.equal(await page.getByRole('button',{name:'Save alibi',exact:true}).evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('.app-bottom-nav').getBoundingClientRect().top),true,'last controls scroll above menu');
    for(const [path,active] of [['/games?sample=1','Games'],['/stats?sample=1','Stats'],['/beverages?sample=1','Beverage'],['/more?sample=1','More'],['/more/beverage-rules?sample=1','More'],['/practice','Games'],['/review','More'],['/review/scoring','Games'],['/status','More'],['/login','More'],['/forgot-password','More'],['/review/history?route=stats','Stats'],['/not-a-real-route','']]) {
      await page.waitForLoadState('networkidle');
      await page.goto(base+path);
      if(active)await checkNavigation(active);
      else {await nav.getByRole('link',{name:'Home',exact:true}).waitFor();assert.equal(await nav.count(),1);}
    }
    await page.goto(base+'/?sample=1&team=sample-team&season=sample-season&token=do-not-copy');
    await nav.getByRole('link',{name:'Home',exact:true}).waitFor();
    assert.equal((await nav.getByRole('link',{name:'Home',exact:true}).getAttribute('href')).includes('do-not-copy'),false);
    await page.waitForLoadState('networkidle');await page.goto(base+'/login');
    assert.equal(await nav.getByRole('link',{name:'Home',exact:true}).getAttribute('href'),'/','account entry clears sample selection');
    for(const width of [320,390,800,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);}
    assert.deepEqual(errors,[]);
    console.log(`PASS ${process.env.BROWSER_ENGINE||'chromium'} built Next.js routes: one shared bottom menu on Home, league/tournament pages, Stats, Beverage, More/alibis, practice/review, status, login/reset request and not-found pages; active tabs, context through links/Back, no copied auth tokens, cleared sample context on login, 44px targets and readable 320–1440px layouts. Final controls scroll above the fixed menu. Synthetic history only; hosted acceptance remains separate.`);
  } finally{
    if(browser)await browser.close();
    if(app && app.exitCode===null){app.kill("SIGTERM");await new Promise(resolve=>app.once("exit",resolve));}
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
