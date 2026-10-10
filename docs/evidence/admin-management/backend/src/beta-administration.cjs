"use strict";
const {randomUUID,createHash}=require('node:crypto');
const {EconomyError}=require('./economy.cjs');
const catalogue=require('../../../Content/Store/Data/store-catalogue.json');
const fail=code=>{throw new EconomyError(code);};
const first=async(tx,sql,args=[]) => (await tx.query(sql,args)).rows[0];
const uuid=v=>{if(typeof v!=='string'||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(v))fail('INVALID_REQUEST');return v.toLowerCase();};
const fields=(v,keys)=>{if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!keys.includes(k)))fail('INVALID_REQUEST');};
const positive=(v,max=2147483647)=>{if(!Number.isSafeInteger(v)||v<1||v>max)fail('INVALID_REQUEST');return v;};
const reason=v=>{if(typeof v!=='string'||v.trim().length<1||v.trim().length>200||/[\x00-\x1f\x7f]/.test(v))fail('INVALID_REQUEST');return v.trim();};
const fingerprint=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
// Both operator rewards and future verified rule rewards use the same stock operation.
async function grantItem(tx,{playerId,operationId,productId,revision,quantity}) {
 if(!catalogue.items.some(p=>p.id===productId&&p.revision===revision)||!await first(tx,"SELECT 1 FROM player.catalogue_versions WHERE product_id=$1 AND revision=$2 AND kind='item'",[productId,revision]))fail('PRODUCT_UNAVAILABLE');
 const existing=await first(tx,'SELECT quantity FROM player.item_inventory WHERE player_id=$1 AND product_id=$2 AND revision=$3 FOR UPDATE',[playerId,productId,revision]);
 const remaining=(existing?.quantity??0)+quantity;if(remaining>2147483647)fail('CAPACITY_EXCEEDED');
 await tx.query("INSERT INTO player.beta_admin_grants(id,player_id,operation_id,source,product_id,revision,quantity) VALUES($1,$2,$3,'reward_item',$4,$5,$6)",[randomUUID(),playerId,operationId,productId,revision,quantity]);
 await tx.query('INSERT INTO player.item_inventory(player_id,product_id,revision,quantity) VALUES($1,$2,$3,$4) ON CONFLICT(player_id,product_id,revision) DO UPDATE SET quantity=EXCLUDED.quantity',[playerId,productId,revision,remaining]);
 return remaining;
}
class BetaAdministration {
 constructor({accounts,economy,mode,resolveRuleReward}){if(mode!=='local-test'||!accounts||!economy||economy.mode!=='test')fail('INVALID_CONFIGURATION');this.accounts=accounts;this.economy=economy;if(resolveRuleReward!==undefined&&typeof resolveRuleReward!=='function')fail('INVALID_CONFIGURATION');this.resolveRuleReward=resolveRuleReward;}
 async administrator(tx,token){await tx.query('SELECT pg_advisory_xact_lock_shared(420000011)');const actor=await this.accounts.sessionPlayer(tx,token);if(!await first(tx,'SELECT player_id FROM player.beta_administrators WHERE player_id=$1 AND revoked_at IS NULL',[actor.id]))fail('ADMIN_REQUIRED');return actor;}
 async list(token,input={}){
  fields(input,['search','sort','direction','page']);const search=input.search??'';if(typeof search!=='string'||search.length>80)fail('INVALID_REQUEST');
  const orders={name:'lower(p.display_name)',experience:'p.experience',access:"coalesce(a.status,'pending')",administrator:'administrator',evoros:'b.evoros'};
  const sort=input.sort??'name',direction=input.direction??'asc',page=input.page??1;
  if(!Object.hasOwn(orders,sort)||!['asc','desc'].includes(direction)||!Number.isSafeInteger(page)||page<1||page>100000)fail('INVALID_REQUEST');
  return this.accounts.transaction(async tx=>{
   const actor=await this.administrator(tx,token);
   const players=(await tx.query(`SELECT p.id,p.display_name,p.status,p.experience,b.evoros,coalesce(a.status,'pending') AS access,coalesce(a.version,0) AS version,
    EXISTS(SELECT 1 FROM player.beta_administrators d WHERE d.player_id=p.id AND d.revoked_at IS NULL) AS administrator,
    EXISTS(SELECT 1 FROM player.beta_administrators d WHERE d.player_id=p.id AND d.revoked_at IS NULL AND d.is_master) AS master_administrator,
    EXISTS(SELECT 1 FROM player.beta_admin_grants g WHERE g.player_id=p.id AND g.source='beta_start') AS initial_grant
    FROM player.players p JOIN player.balances b ON b.player_id=p.id LEFT JOIN player.beta_access a ON a.player_id=p.id
    WHERE p.status<>'closed' AND position(lower($1) in lower(p.display_name))>0 ORDER BY ${orders[sort]} ${direction==='asc'?'ASC':'DESC'},p.id LIMIT 101 OFFSET $2`,[search,(page-1)*100])).rows;
   const total=Number((await first(tx,"SELECT count(*) AS n FROM player.players WHERE status<>'closed' AND position(lower($1) in lower(display_name))>0",[search])).n);
   const products=[];
   for(const item of catalogue.items){if(await first(tx,"SELECT 1 FROM player.catalogue_versions WHERE product_id=$1 AND revision=$2 AND kind='item'",[item.id,item.revision]))products.push({productId:item.id,revision:item.revision,name:item.name,category:item.category,packSize:[2,4,6].includes(item.packSize)?item.packSize:null});}
   const history=(await tx.query(`SELECT o.id,o.administrator_id,o.rule_id,o.event_key,o.player_id,p.display_name,o.action,o.reason,o.created_at,o.result
    FROM player.beta_admin_operations o JOIN player.players p ON p.id=o.player_id ORDER BY o.created_at DESC,o.id DESC LIMIT 50`)).rows;
   return {administratorId:actor.id,players:players.slice(0,100).map(p=>({id:p.id,displayName:p.display_name,accountStatus:p.status,experience:p.experience,evoros:p.evoros,access:p.access,version:p.version,administrator:p.administrator,masterAdministrator:p.master_administrator,initialGrant:p.initial_grant})),more:players.length>100,total,page,products,history:history.map(o=>({id:o.id,administratorId:o.administrator_id,ruleId:o.rule_id,eventKey:o.event_key,playerId:o.player_id,displayName:o.display_name,action:o.action,reason:o.reason,createdAt:new Date(o.created_at).toISOString(),result:o.result}))};
  });
 }
 async perform(token,input){
  const action=input?.action;
  const keys=['requestId','playerId','action','reason',...(action==='grant_item'?['productId','revision','quantity']:action==='grant_evoros'?['amount']:['ban','unban','delete'].includes(action)?['expectedAccountStatus']:['promote_admin','revoke_admin'].includes(action)?[]:['expectedVersion'])];
  fields(input,keys);if(!['approve','revoke','grant_evoros','grant_item','promote_admin','revoke_admin','ban','unban','delete'].includes(action))fail('INVALID_REQUEST');
  const payload={playerId:uuid(input.playerId),action,reason:reason(input.reason)};
  if(['ban','unban','delete'].includes(action)){if(!['active','suspended'].includes(input.expectedAccountStatus))fail('INVALID_REQUEST');payload.expectedAccountStatus=input.expectedAccountStatus;}
  else if(action==='grant_evoros')payload.amount=positive(input.amount);
  else if(action==='grant_item'){
   if(typeof input.productId!=='string')fail('INVALID_REQUEST');payload.productId=input.productId;payload.revision=positive(input.revision);payload.quantity=positive(input.quantity,1000);
   if(!catalogue.items.some(p=>p.id===payload.productId&&p.revision===payload.revision))fail('PRODUCT_UNAVAILABLE');
  }else if(!['promote_admin','revoke_admin','ban','unban','delete'].includes(action)){if(!Number.isSafeInteger(input.expectedVersion)||input.expectedVersion<0||input.expectedVersion>2147483647)fail('INVALID_REQUEST');payload.expectedVersion=input.expectedVersion;}
  const requestId=uuid(input.requestId),hash=fingerprint(payload);
  return this.accounts.transaction(async tx=>{
   if(['promote_admin','revoke_admin','ban','unban','delete'].includes(action))await tx.query('SELECT pg_advisory_xact_lock(420000011)');
   const actor=await this.administrator(tx,token);
   const previous=await first(tx,'SELECT payload_hash,result FROM player.beta_admin_operations WHERE administrator_id=$1 AND request_id=$2',[actor.id,requestId]);
   if(previous){if(previous.payload_hash!==hash)fail('RETRY_CONFLICT');return previous.result;}
   const player=await first(tx,'SELECT id,status FROM player.players WHERE id=$1 FOR UPDATE',[payload.playerId]);
   if(!player||player.status==='closed')fail('PLAYER_UNAVAILABLE');
   const access=await first(tx,'SELECT status,version FROM player.beta_access WHERE player_id=$1 FOR UPDATE',[player.id]);
   let version=access?.version??0,granted=0,quantity=null,revoked=0;
   const operationId=randomUUID();
   let balance=await this.economy.balance(tx,player.id);
   const credit=async(source,amount)=>{
    if(balance+amount>2147483647)fail('CAPACITY_EXCEEDED');
    const grantId=randomUUID();
    await tx.query('INSERT INTO player.beta_admin_grants(id,player_id,operation_id,source,amount) VALUES($1,$2,$3,$4,$5)',[grantId,player.id,operationId,source,amount]);
    await tx.query('INSERT INTO player.evoros_ledger(id,player_id,kind,delta,admin_grant_id) VALUES($1,$2,$3,$4,$5)',[randomUUID(),player.id,source==='beta_start'?'beta_credit':'reward_credit',amount,grantId]);
    await tx.query('UPDATE player.balances SET evoros=evoros+$1 WHERE player_id=$2',[amount,player.id]);balance+=amount;granted=amount;
   };
   if(['ban','unban','delete'].includes(action)){
    if(payload.expectedAccountStatus!==player.status)fail('STALE_ACCESS');
    if(action==='delete'){
     if(actor.id===player.id)fail('SELF_DELETE_PROTECTED');
     if(await first(tx,'SELECT 1 FROM player.beta_administrators WHERE player_id=$1 AND revoked_at IS NULL',[player.id]))fail('ADMIN_ACCOUNT_PROTECTED');
     const tables=(await tx.query("SELECT to_regclass('player.game_reservations') AS reservations,to_regclass('player.battle_participants') AS battles,to_regclass('player.wallet_links') AS wallets")).rows[0];
     if(tables.reservations&&await first(tx,"SELECT 1 FROM player.game_reservations WHERE player_id=$1 AND status='held' AND expires_at>clock_timestamp()",[player.id]))fail('ACCOUNT_IN_BATTLE');
     if(tables.battles&&await first(tx,"SELECT 1 FROM player.battle_participants p JOIN player.trusted_battles b ON b.id=p.battle_id WHERE p.player_id=$1 AND b.status<>'complete'",[player.id]))fail('ACCOUNT_IN_BATTLE');
     revoked=await this.accounts.revokePlayer(tx,player.id);
     if(tables.wallets){
      const links=(await tx.query('DELETE FROM player.wallet_links WHERE player_id=$1 RETURNING id',[player.id])).rows;
      for(const link of links)await tx.query("INSERT INTO player.wallet_link_audit(id,player_id,action) VALUES($1,$2,'wallet_unlinked')",[randomUUID(),player.id]);
      await tx.query('DELETE FROM player.wallet_link_challenges WHERE player_id=$1',[player.id]);
     }
    }
    if(action==='ban'){
     if(actor.id===player.id)fail('SELF_BAN_PROTECTED');
     if(await first(tx,'SELECT 1 FROM player.beta_administrators WHERE player_id=$1 AND revoked_at IS NULL AND is_master',[player.id]))fail('MASTER_ADMINISTRATOR_PROTECTED');
     const target=await first(tx,'SELECT player_id FROM player.beta_administrators WHERE player_id=$1 AND revoked_at IS NULL',[player.id]);
     const count=Number((await first(tx,"SELECT count(*) AS n FROM player.beta_administrators d JOIN player.players p ON p.id=d.player_id WHERE d.revoked_at IS NULL AND p.status='active'")).n);
     if(target&&player.status==='active'&&count<=1)fail('LAST_ADMINISTRATOR');
     revoked=await this.accounts.revokePlayer(tx,player.id);
    }
    await tx.query('UPDATE player.players SET status=$1 WHERE id=$2',[action==='delete'?'closed':action==='ban'?'suspended':'active',player.id]);
   }else if(action==='approve'||action==='revoke'){
    if(payload.expectedVersion!==version)fail('STALE_ACCESS');
    if(action==='approve'){
     if(player.status!=='active')fail('PLAYER_UNAVAILABLE');
     await tx.query("UPDATE player.players SET status='active' WHERE id=$1",[player.id]);
     if(!await first(tx,"SELECT 1 FROM player.beta_admin_grants WHERE player_id=$1 AND source='beta_start'",[player.id]))await credit('beta_start',5000);
    }else{
     // Beta eligibility is independent of permanent account/admin permissions.
     // Revocation retains login, administrator access, inventory and balance.
    }
    version++;
    await tx.query('INSERT INTO player.beta_access(player_id,status,version) VALUES($1,$2,$3) ON CONFLICT(player_id) DO UPDATE SET status=EXCLUDED.status,version=EXCLUDED.version,updated_at=clock_timestamp()',[player.id,action==='approve'?'approved':'revoked',version]);
   }else{
    if(player.status!=='active')fail('PLAYER_UNAVAILABLE');
        if(action==='grant_evoros')await credit('reward_evoros',payload.amount);
    else if(['promote_admin','revoke_admin'].includes(action)){
     if(action==='revoke_admin'){
      if(await first(tx,'SELECT 1 FROM player.beta_administrators WHERE player_id=$1 AND revoked_at IS NULL AND is_master',[player.id]))fail('MASTER_ADMINISTRATOR_PROTECTED');
      const target=await first(tx,'SELECT player_id FROM player.beta_administrators WHERE player_id=$1 AND revoked_at IS NULL',[player.id]);
      const count=Number((await first(tx,"SELECT count(*) AS n FROM player.beta_administrators d JOIN player.players p ON p.id=d.player_id WHERE d.revoked_at IS NULL AND p.status='active'")).n);
      if(target&&count<=1)fail('LAST_ADMINISTRATOR');
     }
     await tx.query('SELECT player.set_beta_administrator($1,$2,$3)',[actor.id,player.id,action==='promote_admin']);
    }
    else{
     quantity=await grantItem(tx,{playerId:player.id,operationId,productId:payload.productId,revision:payload.revision,quantity:payload.quantity});
    }
   }
   const result={operationId,playerId:player.id,action,access:action==='approve'?'approved':action==='revoke'?'revoked':access?.status??'pending',version,evoros:balance,evorosGranted:granted,...(quantity!==null?{productId:payload.productId,revision:payload.revision,quantityGranted:payload.quantity,remainingQuantity:quantity}:{}),sessionsRevoked:revoked,...(['promote_admin','revoke_admin'].includes(action)?{administrator:action==='promote_admin'}:{}),...(['ban','unban','delete'].includes(action)?{accountStatus:action==='delete'?'closed':action==='ban'?'suspended':'active'}:{})};
   await tx.query('INSERT INTO player.beta_admin_operations(id,administrator_id,player_id,request_id,action,payload_hash,reason,result) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[operationId,actor.id,player.id,requestId,action,hash,payload.reason,JSON.stringify(result)]);
   return result;
  });
 }
 // No HTTP route exposes this entry point. The optional resolver must read a
 // verified backend event and choose the rule/template; a client cannot supply rewards.
 async applyRuleReward(input) {
  fields(input,['eventId']);if(typeof input.eventId!=='string'||!input.eventId||input.eventId.length>160)fail('INVALID_REQUEST');
  if(!this.resolveRuleReward)fail('AUTOMATED_REWARDS_DISABLED');
  const reward=await this.resolveRuleReward(input.eventId);
  fields(reward,['playerId','ruleId','eventKey','productId','revision','quantity']);
  const playerId=uuid(reward.playerId),quantity=positive(reward.quantity,1000),revision=positive(reward.revision);
  if(typeof reward.ruleId!=='string'||!/^[a-z][a-z0-9_-]{0,79}$/.test(reward.ruleId)||typeof reward.eventKey!=='string'||!reward.eventKey||reward.eventKey.length>160||typeof reward.productId!=='string')fail('INVALID_REWARD_EVENT');
  const hash=fingerprint({playerId,ruleId:reward.ruleId,eventKey:reward.eventKey,productId:reward.productId,revision,quantity});
  return this.accounts.transaction(async tx=>{
   const player=await first(tx,"SELECT id,status FROM player.players WHERE id=$1 FOR UPDATE",[playerId]);
   const access=await first(tx,"SELECT status,version FROM player.beta_access WHERE player_id=$1",[playerId]);
   if(player?.status!=='active'||access?.status!=='approved')fail('TESTER_NOT_APPROVED');
   const old=await first(tx,'SELECT result,payload_hash FROM player.beta_admin_operations WHERE rule_id=$1 AND event_key=$2 AND player_id=$3',[reward.ruleId,reward.eventKey,playerId]);
   if(old){if(old.payload_hash!==hash)fail('RETRY_CONFLICT');return old.result;}
   const operationId=randomUUID(),balance=await this.economy.balance(tx,playerId);
   const remaining=await grantItem(tx,{playerId,operationId,productId:reward.productId,revision,quantity});
   const result={operationId,playerId,action:'grant_item',access:'approved',version:access.version,evoros:balance,evorosGranted:0,sessionsRevoked:0,productId:reward.productId,revision,quantityGranted:quantity,remainingQuantity:remaining};
   await tx.query("INSERT INTO player.beta_admin_operations(id,administrator_id,rule_id,event_key,player_id,request_id,action,payload_hash,reason,result) VALUES($1,NULL,$2,$3,$4,$5,'grant_item',$6,'Verified automatic reward',$7)",[operationId,reward.ruleId,reward.eventKey,playerId,randomUUID(),hash,JSON.stringify(result)]);
   return result;
  });
 }

}
// Operator-only first administrator bootstrap. Existing admins use audited role changes.
async function pinLocalAdministrator({database,displayName,master=false}){
 if(typeof displayName!=='string'||!displayName.trim()||displayName.length>80)fail('INVALID_CONFIGURATION');
 return database.transaction(async tx=>{
  await tx.query("SELECT pg_advisory_xact_lock(420000011)");
  const existing=(await tx.query('SELECT player_id FROM player.beta_administrators WHERE revoked_at IS NULL')).rows;
  if(existing.length)return {alreadyPinned:true,playerIds:existing.map(p=>p.player_id)};
  const players=(await tx.query("SELECT p.id FROM player.players p WHERE p.display_name=$1 AND p.status='active' AND EXISTS(SELECT 1 FROM player.identities i WHERE i.player_id=p.id AND i.provider='epic' AND i.verified_at IS NOT NULL)",[displayName])).rows;
  if(players.length!==1)fail(players.length?'ADMIN_IDENTITY_AMBIGUOUS':'ADMIN_IDENTITY_NOT_FOUND');
  const playerId=players[0].id;
  await tx.query('INSERT INTO player.beta_administrators(player_id,is_master) VALUES($1,$2) ON CONFLICT(player_id) DO UPDATE SET revoked_at=NULL',[playerId,master]);
  const result={playerId,action:'bootstrap'};
  await tx.query("INSERT INTO player.beta_admin_operations(id,administrator_id,player_id,request_id,action,payload_hash,reason,result) VALUES($1,$2,$2,$3,'bootstrap',$4,'Operator confirmed Epic administrator',$5)",[randomUUID(),playerId,randomUUID(),fingerprint(result),JSON.stringify(result)]);
  return {alreadyPinned:false,playerIds:[playerId]};
 });
}
module.exports={BetaAdministration,pinLocalAdministrator};
