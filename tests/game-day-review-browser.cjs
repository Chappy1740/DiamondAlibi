// Built pages, synthetic proposals only. No live credentials or database writes.
const {chromium,webkit}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
(async()=>{
  let app,browser;let output='';const errors=[];
  try {
    const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
    const port=engine===webkit?3121:3120;
    const base='http://127.0.0.1:'+port;
    app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'',NEXT_TELEMETRY_DISABLED:'1'},windowsHide:true,stdio:['ignore','pipe','pipe']});
    for(const stream of [app.stdout,app.stderr])stream.on('data',chunk=>output=(output+chunk).slice(-4000));
    let ready=false;
    for(let i=0;i<100;i++){
      if(app.exitCode!==null)throw Error('Next stopped: '+output);
      try{if((await fetch(base+'/review/next')).ok){ready=true;break;}}catch{}
      await new Promise(resolve=>setTimeout(resolve,200));
    }
    assert(ready,output);
    browser=await engine.launch({headless:true});
    const page=await browser.newPage({viewport:{width:390,height:844}});
    page.on('pageerror',error=>errors.push(error.message));
    const writes=[];page.on('request',request=>{if(request.method()!=='GET')writes.push(request.url())});
    const response=await page.goto(base+'/review/next');
    await page.waitForFunction(()=>!document.querySelector('.app-bottom-nav'));
    assert.equal(await page.getByRole('navigation',{name:'Mobile primary',exact:true}).count(),0,'standalone owner screen has no game navigation overlay');
    const headers=response.headers();
    assert.equal(headers['x-frame-options'],'SAMEORIGIN');
    assert.equal(headers['x-content-type-options'],'nosniff');
    assert.equal(headers['referrer-policy'],'same-origin');
    assert.match(headers['content-security-policy'],/frame-ancestors 'self'/);
    assert.match(headers['content-security-policy'],/object-src 'none'/);
    assert.match(headers['permissions-policy'],/microphone=\(self\)/);
    assert.equal(headers['x-powered-by'],undefined);
    await page.getByRole('heading',{name:'Easy at the field. Solid behind it.',exact:true}).waitFor();
    await page.getByText('Saved Beverage Rules for this game',{exact:true}).click();
    assert.deepEqual(await page.locator('.saved-game-rules dd').allTextContents(),['+1','+1','-1','-1','+1','-1','0']);
    const summary=page.getByRole('textbox',{name:'Your review summary',exact:true});
    assert.equal(await summary.getAttribute('readonly'),'');
    assert.equal(await page.getByRole('button',{name:'Copy my choices',exact:true}).isEnabled(),false);
    await page.getByRole('checkbox',{name:'Review a spoken result',exact:true}).check();
    await page.getByRole('checkbox',{name:'Career stats & rankings',exact:true}).check();
    assert.match(await summary.inputValue(),/Review a spoken result; Career stats & rankings/);
    assert.equal(await page.getByRole('button',{name:'Copy my choices',exact:true}).isEnabled(),true);
    await page.getByRole('button',{name:'Review sample result',exact:true}).click();
    await page.getByText('Alex Sample',{exact:true}).waitFor();
    assert.equal(await page.getByText('Fence HR · 2 runs · 2 RBI',{exact:true}).isVisible(),true);
    await page.getByRole('textbox',{name:'Sample spoken result',exact:true}).fill('Unknown home run');
    await page.getByRole('button',{name:'Review sample result',exact:true}).click();
    await page.getByText('Choose an existing team player or use their roster name.',{exact:true}).waitFor();
    await page.getByRole('textbox',{name:'Sample spoken result',exact:true}).fill('<img src=x onerror=alert(1)> hit');
    await page.getByRole('button',{name:'Review sample result',exact:true}).click();
    assert.equal(await page.locator('main img').count(),0,'no HTML interpretation of input');
    for(const width of [320,390,430,800,1440]){
      await page.setViewportSize({width,height:900});
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'review overflow at '+width);
      for(const control of await page.locator('main button, main .review-choice, main summary').all()){
        const box=await control.boundingBox();assert(box&&box.height>=44,'tap target at '+width);
      }
    }
    await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
    const axe=await page.evaluate(async()=>window.axe.run(document.querySelector('main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
    assert.deepEqual(axe.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)})),[]);
    await page.getByRole('textbox',{name:'Sample spoken result',exact:true}).focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.getByRole('button',{name:'Review sample result',exact:true}).evaluate(el=>el===document.activeElement),true);
    assert.deepEqual(writes,[],'proposal interaction cannot write game data');
    await page.reload();
    assert.equal(await page.getByRole('checkbox',{name:'Career stats & rankings',exact:true}).isChecked(),false,'choices do not silently become saved preferences');
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('heading',{name:'Easy at the field. Solid behind it.',exact:true}).waitFor();
    await page.evaluate(()=>window.scrollTo(0,0));
    if(process.env.REVIEW_SCREENSHOT){
      await page.screenshot({path:process.env.REVIEW_SCREENSHOT,fullPage:true});
      await page.screenshot({path:process.env.REVIEW_SCREENSHOT.replace('.png','-viewport.png')});
    }
    // Frame protections must preserve the existing same-origin phone review.
    await page.goto(base+'/review');
    await page.frameLocator('iframe').getByRole('heading',{name:/Your game,/}).waitFor();
    await page.getByRole('link',{name:'Review what’s next',exact:true}).click();
    await page.getByRole('heading',{name:'Easy at the field. Solid behind it.',exact:true}).waitFor();
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({engine:engine.name(),headers:true,savedRules:true,proposalsNoWrites:true,widths:[320,390,430,800,1440],accessibility:true,keyboard:true,sameOriginReview:true}));
  } finally {if(browser)await browser.close();if(app)app.kill();}
})().catch(error=>{console.error(error);process.exitCode=1});
