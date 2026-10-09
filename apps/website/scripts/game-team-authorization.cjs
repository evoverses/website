"use strict";
const {compiledInventory} = require("./game-linked-inventory.cjs");
// Trusted process-local ownership proof. Never serialize or expose to browsers.
function createGameTeamVerifier({links, ErrorType, load, projection, sources}) {
  if (!links || typeof links.projection!=="function" || typeof ErrorType!=="function") throw Error("Invalid team verifier configuration");
  if (!load || !projection || !sources) {
    const shared=compiledInventory();load=shared.loadLinkedNfts;projection=shared.walletProjection;sources=()=>shared.createNftSources();
  }
  const fail=()=>{throw new ErrorType("TEAM_UNAVAILABLE");};
  return async ({token,playerId,members})=>{
    if (!Array.isArray(members) || !members.length || members.length>6 || members.some(m=>m.chainId!==43114 || m.collection!=="0x4151b8afa10653d304fdac9a781afccd45ec164c")) fail();
    const checkedAt=Date.now()/1000;
    const before=projection(await links.projection(token,{}));
    const source=sources();
    if(typeof source.fetchByIds==='function')source.fetchIndexed=async()=>({items:await source.fetchByIds(members.map(m=>m.tokenId)),total:members.length,nextPage:null});
    const page=await load(before,0,source);
    // Requested, freshly verified adults only. Missing metadata, transfers,
    // outages or entries beyond this bounded page fail closed.
    if (members.some(m=>!page.rows.some(row=>row.tokenId===m.tokenId && row.form==="evo"))) fail();
    const after=projection(await links.projection(token,{}));
    if (after.version!==before.version) fail();
    const expectedIds=before.wallets.map(w=>w.id).sort();
    return Object.freeze({checkedAt,checkpoint:expectedIds,members:members.map(m=>({...m})),
      evos:members.map(m=>({tokenId:m.tokenId,speciesKey:page.rows.find(row=>row.tokenId===m.tokenId).species})),
      assertCurrent:async (tx,currentPlayer)=>{
        if (currentPlayer!==playerId) fail();
        // Caller holds the same player lock as link/unlink. Recheck on that
        // transaction, without decrypting addresses or opening a nested one.
        const rows=(await tx.query("SELECT id FROM player.wallet_links WHERE player_id=$1 ORDER BY id",[currentPlayer])).rows;
        if (JSON.stringify(rows.map(row=>row.id).sort())!==JSON.stringify(expectedIds)) fail();
      }});
  };
}
// Spending reads ownerOf and current links, without reloading species metadata.
// Species/moves come from the backend's immutable admission snapshot.
function createGameSpendVerifier({links,ErrorType,projection,sources}) {
 if(!projection||!sources){const shared=compiledInventory();projection=shared.walletProjection;sources=()=>shared.createNftSources();}
 const fail=()=>{throw new ErrorType("TEAM_UNAVAILABLE");};
 return async ({token,playerId,members})=>{
  if(!Array.isArray(members)||!members.length||members.length>6||members.some(m=>m.chainId!==43114||m.collection!=="0x4151b8afa10653d304fdac9a781afccd45ec164c"))fail();
  const before=projection(await links.projection(token,{}));
  const owners=before.wallets.map(w=>w.address.toLowerCase());if(!owners.length)fail();
  const chain=await sources().readChain(owners,members.map(m=>m.tokenId));
  if(!chain||chain.owners.length!==members.length||chain.owners.some(owner=>typeof owner!=='string'||!owners.includes(owner.toLowerCase())))fail();
  const after=projection(await links.projection(token,{}));if(after.version!==before.version)fail();
  const ids=before.wallets.map(w=>w.id).sort();
  return Object.freeze({members:members.map(m=>({...m})),checkedAt:Date.now()/1000,checkpoint:ids,
   assertCurrent:async(tx,currentPlayer)=>{
    if(currentPlayer!==playerId)fail();
    const rows=(await tx.query('SELECT id FROM player.wallet_links WHERE player_id=$1 ORDER BY id',[currentPlayer])).rows;
    if(JSON.stringify(rows.map(r=>r.id).sort())!==JSON.stringify(ids))fail();
   }});
 };
}
module.exports={createGameTeamVerifier,createGameSpendVerifier};
