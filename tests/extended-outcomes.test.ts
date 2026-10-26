import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_BOARD, EXTENDED_BOARD, createScorebook, applyCommand, evaluateGame, availableOutcomes, validateRules, type Rules, type Outcome } from "../src/lib/scoring.ts";
import { parseNamedPlay } from "../src/lib/named-play.ts";
import { parseSeasonCommand } from "../src/lib/season-scorebook.ts";
const rules: Rules = {version:"Synthetic extended",fenceLimit:3,board:{...EXTENDED_BOARD}};
test("explicit new outcomes charge the batter; all strikeout types count as K and DP counts one batting appearance",()=>{
 const outcomes: Outcome[]=["K Looking","K Swinging","SOFO","DP"];
 const game={id:"g",opponent:"Synthetic",kind:"Tournament" as const,lineup:["a"],next:0,complete:false,rules,plays:outcomes.map((outcome,i)=>({id:String(i),playerId:"a",outcome,runs:0,rbi:0,voided:false}))};
 const result=evaluateGame(game,[]);
 assert.deepEqual(result.rows.map(row=>row.delta),[2,2,1,1]);
 assert.equal(result.totals.a.K,3);assert.equal(result.totals.a.AB,4);assert.equal(result.totals.a.PA,4);assert.equal(result.totals.a.H,0);assert.equal(result.totals.a.board,6);
});
test("old rule versions retain their generic K and reject new outcomes without explicit saved amounts",()=>{
 let book=createScorebook({teamId:"t",seasonId:"s",dayId:"d",players:[{id:"a",name:"Synthetic"}],bands:[],rules:{...rules,board:{...DEFAULT_BOARD}}});
 const request=(command: any,n:number)=>({commandId:String(n),expectedRevision:n-1,actor:"a",at:"2026-11-07T08:00:00Z",command});
 book=applyCommand(book,request({type:"start",gameId:"g",opponent:"Synthetic",kind:"Tournament",lineup:["a"]},1));
 assert.throws(()=>applyCommand(book,request({type:"score",gameId:"g",playId:"p",playerId:"a",outcome:"K Looking",runs:0,rbi:0},2)),/saved rules/);
 book=applyCommand(book,request({type:"score",gameId:"g",playId:"p",playerId:"a",outcome:"K",runs:0,rbi:0},2));
 assert.equal(evaluateGame(book.games[0],[]).totals.a.board,1);
 assert(!availableOutcomes(DEFAULT_BOARD).includes("DP"));assert(availableOutcomes(EXTENDED_BOARD).includes("DP"));
});
test("extended amounts are all explicit, bounded and runtime-validated with legacy seven-key commands still accepted",()=>{
 validateRules(rules);validateRules({...rules,board:DEFAULT_BOARD});
 assert.throws(()=>validateRules({...rules,board:{...DEFAULT_BOARD,doublePlay:1}}),/all extended/);
 assert.throws(()=>validateRules({...rules,board:{...EXTENDED_BOARD,doublePlay:101}}),/whole numbers/);
 for(const board of [DEFAULT_BOARD,EXTENDED_BOARD])assert.equal(parseSeasonCommand({type:"rules",seasonId:"s",rules:{...rules,board}}).type,"rules");
 assert.throws(()=>parseSeasonCommand({type:"rules",seasonId:"s",rules:{...rules,board:{...EXTENDED_BOARD,unknown:2}}}));
});
test("named inputs distinguish looking, swinging, SOFO and batter double plays",()=>{
 const roster=[{id:"a",display_name:"Synthetic Alex"}];
 for(const [text,outcome] of [["Synthetic Alex strikeout looking","K Looking"],["Synthetic Alex strikeout swinging","K Swinging"],["Synthetic Alex sofo","SOFO"],["Synthetic Alex hit into double play","DP"],["Synthetic Alex backwards k","K Looking"]]){
  const result=parseNamedPlay(text,roster);assert.equal(result.status,"ok");if(result.status==="ok"){assert.equal(result.outcome,outcome);assert.equal(result.runs,0);assert.equal(result.rbi,0);}
 }
});
