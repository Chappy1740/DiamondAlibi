import test from "node:test";
import assert from "node:assert/strict";
import { personalAlibiCommand, type AlibiClient } from "../src/lib/personal-alibis.ts";
const id = "00000000-0000-4000-8000-000000000001";
const commandId = "00000000-0000-4000-8000-000000000002";
const input = { action: "save", id, commandId, revision: 0, title: "", body: "Synthetic alibi", category: "Bad Plays" };
function fixture() {
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  const client: AlibiClient = {
    auth: { getUser: async () => ({ data: { user: { id: "synthetic-owner" } }, error: null }) },
    rpc: async (name, args) => { calls.push({name,args}); return { data: {status:"saved", item:{id,body:input.body,category:input.category,title:"",revision:1,updated_at:"2026-10-13"}}, error:null }; },
  };
  return {client,calls};
}
test("uses verified identity and rejects client ownership, team and arbitrary fields", async () => {
  const {client,calls} = fixture();
  for (const forged of [{user_id:"other"}, {teamId:id}, {actor:id}, {updated_at:"now"}]) {
    assert.equal((await personalAlibiCommand(client,{...input,...forged})).status,"invalid");
  }
  assert.equal(calls.length,0);
  assert.equal((await personalAlibiCommand(client,input)).status,"saved");
  assert.equal(calls[0].name,"da_save_personal_alibi");
  assert.equal("p_user" in calls[0].args,false);
  assert.equal(calls[0].args.p_command,commandId);
});
test("rejects malformed bodies, categories, IDs and revisions before a write", async () => {
  const {client,calls} = fixture();
  for (const change of [{body:" "},{body:"x".repeat(4001)},{title:"x".repeat(81)},{category:"Community"},{id:"other"},{revision:-1},{revision:1.5},{commandId:""}]) {
    assert.equal((await personalAlibiCommand(client,{...input,...change})).status,"invalid");
  }
  assert.equal(calls.length,0);
});
test("signed-out accounts cannot read or mutate through command service", async () => {
  const {client,calls} = fixture();
  client.auth.getUser = async () => ({data:{user:null},error:null});
  assert.equal((await personalAlibiCommand(client,input)).status,"auth-required");
  assert.equal(calls.length,0);
});
test("transport failure remains uncertain and retry keeps IDs and revision", async () => {
  const {client,calls} = fixture();
  const rpc = client.rpc;
  client.rpc = async () => { throw Error("synthetic transport failure"); };
  assert.equal((await personalAlibiCommand(client,input)).status,"uncertain");
  client.rpc = rpc;
  await personalAlibiCommand(client,input);
  assert.equal(calls[0].args.p_id,id); assert.equal(calls[0].args.p_command,commandId); assert.equal(calls[0].args.p_expected,0);
});
test("reports missing setup and conflicts without claiming a successful save", async () => {
  const {client} = fixture();
  client.rpc = async () => ({data:null,error:{code:"PGRST202"}});
  assert.equal((await personalAlibiCommand(client,input)).status,"setup-required");
  client.rpc = async () => ({data:{status:"conflict"},error:null});
  assert.equal((await personalAlibiCommand(client,input)).status,"conflict");
  client.rpc = async () => ({data:null,error:null});
  assert.equal((await personalAlibiCommand(client,input)).status,"uncertain");
});
test("delete uses ID and expected revision with no submitted account identity", async () => {
  const {client,calls} = fixture();
  client.rpc = async (name,args) => {calls.push({name,args});return {data:{status:"deleted"},error:null};};
  assert.equal((await personalAlibiCommand(client,{action:"delete",id,revision:1})).status,"deleted");
  assert.deepEqual(calls[0],{name:"da_delete_personal_alibi",args:{p_id:id,p_expected:1}});
});
