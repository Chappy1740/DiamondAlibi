import test from "node:test";
import assert from "node:assert/strict";
import { competitionGames, competitionView, competitionPath } from "../src/lib/competitions.ts";
import type { LoadedScorebook, ConnectedGame } from "../src/lib/scorebook-view.ts";
function game(id: string, kind: "League" | "Tournament", competition: string): ConnectedGame {
  return {game:{id,day_id:"day",opponent:"Synthetic opponent",kind,completed:false,next_batter_position:0,tournament_id:kind === "Tournament" ? competition : null,league_id:kind === "League" ? competition : null},playedOn:"2026-10-13",dayRevision:0,tournamentRevision:null,lineup:[],rules:{version_label:"synthetic",fence_limit:2},evaluation:{rows:[],fenceUsed:0,totals:{}}};
}
test("competition pages keep leagues/tournaments and unnamed legacy games separate", () => {
  const games = [game("a","League","one"),game("b","League","two"),game("c","Tournament","one"),game("d","League","")];
  const before = JSON.stringify(games);
  assert.deepEqual(competitionGames(games,"League","one").map((g)=>g.game.id),["a"]);
  assert.deepEqual(competitionGames(games,"Tournament","one").map((g)=>g.game.id),["c"]);
  assert.equal(JSON.stringify(games),before);
});
test("detail projection rejects mixed team/season contexts and unknown IDs", () => {
  const data: LoadedScorebook = {snapshot:{teamId:"team",seasonId:"season",scope:"Overall",board:{},totals:{},games:[],leagues:[{id:"one",name:"Synthetic league",fenceLimit:0}],tournaments:[]},roster:[],bands:[],participation:[],leagueBands:[],archived:false};
  assert.equal(competitionView(data,"other","season","League","one"),null);
  assert.equal(competitionView(data,"team","other","League","one"),null);
  assert.equal(competitionView(data,"team","season","League","unknown"),null);
  assert.equal(competitionView(data,"team","season","League","one")?.competition.fenceLimit,0);
  assert.equal(competitionPath("Tournament","synthetic/id"),"/tournaments/synthetic%2Fid");
});
