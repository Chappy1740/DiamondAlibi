// Real presentation components with isolated fictional fixtures; no backend transport.
const { chromium, webkit } = require("playwright");
const esbuild = require("esbuild");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");
(async () => {
  let server, browser;
  try {
    const bundle = await esbuild.build({
      stdin: { resolveDir: process.cwd(), loader: "tsx", contents: `
        import React from 'react';import{createRoot}from'react-dom/client';
        import{PlayerDashboard}from'./src/components/player-dashboard';
        import{CompetitionPage}from'./src/components/competition-page';
        import{BottomNavigationView}from'./src/components/bottom-navigation';
        import{emptyTotals,evaluateGame,DEFAULT_BOARD}from'./src/lib/scoring';
        import{createSampleSeasons,sampleScope}from'./src/lib/sample-seasons';
        const q=new URLSearchParams(location.search),c=q.get('case');
        const books=createSampleSeasons();let data=books[3];
        const league=data.snapshot.games.filter(g=>g.game.kind==='League').slice(0,3);
        const tournament=data.snapshot.games.filter(g=>g.game.kind==='Tournament').slice(0,2);
        ['Pitch Please','Base Invaders','The Extra Innings Softball Club with a very long opponent name'].forEach((name,i)=>{
          league[i].game.opponent=name;league[i].game.completed=i!==1;
          league[i].game.team_runs=[12,0,7][i];league[i].game.opponent_runs=[8,0,10][i];
        });
        tournament[0].game.opponent='Diamond Dogs';tournament[1].game.opponent='Hit Squad';
        const friday=books[2].snapshot.games.filter(g=>g.game.kind==='Tournament').slice(0,2);
        friday.forEach((g,i)=>{
          g.game.id='preview-friday-game-'+(i+1);g.game.day_id=g.game.id+'-day';g.game.tournament_id='friday-cup';
          g.game.opponent=['Moonshot Crew','Last Call Legends'][i];g.playedOn='2026-07-0'+(i+1);
          g.evaluation.rows.forEach((row,r)=>row.id=g.game.id+'-play-'+r);
          g.game.team_runs=Object.values(g.evaluation.totals).reduce((sum,t)=>sum+t.runs,0);g.game.opponent_runs=[6,9][i];
        });
        function tournamentPlays(g,group,index){
          const patterns=['Hit','Hit','Out','BB','Hit','Out','ROE','SF'];
          const plays=Array.from({length:48},(_,n)=>{
            const player=n%12,round=Math.floor(n/12);
            let outcome=patterns[(player+round+group*3+index)%patterns.length],runs=0;
            if(round===0 && player>=1 && player<=(group===0?9:7))outcome='K';
            if(round===1 && (player===1 || player===5 && (group===0 || index===0))){outcome='Fence HR';runs=1;}
            if(group===0 && index===0 && player===0 && round===2){outcome='Fence HR';runs=4;}
            if(group===1 && index===1 && player===11 && round===2){outcome='ITP HR';runs=1;}
            if(outcome==='Hit' && (player+round+index)%4===0)runs=1;
            return{id:g.game.id+'-play-'+n,playerId:data.roster[player].id,outcome,runs,rbi:runs,voided:false};
          });
          g.evaluation=evaluateGame({id:g.game.id,opponent:g.game.opponent,kind:'Tournament',lineup:g.lineup,next:0,complete:true,
            rules:{version:g.rules.version_label,fenceLimit:g.rules.fence_limit,board:{...DEFAULT_BOARD}},plays},['sample-player-1','sample-player-5','sample-player-9']);
          g.game.team_runs=Object.values(g.evaluation.totals).reduce((sum,t)=>sum+t.runs,0);
        }
        tournament.forEach((g,i)=>tournamentPlays(g,0,i));friday.forEach((g,i)=>tournamentPlays(g,1,i));
        data.snapshot.games=[...league,...tournament,...friday];
        data.snapshot.tournaments[0].name='Riverside Classic';
        data.snapshot.tournaments.push({id:'friday-cup',name:'Friday Night Lights',revision:1,guaranteedGames:2},{id:'empty-cup',name:'Upcoming Cup',revision:1,guaranteedGames:2});
        if(c==='no-league')data.snapshot.games=[...tournament,...friday];
        if(c==='empty'){data.snapshot.games=[];data.snapshot.tournaments=[];}
        if(c==='missing-score')delete league[0].game.team_runs;
        if(c==='stats'){
          data.snapshot.games=[...league,...tournament];data.snapshot.games.forEach(g=>{g.evaluation.totals={};g.evaluation.rows=[]});
          league[0].evaluation.totals={'sample-player-1':{...emptyTotals(),PA:100,AB:100,H:99,HR:99,RBI:99,board:999}};
          tournament[0].evaluation.totals={'sample-player-1':{...emptyTotals(),PA:4,AB:4,H:3,HR:1,RBI:4,board:-3},'sample-player-2':{...emptyTotals(),PA:1,AB:1,K:1,board:1}};
          tournament[1].game.tournament_id='empty-cup';
          tournament[1].evaluation.totals={'sample-player-1':{...emptyTotals(),PA:1,AB:1},'sample-player-2':{...emptyTotals(),PA:3,AB:3,H:1,RBI:2,board:-1}};
          tournament.forEach(g=>Object.entries(g.evaluation.totals).forEach(([playerId,t])=>{
            for(let i=0;i<t.PA;i++)g.evaluation.rows.push({id:g.game.id+'-'+playerId+'-'+i,playerId,official:'Hit',outcome:'Hit',runs:0,rbi:0,voided:false,delta:i===0?t.board:0});
          }));
        }
        const scope=q.get('scope')==='League'?'League':q.get('scope')==='Tournament'?'Tournament':'Overall';
        data=sampleScope(data,scope);data.archived=c==='archived';
        const sample=q.get('sample')==='1';
        const gameContexts=[{id:'sample-team',name:'Riverside Rascals',seasons:[{id:'sample-season-2026',name:'Fall 2026',archived:data.archived,leagues:[{id:'thursday-league',name:'Thursday League'},{id:'sunday-league',name:'Sunday League'}]},{id:'old-season',name:'Fall 2025',archived:true,leagues:[]}]},{id:'west-team',name:'Westside Wolves with a very long team name for mobile selection',seasons:[{id:'west-season',name:'Summer 2027',archived:false,leagues:[{id:'west-league',name:'Westside League'}]}]},{id:'new-team',name:'New team without a season',seasons:[]}];
        data.snapshot.leagues=[{id:'thursday-league',name:'Thursday League',fenceLimit:2},{id:'sunday-league',name:'Sunday League',fenceLimit:1}];
        league.forEach((g,i)=>g.game.league_id=i<2?'thursday-league':'sunday-league');
        if(q.get('team')==='west-team'){data.snapshot.teamId='west-team';data.snapshot.seasonId='west-season';data.snapshot.games=[];data.snapshot.leagues=[{id:'west-league',name:'Westside League',fenceLimit:1}];data.snapshot.tournaments=[];}
        if(c==='picker-many')for(let i=1;i<=24;i++)gameContexts.push({id:'extra-team-'+i,name:'Fictional long-name team '+i+' '+('Softball'.repeat(8)),seasons:[{id:'extra-season-'+i,name:'Fall 2026',archived:false,leagues:[]}]});
        const p={route:'games',sample,userId:q.get('player')||'sample-user-1',teams:gameContexts.map(({id,name})=>({id,name})),gameContexts,
          seasons:q.get('team')==='west-team'?gameContexts[1].seasons:gameContexts[0].seasons,teamId:q.get('team')||'sample-team',seasonId:q.get('season')||'sample-season-2026',scope,loaded:data,
          leagueId:data.snapshot.leagues.find(league=>league.id===q.get('league'))?.id};
        if(q.get('league')&&!p.leagueId){p.loaded=null;p.error='That league is not available in this team and season.';}
        if(c==='picker-error'){p.gameContexts=[];p.gameContextError='Could not load your teams and leagues.';}

        if(c==='denied'){p.loaded=null;p.error='Could not verify access to this season.';}
        const parts=location.pathname.split('/').filter(Boolean),context=new URLSearchParams({team:p.teamId,season:p.seasonId,scope,...(sample?{sample:'1',player:p.userId}:{})}).toString();
        let screen;
        if(parts[0]==='leagues'||parts[0]==='tournaments')screen=<CompetitionPage data={p} kind={parts[0]==='leagues'?'League':'Tournament'} id={parts[1]} gamesOnly={q.get('view')==='games'} fromGames={q.get('from')==='games'} creating={q.get('create')==='1'} settings={q.get('settings')==='1'}/>;
        else if(parts[0]==='club'&&parts[1]==='score'||parts[0]==='games'&&parts[1]==='live')screen=<PlayerDashboard {...p} route="games/live" sample={true} gameId={q.get('game')||''}/>;
        else screen=<PlayerDashboard {...p} route={parts.join('/')}/>;
        createRoot(document.getElementById('app')).render(<><div className="fixture-banner" role="note">Local preview · fictional data · saving disabled</div>{screen}<BottomNavigationView pathname={location.pathname} context={context}/></>);
      ` },
      bundle:true,write:false,platform:"browser",jsx:"automatic",
      plugins:[{name:"isolated-games",setup(build){
        build.onResolve({filter:/^(next\/(navigation|link|image)|@\/app\/(login\/actions|club\/(beverage-actions|scoring-actions))|\.\/personal-alibis)$/},args=>({path:args.path,namespace:"fixture"}));
        build.onLoad({filter:/.*/,namespace:"fixture"},args=>({loader:"tsx",resolveDir:process.cwd(),contents:
          args.path==='next/navigation'?"const router={refresh(){},push(url){location.href=url}};export const useRouter=()=>router;export const usePathname=()=>location.pathname;export const useSearchParams=()=>new URLSearchParams(location.search);":
          args.path==='next/link'?"import React from 'react';export default function Link({children,prefetch,...props}){return <a {...props}>{children}</a>}":
          args.path==='next/image'?"import React from 'react';export default function Image({unoptimized,...props}){return <img {...props}/>}":
          args.path==='./personal-alibis'?"export function PersonalAlibis(){return null}":
          args.path==='@/app/club/scoring-actions'?"export async function scoringAction(){window.__blockedSaves=(window.__blockedSaves||0)+1;return{status:'forbidden'}};export async function loadScorebook(){return{status:'forbidden'}}":
          args.path==='@/app/club/beverage-actions'?"export async function beverageAction(){return{status:'unsupported'}}":
          "export async function signout(){}"
        }));
      }}]
    });
    const fonts=[400,700].map(weight=>'@font-face{font-family:Inter;font-style:normal;font-weight:'+weight+';font-display:swap;src:url(data:font/woff2;base64,'+fs.readFileSync('node_modules/@fontsource/inter/files/inter-latin-'+weight+'-normal.woff2').toString('base64')+') format("woff2")}').join('');
    const css=fonts+fs.readFileSync('src/app/globals.css','utf8')+'\n.fixture-banner{position:relative;z-index:50;text-align:center;padding:8px 12px;background:#143b48;color:#fff;font:12px Inter,sans-serif}.workspace{min-height:calc(100vh - 32px)}';
    server=http.createServer((req,res)=>{
      if(req.method!=='GET'){res.writeHead(405);res.end('Preview is read only');return;}
      if(req.url.startsWith('/brand/')){
        const file=path.basename(req.url.split('?')[0]);
        if(!['diamond-alibi-primary.webp','diamond-alibi-icon-64.png'].includes(file)){res.writeHead(404);res.end();return;}
        res.setHeader('content-type',file.endsWith('.png')?'image/png':'image/webp');res.end(fs.readFileSync(path.join('public','brand',file)));return;
      }
      res.setHeader('cache-control','no-store');
      res.setHeader('content-type',req.url==='/bundle.js'?'text/javascript; charset=utf-8':'text/html; charset=utf-8');
      res.end(req.url==='/bundle.js'?bundle.outputFiles[0].text:`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Games · Diamond Alibi local preview</title><style>${css}</style></head><body><div id="app"></div><script src="/bundle.js"></script></body></html>`);
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const base=`http://127.0.0.1:${server.address().port}`;
    if(process.env.LOCAL_PREVIEW==='1'){
      console.log(`LOCAL_GAMES_PREVIEW=${base}/games PID=${process.pid}`);
      await new Promise(resolve=>{process.once('SIGINT',resolve);process.once('SIGTERM',resolve)});
      return;
    }
    const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
    browser=await engine.launch({headless:true,...(engine===chromium&&process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
    const page=await browser.newPage({viewport:{width:390,height:844},...(engine===webkit?{isMobile:true,hasTouch:true}:{})});
    page.setDefaultTimeout(7000);
    const errors=[],writes=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('request',req=>{if(req.method()!=='GET')writes.push(req.url())});
    const context='team=sample-team&season=sample-season-2026&scope=Tournament';
    const nav=page.getByRole('navigation',{name:'Mobile primary',exact:true});
    async function ready(){await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready);}
    async function accessible(){
      await page.addScriptTag({path:require.resolve('axe-core')});
      assert.deepEqual(await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))),[]);
    }
    async function sizes(){
      for(const width of [320,390,430,800,1440]){
        await page.setViewportSize({width,height:900});
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`No overflow at ${width}px on ${page.url()}`);
        for(const button of await page.locator('.games-entry .button,.game-entry-row .button,.competition-link').all()){
          const b=await button.boundingBox();assert(b&&b.width>=44&&b.height>=44,'Touch targets');
        }
      }
      await page.setViewportSize({width:390,height:844});
    }
    async function capture(name){if(process.env.GAMES_SCREENSHOTS){
      // Tall review captures keep the fixed menu below the full tournament panel.
      if(name.endsWith('-tournament-games'))await page.setViewportSize({width:390,height:1800});
      await page.screenshot({path:path.join(process.env.GAMES_SCREENSHOTS,name+'.png'),fullPage:true});
      if(name.endsWith('-tournament-games'))await page.setViewportSize({width:390,height:844});
    }}
    await page.goto(`${base}/games?${context}`);await ready();
    assert.deepEqual(await page.locator('.games-entry a').allTextContents(),['League','Tournament']);
    assert.equal(await page.locator('.game-entry-row,.competition-link').count(),0,'Games hidden before choosing type');
    assert.equal(await page.getByText('Pitch Please',{exact:false}).count(),0);
    const pickerButton=page.getByRole('button',{name:'Choose team or league',exact:true});
    assert.equal(await pickerButton.count(),1,'Clear button replaces the disclosure');
    assert.equal(await page.getByRole('dialog').count(),0,'Picker starts closed');
    await pickerButton.click();
    const picker=page.getByRole('dialog',{name:'Choose team or league',exact:true});
    await picker.waitFor();
    assert.equal(await picker.getByRole('radio').count(),3,'All available teams are listed');
    await accessible();await sizes();
    await capture('games-team-league-picker');
    await picker.getByLabel('League',{exact:true}).selectOption('thursday-league');
    await picker.getByRole('radio',{name:'Westside Wolves with a very long team name for mobile selection',exact:true}).check();
    assert.equal(await picker.getByLabel('Season',{exact:true}).inputValue(),'west-season');
    assert.equal(await picker.getByLabel('League',{exact:true}).inputValue(),'','Changing team clears old league');
    assert.deepEqual(await picker.getByLabel('League',{exact:true}).locator('option').allTextContents(),['All leagues','Westside League']);
    await picker.getByRole('radio',{name:'New team without a season',exact:true}).check();
    assert.equal(await picker.getByRole('button',{name:'Use selection',exact:true}).isDisabled(),true);
    await picker.getByRole('button',{name:'Cancel',exact:true}).click();
    assert.equal(await page.getByRole('dialog').count(),0);
    await page.waitForFunction(el=>document.activeElement===el,await pickerButton.elementHandle());
    assert.equal(new URL(page.url()).searchParams.get('team'),'sample-team','Cancel does not change context');
    await pickerButton.click();
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('dialog').count(),0,'Escape closes without applying');
    await pickerButton.click();
    await picker.getByLabel('League',{exact:true}).selectOption('thursday-league');
    await Promise.all([page.waitForURL(url=>url.searchParams.get('league')==='thursday-league'),picker.getByRole('button',{name:'Use selection',exact:true}).click()]);await ready();
    assert.equal(new URL(page.url()).pathname,'/games','Apply returns to Games, not creation');
    assert.equal(new URL(page.url()).searchParams.get('league'),'thursday-league');
    assert.equal(await page.locator('.game-entry-row').count(),0);
    await page.getByRole('link',{name:'League',exact:true}).click();await ready();
    assert.equal(new URL(page.url()).pathname,'/leagues/thursday-league');
    assert.equal(await page.locator('.game-entry-row').count(),2,'Selected league excludes other leagues');
    await page.getByRole('main').getByRole('link',{name:'Games',exact:true}).click();await ready();
    assert.equal(new URL(page.url()).searchParams.get('league'),'thursday-league','Back retains selected league');
    await page.getByRole('button',{name:'Choose team or league',exact:true}).click();
    await picker.getByRole('radio',{name:'Westside Wolves with a very long team name for mobile selection',exact:true}).check();
    await picker.getByLabel('League',{exact:true}).selectOption('west-league');
    await Promise.all([page.waitForURL(url=>url.searchParams.get('team')==='west-team'),picker.getByRole('button',{name:'Use selection',exact:true}).click()]);await ready();
    const changed=new URL(page.url());assert.equal(changed.searchParams.get('team'),'west-team');assert.equal(changed.searchParams.get('season'),'west-season');assert.equal(changed.searchParams.get('league'),'west-league');assert.equal(changed.searchParams.get('scope'),'Tournament');
    assert.equal(await page.locator('.games-entry a').count(),2);
    assert.equal(await page.getByRole('link',{name:'Tournament',exact:true}).getAttribute('href').then(h=>new URL(h,base).searchParams.get('team')),'west-team');
    await page.goto(`${base}/games?${context}&case=picker-error`);await ready();
    await page.getByRole('button',{name:'Choose team or league',exact:true}).click();
    assert.equal(await picker.getByRole('button',{name:'Use selection',exact:true}).isDisabled(),true);
    await picker.getByRole('alert').waitFor();
    // Long directories and enlarged text must keep every choice and action reachable.
    // This doubles computed modal font sizes; it is not physical-iPhone Dynamic Type evidence.
    for(const viewport of [{width:320,height:568},{width:640,height:320}]){
      await page.setViewportSize(viewport);
      await page.goto(`${base}/games?${context}&case=picker-many`);await ready();
      await pickerButton.click();await picker.waitFor();
      assert.equal(await picker.getByRole('radio').count(),27);
      await picker.evaluate(el=>{
        const elements=[el,...el.querySelectorAll('*')];
        const sizes=elements.map(node=>parseFloat(getComputedStyle(node).fontSize)*2);
        elements.forEach((node,i)=>node.style.fontSize=sizes[i]+'px');
      });
      const lastTeam=picker.getByRole('radio').last();
      await lastTeam.focus();await page.keyboard.press('Space');
      assert.equal(await lastTeam.isChecked(),true,'Last team can be selected by keyboard');
      assert.equal(await picker.getByLabel('Season',{exact:true}).inputValue(),'extra-season-24');
      const overflow=await picker.evaluate(el=>({dialog:el.scrollWidth>el.clientWidth+1,list:el.querySelector('.games-picker-teams > div').scrollWidth>el.querySelector('.games-picker-teams > div').clientWidth+1}));
      assert.deepEqual(overflow,{dialog:false,list:false},'Enlarged text and long names do not overflow horizontally');
      for(const name of ['Use selection','Cancel']){
        const button=picker.getByRole('button',{name,exact:true});
        await button.scrollIntoViewIfNeeded();
        const b=await button.boundingBox(),d=await picker.boundingBox();
        assert(b&&d&&b.width>=44&&b.height>=44&&b.x>=d.x&&b.x+b.width<=d.x+d.width+1&&b.y>=d.y&&b.y+b.height<=d.y+d.height+1,'Action remains reachable inside the scrollable modal');
      }
      await picker.getByRole('button',{name:'Cancel',exact:true}).click();
      // Native dialog close dispatches its focus-restoration event asynchronously in WebKit.
      await page.waitForFunction(el=>document.activeElement===el,await pickerButton.elementHandle());
      assert.equal(new URL(page.url()).searchParams.get('team'),'sample-team','Long-list Cancel preserves context');
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(`${base}/games?${context}`);await ready();
    await sizes();await accessible();await capture('games-simple-landing');
    await page.getByRole('link',{name:'League',exact:true}).click();await ready();
    assert.equal(await page.locator('.game-entry-row').count(),3,'Only League games, regardless of personal stats scope');
    assert.deepEqual(await page.locator('.game-entry-status').allTextContents(),['Final','Live','Final']);
    assert.equal(await page.getByText('Your team’s score first.',{exact:true}).count(),1);
    assert.match(await page.locator('.game-entry-row').first().innerText(),/Pitch Please\s+— 12–8\s+Enter/);
    assert.match(await page.locator('.game-entry-row').nth(1).innerText(),/Base Invaders\s+— 0–0/,'Recorded zero is valid');
    assert.equal(await page.getByText('Diamond Dogs',{exact:false}).count(),0);
    for(const link of await page.locator('.game-entry-row a').all()){
      const url=new URL(await link.getAttribute('href'),base);assert.equal(url.pathname,'/club/score');
      for(const [key,value] of new URLSearchParams(context))assert.equal(url.searchParams.get(key),value);
      assert(url.searchParams.get('game'));
    }
    await sizes();await accessible();await capture('games-simple-league');
    await page.getByRole('link',{name:'Games',exact:true}).first().click();await ready();
    assert.equal(await page.locator('.game-entry-row').count(),0,'Return to Games resets choice');
    await page.getByRole('link',{name:'Tournament',exact:true}).click();await ready();
    assert.deepEqual(await page.locator('.competition-link strong').allTextContents(),['Riverside Classic','Friday Night Lights','Upcoming Cup']);
    assert.equal(await page.locator('.game-entry-row,form.club-form').count(),0,'Tournaments are cards; form opens separately');
    const overallCounts=(await page.locator('.home-stat-row--counts strong').allTextContents()).map(Number);
    const overallActivity=(await page.locator('.tournament-bev-activity dd').allTextContents()).map(Number);
    const tournamentSeasonLeaders=page.getByRole('region',{name:'Overall tournament player leaderboard',exact:true});
    await tournamentSeasonLeaders.getByRole('button',{name:'View Beverages rankings',exact:true}).click();
    const tournamentSeasonBalances=await tournamentSeasonLeaders.locator('.leaderboard-players li').evaluateAll(rows=>rows.map(row=>({name:row.querySelector('.leaderboard-player strong').textContent,balance:Number(row.querySelector('.leaderboard-counts strong').textContent)})));
    await tournamentSeasonLeaders.getByRole('button',{name:'← Back to leaders',exact:true}).click();
    await sizes();await accessible();await capture('games-simple-tournaments');
    if(process.env.GAMES_SCREENSHOTS){
      await page.setViewportSize({width:390,height:1600});
      await page.locator('.tournament-season-stats').screenshot({path:path.join(process.env.GAMES_SCREENSHOTS,'tournament-overall-stats.png')});
      await page.setViewportSize({width:390,height:844});
    }
    await page.getByRole('link',{name:'Create tournament',exact:true}).click();await ready();
    await page.getByRole('heading',{name:'Create tournament',exact:true}).waitFor();
    assert.equal(await page.locator('.competition-link,.tournament-season-stats').count(),0);
    await page.getByLabel('Tournament name',{exact:true}).fill('Local Fictional Cup');
    await page.getByLabel('Fence HR limit',{exact:true}).fill('2');
    await page.getByRole('combobox',{name:/^Games guaranteed/}).selectOption('3');
    await page.getByRole('button',{name:'Create tournament',exact:true}).click();
    await page.getByRole('status').filter({hasText:'Could not save'}).waitFor();
    assert.equal(await page.evaluate(()=>window.__blockedSaves),1,'Existing form uses denied synthetic transport only');
    assert.equal(await page.getByText('Competition saved.',{exact:false}).count(),0,'No fake Saved');
    await page.getByRole('link',{name:'All tournaments',exact:true}).click();await ready();
    await page.locator('.competition-link').first().click();await ready();
    assert.equal(await page.locator('.game-entry-row').count(),2,'Selected tournament games only');
    assert.deepEqual(await page.locator('.game-entry-status').allTextContents(),['Final','Final']);
    assert.equal(await page.getByText('Your team’s score first.',{exact:true}).count(),1);
    assert.equal(await page.getByText('Pitch Please',{exact:false}).count(),0);
    assert.equal(await page.getByRole('link',{name:'Add Game 3',exact:true}).count(),1,'Existing add-game path retained');
    const riversideCounts=(await page.locator('.home-stat-row--counts strong').allTextContents()).map(Number);
    const riversideActivity=(await page.locator('.tournament-bev-activity dd').allTextContents()).map(Number);
    await sizes();await capture('games-simple-tournament-games');
    await page.getByRole('heading',{name:'Tournament stats',exact:true}).waitFor();
    await page.getByRole('heading',{name:'Player leaders',exact:true}).waitFor();
    assert.equal(await page.locator('details').filter({hasText:'Tournament settings'}).count(),0,'Settings is navigation, not an inline disclosure');
    await page.getByRole('link',{name:'Tournament settings',exact:true}).click();await ready();
    await page.getByRole('heading',{name:'Tournament settings',level:1,exact:true}).waitFor();
    assert.equal(await page.locator('.game-entry-row,.tournament-season-stats').count(),0,'Settings opens a separate view');
    assert.equal(await page.getByLabel('Tournament name',{exact:true}).inputValue(),'Riverside Classic');
    const settingsUrl=new URL(page.url());
    for(const [key,value] of new URLSearchParams(context))assert.equal(settingsUrl.searchParams.get(key),value);
    await sizes();await accessible();await capture('tournament-settings-preview');
    await page.getByRole('link',{name:'Back to tournament',exact:true}).click();await ready();
    assert.equal(await page.getByRole('heading',{name:'Tournament stats',exact:true}).count(),1);

    await page.getByRole('link',{name:'All tournaments',exact:true}).click();await ready();
    await page.locator('.competition-link').nth(1).click();await ready();
    await page.getByRole('heading',{name:'Friday Night Lights',level:1,exact:true}).waitFor();
    assert.equal(await page.getByText('Diamond Dogs',{exact:false}).count(),0);
    assert.equal(await page.getByText('Moonshot Crew',{exact:true}).count(),1);
    const fridayCounts=(await page.locator('.home-stat-row--counts strong').allTextContents()).map(Number);
    const fridayActivity=(await page.locator('.tournament-bev-activity dd').allTextContents()).map(Number);
    assert.notDeepEqual(fridayCounts,riversideCounts,'Populated fixture tournaments have distinct statistics');
    assert.notDeepEqual(overallCounts,riversideCounts,'Overall includes more than the first tournament');
    assert.deepEqual(overallCounts,riversideCounts.map((n,i)=>n+fridayCounts[i]),'Overall count totals sum the separate tournaments');
    assert.deepEqual(overallActivity,riversideActivity.map((n,i)=>n+fridayActivity[i]),'Overall gross earned/owed activity sums the separate tournaments');
    assert(riversideActivity[1]<0 && fridayActivity[1]<0,'Credits display as negative balances in both tournaments');
    const fridayLeaders=page.getByRole('region',{name:'Tournament player leaderboard',exact:true});
    await fridayLeaders.getByRole('button',{name:'View Beverages rankings',exact:true}).click();
    assert.equal(await fridayLeaders.locator('.leaderboard-counts strong').first().innerText(),'4','The player who owes the most leads');
    assert.equal(await fridayLeaders.locator('.leaderboard-player strong').first().innerText(),'Blake');
    await fridayLeaders.getByRole('button',{name:'← Back to leaders',exact:true}).click();
    await sizes();await accessible();await capture('friday-tournament-games');
    if(process.env.GAMES_SCREENSHOTS)fs.writeFileSync(path.join(process.env.GAMES_SCREENSHOTS,'tournament-stat-comparison.json'),JSON.stringify({labels:['Hits','RBIs','HRs','Net BEVs'],activityLabels:['BEVs owed','BEV credits'],riverside:{counts:riversideCounts,activity:riversideActivity},friday:{counts:fridayCounts,activity:fridayActivity},overall:{counts:overallCounts,activity:overallActivity}},null,2));
    for(const scope of ['Tournament','Overall']){
      await page.goto(`${base}/stats?team=sample-team&season=sample-season-2026&scope=${scope}`);await ready();
      const statsBoard=page.getByRole('region',{name:'Team player leaderboard',exact:true});
      await statsBoard.getByRole('button',{name:'View Beverages rankings',exact:true}).click();
      const balances=(await statsBoard.locator('.leaderboard-counts strong').allTextContents()).map(Number);
      assert.equal(balances.length,12,'Main Stats board includes the fictional roster');
      assert(balances.every((n,i)=>i===0||balances[i-1]>=n),'Main Stats board ranks highest owed first in '+scope+' scope');
      assert(balances.filter(n=>n>0).length>balances.length/2,'Fictional records show mostly owed balances in '+scope+' scope');
      assert(balances.some(n=>n<0),'Preview retains credit examples, rather than forcing everyone to owe');
      const displayed=await statsBoard.locator('.leaderboard-players li').evaluateAll(rows=>rows.map(row=>({name:row.querySelector('.leaderboard-player strong').textContent,balance:Number(row.querySelector('.leaderboard-counts strong').textContent)})));
      if(scope==='Tournament')assert.deepEqual(displayed,tournamentSeasonBalances,'Tournament-filtered main Stats matches the tournament summary player for player');
      if(scope==='Overall' && process.env.GAMES_SCREENSHOTS)fs.writeFileSync(path.join(process.env.GAMES_SCREENSHOTS,'main-stats-bev-balances.json'),JSON.stringify({scope,owed:balances.filter(n=>n>0).length,credit:balances.filter(n=>n<0).length,settled:balances.filter(n=>n===0).length,players:displayed},null,2));
      assert.match(await statsBoard.innerText(),/Most owed first/);
      await sizes();await accessible();
      if(scope==='Overall')await capture('main-stats-bevs-owed');
    }
    await page.goto(`${base}/tournaments?from=games`);await ready();
    await page.locator('.competition-link').nth(2).click();await ready();
    await page.getByText('No games recorded.',{exact:false}).waitFor();
    assert.equal(await page.locator('.game-entry-row').count(),0);
    await page.goto(`${base}/leagues?view=games&case=no-league`);await ready();
    await page.getByText('No league games recorded this season.',{exact:true}).waitFor();
    assert.equal(await page.locator('.game-score-key,.game-entry-status').count(),0,'Empty lists show no score guide or status labels');
    await page.goto(`${base}/leagues?view=games&case=missing-score`);await ready();
    assert.match(await page.locator('.game-entry-row').first().innerText(),/Score unavailable/);
    await page.goto(`${base}/tournaments?from=games&case=empty`);await ready();
    await page.getByText('No tournaments in this season yet.',{exact:true}).waitFor();
    await page.getByText('No recorded tournament plate appearances this season.',{exact:true}).waitFor();
    assert.equal(await page.locator('.home-stat,.leaderboard-summary').count(),0);
    assert.equal(await page.getByRole('link',{name:'Create tournament',exact:true}).count(),1);
    for(const route of ['/leagues?view=games','/tournaments?from=games']){
      await page.goto(`${base}${route}&team=another-team`);await ready();
      assert.equal(await page.locator('.game-entry-row,.competition-link,form.club-form,.tournament-season-stats').count(),0,'Foreign snapshot fails closed');
      await page.getByRole('alert').waitFor();
    }
    await page.goto(`${base}/tournaments?from=games&create=1&sample=1`);await ready();
    assert.equal(await page.locator('form.club-form').count(),0,'Direct sample creation URL never enables mutations');
    await page.getByText('Sign in to create a tournament. Sample records stay read only.',{exact:true}).waitFor();
    await page.goto(`${base}/tournaments/foreign-cup`);await ready();
    assert.equal(await page.locator('.game-entry-row').count(),0);await page.getByRole('alert').waitFor();
    await page.goto(`${base}/tournaments?from=games&case=archived`);await ready();
    assert.equal(await page.getByRole('button',{name:'Create tournament',exact:true}).isDisabled(),true);
    await page.goto(`${base}/tournaments?from=games&create=1&case=archived`);await ready();
    assert.equal(await page.getByRole('button',{name:'Create tournament',exact:true}).isDisabled(),true);
    await page.goto(`${base}/tournaments?from=games&sample=1&player=sample-user-2`);await ready();
    assert.equal(await page.getByRole('button',{name:'Create tournament',exact:true}).isDisabled(),true);
    await page.locator('.competition-link').first().click();await ready();
    const sampleUrl=new URL(await page.locator('.game-entry-row a').first().getAttribute('href'),base);
    assert.equal(sampleUrl.pathname,'/games/live');assert.equal(sampleUrl.searchParams.get('sample'),'1');assert.equal(sampleUrl.searchParams.get('player'),'sample-user-2');
    assert.equal(await page.getByRole('link',{name:'Add Game 3',exact:true}).count(),0);
    const settingsLink=page.getByRole('link',{name:'Tournament settings',exact:true});
    const sampleSettingsUrl=new URL(await settingsLink.getAttribute('href'),base);
    assert.equal(sampleSettingsUrl.searchParams.get('sample'),'1');assert.equal(sampleSettingsUrl.searchParams.get('player'),'sample-user-2');
    await settingsLink.click();await ready();
    await page.getByText('Sample tournament settings · read only.',{exact:true}).waitFor();
    assert.equal(await page.locator('form.club-form').count(),0,'Read-only sample settings expose no mutation form');
    await page.getByRole('link',{name:'Back to tournament',exact:true}).click();await ready();

    await page.locator('.game-entry-row a').first().click();await ready();
    await page.getByRole('heading',{name:/Sample scorebook · Diamond Dogs/}).waitFor();
    await nav.getByRole('link',{name:'Games',exact:true}).click();await ready();
    assert.equal(await page.locator('.game-entry-row,.competition-link').count(),0);
    await page.goto(`${base}/leagues?view=games&case=denied`);await ready();
    assert.equal(await page.locator('.game-entry-row,form.club-form').count(),0);
    await page.getByRole('alert').waitFor();
    await page.goto(`${base}/tournaments?from=games&case=stats&scope=League`);await ready();
    const summary=page.getByRole('region',{name:'Tournament team totals',exact:true});
    assert.deepEqual(await summary.locator('.home-stat-row--rates strong').allTextContents(),['.444','.444'],'Team rates use summed opportunities from all tournaments');
    assert.deepEqual(await summary.locator('.home-stat-row--counts dt').allTextContents(),['Hits','RBIs','HRs','BEVs']);
    assert.deepEqual(await summary.locator('.home-stat-row--counts strong').allTextContents(),['4','6','1','-3'],'No League numbers or season-wide beverage totals leak in');
    assert.deepEqual(await summary.locator('.tournament-bev-activity dd').allTextContents(),['1','-4'],'Owed is positive; credits are negative and separate from net BEVs');
    const leaders=page.getByRole('region',{name:'Overall tournament player leaderboard',exact:true});
    await leaders.getByRole('button',{name:'View Hits rankings',exact:true}).click();
    assert.deepEqual(await leaders.locator('.leaderboard-players .leaderboard-player strong').allTextContents(),['Alex','Blake']);
    assert.deepEqual(await leaders.locator('.leaderboard-counts strong').allTextContents(),['3','1']);
    await leaders.getByRole('button',{name:'← Back to leaders',exact:true}).click();
    await leaders.getByRole('button',{name:'View Beverages rankings',exact:true}).click();
    assert.equal(await leaders.locator('.leaderboard-player strong').first().innerText(),'Blake','Highest balance leads before the credit balance');
    assert.deepEqual(await leaders.locator('.leaderboard-counts strong').allTextContents(),['0','-3'],'Balances descend from settled to credit when nobody owes');
    assert.match(await leaders.innerText(),/Most owed first/);
    await leaders.getByRole('button',{name:'← Back to leaders',exact:true}).click();
    await page.goto(`${base}/tournaments/sample-tournament-7?from=games&case=stats&scope=League`);await ready();
    const individual=page.getByRole('region',{name:'Tournament statistics',exact:true});
    assert.deepEqual(await individual.locator('.home-stat-row--rates strong').allTextContents(),['.600','.600']);
    assert.deepEqual(await individual.locator('.home-stat-row--counts strong').allTextContents(),['3','4','1','-2'],'Other tournament and League figures stay out');
    assert.deepEqual(await individual.locator('.tournament-bev-activity dd').allTextContents(),['1','-3']);
    assert.equal(await individual.getByRole('region',{name:'Tournament player leaderboard',exact:true}).count(),1);
    await sizes();await accessible();
    await page.goto(`${base}/tournaments/sample-tournament-7?settings=1&case=archived`);await ready();
    assert.equal(await page.getByRole('button',{name:'Save tournament HR default',exact:true}).isDisabled(),true);
    await page.goto(`${base}/tournaments/foreign-cup?settings=1`);await ready();
    assert.equal(await page.locator('form.club-form,.tournament-season-stats').count(),0);await page.getByRole('alert').waitFor();
    await page.goto(`${base}/tournaments/sample-tournament-7?settings=1&team=foreign-team`);await ready();
    assert.equal(await page.locator('form.club-form').count(),0);
    assert.deepEqual(writes,[],'No network mutations');assert.deepEqual(errors,[]);
    console.log(`Games flow passed (${engine===webkit?'WebKit':'Chromium'}): choice gate, compact scores, tournament/create paths, context, isolation, empty/archived/read-only states, mobile layout, accessibility. No backend writes.`);
  } finally {if(browser)await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
