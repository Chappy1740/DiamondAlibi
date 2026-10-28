import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_BOARD, evaluateGame, rates, scoringOutcomes, type Game, type Outcome } from "../src/lib/scoring.ts";
import { parseNamedPlay } from "../src/lib/named-play.ts";
import { competitionStats, teamLeaderboard, leaderboardValue, rankTournamentPlayers } from "../src/lib/tournament-leaderboard.ts";
import type { ConnectedGame, LoadedScorebook } from "../src/lib/scorebook-view.ts";

const game = (outcomes: Outcome[], kind: Game["kind"] = "Tournament"): Game => ({id:"g",opponent:"Synthetic",kind,lineup:["a"],next:0,complete:false,rules:{version:"Synthetic hits",fenceLimit:1,board:DEFAULT_BOARD},plays:outcomes.map((outcome,i)=>({id:String(i),playerId:"a",outcome,runs:outcome === "Fence HR" ? 1 : 0,rbi:0,voided:false}))});
function connected(source: Game, id="cup"): ConnectedGame {
 return {game:{id:source.id,day_id:"day",tournament_id:source.kind === "Tournament" ? id : null,league_id:source.kind === "League" ? id : null,kind:source.kind,opponent:source.opponent,completed:false,next_batter_position:0},playedOn:"2026-11-07",dayRevision:0,tournamentRevision:0,lineup:source.lineup,rules:{version_label:"Synthetic hits",fence_limit:1},evaluation:evaluateGame(source,[])};
}
function loaded(games: ConnectedGame[]): LoadedScorebook {
 const totals=structuredClone(games[0].evaluation.totals.a);
 for (const g of games.slice(1)) for (const key of Object.keys(totals) as (keyof typeof totals)[]) totals[key]+=g.evaluation.totals.a[key];
 return {roster:[{id:"a",display_name:"Synthetic Alex",is_guest:false}],archived:false,bands:[],leagueBands:[],participation:[],snapshot:{teamId:"team",seasonId:"season",scope:"Overall",games,totals:{a:totals},board:{a:totals.board},tournaments:[{id:"cup",name:"Synthetic Cup",revision:0}],leagues:[{id:"league",name:"Synthetic League",fenceLimit:1}]}};
}

test("all hit types count once in H/AB/PA and rates, without consuming HR allowance or charging BEVs",()=>{
 const ev=evaluateGame(game(["1B","2B","3B"]),[]),t=ev.totals.a;
 assert.equal(t.H,3);assert.equal(t.AB,3);assert.equal(t.PA,3);assert.equal(t.HR,0);assert.equal(t.board,0);assert.equal(ev.fenceUsed,0);
 assert.deepEqual(rates(t),{AVG:1,OBP:1,Reach:1});
 const hrs=evaluateGame(game(["2B","3B","Fence HR","Fence HR"]),[]);
 assert.equal(hrs.fenceUsed,1);assert.equal(hrs.rows[2].official,"Fence HR");assert.equal(hrs.rows[3].official,"OLHR");
});
test("new slow-pitch choices omit HBP and generic Hit while legacy history remains correctable",()=>{
 const choices=scoringOutcomes(DEFAULT_BOARD);
 for(const o of ["1B","2B","3B"] as const) assert(choices.includes(o));
 assert(!choices.includes("HBP"));assert(!choices.includes("Hit"));
 assert(scoringOutcomes(DEFAULT_BOARD,true,"HBP").includes("HBP"));
 assert(scoringOutcomes(DEFAULT_BOARD,true,"Hit").includes("Hit"));
 assert(!scoringOutcomes(DEFAULT_BOARD,false).includes("2B"));
 const legacy=evaluateGame(game(["Hit","HBP"]),[]).totals.a;
 assert.equal(legacy.H,1);assert.equal(legacy.HBP,1);assert.equal(legacy.AB,1);assert.equal(legacy.PA,2);
});
test("typed and voice aliases preserve explicit hit types, RBI and player identity and reject HBP",()=>{
 const roster=[{id:"a",display_name:"Synthetic Alex"}];
 for(const [text,outcome] of [["single","1B"],["1B","1B"],["hit","1B"],["double","2B"],["2B","2B"],["two base hit","2B"],["triple","3B"],["3B","3B"],["three base hit","3B"]]){
  assert.deepEqual(parseNamedPlay(`Synthetic Alex ${text} 2 RBI`,roster),{status:"ok",playerId:"a",outcome,runs:2,rbi:2});
 }
 for(const text of ["HBP","hit by pitch"])assert.equal(parseNamedPlay(`Synthetic Alex ${text}`,roster).status,"invalid");
 assert.equal(parseNamedPlay("Unknown double",roster).status,"invalid");
 assert.equal(parseNamedPlay("Synthetic Alex double play",roster).status,"ok");
 const dp=parseNamedPlay("Synthetic Alex double play",roster);assert(dp.status==="ok");assert.equal(dp.outcome,"DP");
});
test("2B and 3B stats use effective nonvoid rows and isolate team/season/kind/competition",()=>{
 const cup=connected(game(["1B","2B","3B"])),league=connected({...game(["2B","2B","3B"],"League"),id:"l"},"league");
 const data=loaded([cup,league]);
 assert.equal(leaderboardValue(teamLeaderboard(data,"team","season","Overall")[0],"2B"),3);
 const selected=competitionStats(data,"team","season","Tournament","cup")!.players[0];
 assert.equal(leaderboardValue(selected,"2B"),1);assert.equal(leaderboardValue(selected,"3B"),1);
 assert.equal(leaderboardValue(competitionStats(data,"team","season","League","league")!.players[0],"2B"),2);
 assert.equal(competitionStats(data,"foreign","season","Tournament","cup"),null);
 cup.evaluation.rows[1].outcome="3B";
 assert.equal(leaderboardValue(competitionStats(data,"team","season","Tournament","cup")!.players[0],"2B"),0);
 cup.evaluation.rows[2].voided=true;cup.evaluation.totals.a.PA--;
 assert.equal(leaderboardValue(competitionStats(data,"team","season","Tournament","cup")!.players[0],"3B"),1);
});
test("unspecified historical hits and incomplete rows stay unknown and unranked, rather than becoming singles or zero doubles",()=>{
 for(const metric of ["2B","3B"] as const){
  const data=loaded([connected(game(["Hit","2B","3B"]))]);
  const historical=teamLeaderboard(data,"team","season","Overall")[0];assert.equal(leaderboardValue(historical,metric),null);
  const known=competitionStats(loaded([connected(game(["2B","3B"]))]),"team","season","Tournament","cup")!.players[0];
  assert.deepEqual(rankTournamentPlayers([{...historical,id:"unknown"},{...known,id:"known"}],metric).map(row=>[row.id,row.rank]),[["known",1],["unknown",null]]);
  data.snapshot.games[0].evaluation.rows=[];
  assert.equal(leaderboardValue(teamLeaderboard(data,"team","season","Overall")[0],metric),null);
 }
});
