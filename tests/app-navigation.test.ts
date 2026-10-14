import test from "node:test";
import assert from "node:assert/strict";
import { activeAppTab, appNavigation, navigationContext } from "../src/lib/app-navigation.ts";
test("all pages share five destinations and competition/scoring pages select Games",()=>{
  for(const path of ["/", "/games", "/stats", "/beverages", "/more/alibi", "/club", "/club/score", "/leagues/cup", "/tournaments/cup", "/more/profile", "/more/settings", "/login", "/practice", "/review/scoring", "/status"]) {
    const tabs=appNavigation(path,"","team=synthetic&season=history&scope=Tournament");
    assert.deepEqual(tabs.map(t=>t.label),["Home","Games","Stats","Beverage","More"]);
    assert.equal(tabs.filter(t=>t.active).length,1);
    for(const tab of tabs){const u=new URL(tab.href,"https://synthetic.invalid");assert.equal(u.searchParams.get("team"),"synthetic");assert.equal(u.searchParams.get("season"),"history");assert.equal(u.searchParams.get("scope"),"Tournament");}
  }
  assert.equal(activeAppTab("/tournaments/cup", ""),"games");
  assert.equal(activeAppTab("/club/score",""),"games");
  assert.equal(activeAppTab("/more/settings",""),"more");
});
test("context carries selection through secondary pages but never scoring commands or auth tokens",()=>{
  const old="team=synthetic&season=history&scope=Tournament";
  assert.equal(navigationContext(old,"","/more/profile"),old);
  const current=navigationContext(old,"team=another&game=private-game&setup=1&manage=1&token=secret&code=secret&next=/unsafe","/club/score");
  assert.equal(new URLSearchParams(current).get("team"),"another");assert.equal(new URLSearchParams(current).has("season"),false);
  for(const key of ["game","setup","manage","token","code","next"])assert.equal(new URLSearchParams(current).has(key),false);
  assert.equal(navigationContext(old,"","/login"),"");
  assert.equal(navigationContext(old,"","/reset-password"),"");
});
test("sample and review navigation remain synthetic while account entry clears sample context",()=>{
  const sample="team=sample-team&season=sample-season&sample=1&player=sample-player";
  assert.equal(new URLSearchParams(navigationContext(sample,"","/tournaments/cup")).get("player"),"sample-player");
  assert.equal(navigationContext(sample,"","/club"),"");
  assert.equal(navigationContext(sample,"","/more/profile"),"");
  const protectedContext=navigationContext(sample,"team=authorized&season=real-season","/club/score");
  assert.equal(protectedContext,"team=authorized&season=real-season");
  const tabs=appNavigation("/review/history","route=beverages",sample);
  assert.equal(tabs.find(t=>t.active)?.label,"Beverage");
  assert(tabs.every(t=>t.href.startsWith("/review/history?")));
});
