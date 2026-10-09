"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const {compiledInventory}=require("../../scripts/game-linked-inventory.cjs");
const {createGameTeamVerifier,createGameSpendVerifier}=require("../../scripts/game-team-authorization.cjs");
const shared=compiledInventory(),address="0x"+"a".repeat(40),foreign="0x"+"b".repeat(40);
const wallet={id:"11111111-1111-1111-1111-111111111111",chainId:43114,address,label:"0xaaaa…aaaa"};
const snapshot={wallets:[wallet],version:"a".repeat(64)},member={chainId:43114,collection:"0x4151b8afa10653d304fdac9a781afccd45ec164c",tokenId:"7"};
class SafeError extends Error {constructor(code){super(code);this.code=code;}}
function verifier({owner=address,type="EVO",after=snapshot,outage=false}={}) {
  let calls=0;
  return createGameTeamVerifier({links:{projection:async()=>++calls===1?snapshot:after},ErrorType:SafeError,projection:shared.walletProjection,load:shared.loadLinkedNfts,
    sources:()=>({fetchIndexed:async()=>({items:[{chainId:"43114",address:member.collection,owner:address,tokenId:"7",metadata:{species:"kitsul",type,xp:0}}],total:1,nextPage:null}),
      readChain:async()=>{if(outage)throw Error("private provider detail");return {owners:[owner],counts:[1n]};}})});
}
const prepare=(v,members=[member])=>v({token:"fixture",playerId:"trainer",members});
test("verified adult team proof rechecks exact link IDs and player on the admission transaction",async()=>{
  const proof=await prepare(verifier());assert.deepEqual(proof.members,[member]);assert.deepEqual(proof.evos,[{tokenId:"7",speciesKey:"kitsul"}]);assert.ok(proof.checkedAt<=Date.now()/1000);
  await proof.assertCurrent({query:async(sql,args)=>{assert.match(sql,/player.wallet_links/);assert.deepEqual(args,["trainer"]);return {rows:[{id:wallet.id}]};}},"trainer");
  await assert.rejects(proof.assertCurrent({query:async()=>({rows:[]})},"trainer"),/TEAM_UNAVAILABLE/);
  await assert.rejects(proof.assertCurrent({query:async()=>{throw Error("must not query");}},"foreign"),/TEAM_UNAVAILABLE/);
  assert.ok(!JSON.stringify(proof).includes(address));
});
test("transferred, egg, missing member and unavailable chain results cannot authorize a team",async()=>{
  for(const options of [{owner:foreign},{type:"EGG"},{outage:true}])await assert.rejects(prepare(verifier(options)),/TEAM_UNAVAILABLE/);
  await assert.rejects(prepare(verifier(),[member,{...member,tokenId:"8"}]),/TEAM_UNAVAILABLE/);
});
test("unlink during the external read invalidates team proof before returning it",async()=>{
  await assert.rejects(prepare(verifier({after:{wallets:[],version:"b".repeat(64)}})),/TEAM_UNAVAILABLE/);
});

test("casual spending verifies current ownership without fetching metadata and rechecks links",async()=>{
 let metadata=0,calls=0;
 const verify=createGameSpendVerifier({links:{projection:async()=>{calls++;return snapshot;}},ErrorType:SafeError,projection:shared.walletProjection,
  sources:()=>({fetchIndexed:async()=>{metadata++;throw Error("metadata must not be loaded");},readChain:async(owners,ids)=>{assert.deepEqual(owners,[address]);assert.deepEqual(ids,["7"]);return {owners:[address],counts:[1n]};}})});
 const proof=await prepare(verify);assert.equal(metadata,0);assert.equal(calls,2);
 await proof.assertCurrent({query:async()=>({rows:[{id:wallet.id}]})},"trainer");
 await assert.rejects(proof.assertCurrent({query:async()=>({rows:[]})},"trainer"),/TEAM_UNAVAILABLE/);
 assert.ok(!JSON.stringify(proof).includes(address));
 const transferred=createGameSpendVerifier({links:{projection:async()=>snapshot},ErrorType:SafeError,projection:shared.walletProjection,sources:()=>({readChain:async()=>({owners:[foreign],counts:[1n]})})});
 await assert.rejects(prepare(transferred),/TEAM_UNAVAILABLE/);
});
