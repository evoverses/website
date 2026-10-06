"use strict";
// Offline local operator fixture. Never imported by a route or enabled in the running service.
// Reuses existing test payment/ledger mechanics; no Stripe/EVO/AWS/network request is made.
const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
async function grantTestEvoros(db,modules,requestId) {
 const {embeddedDatabase,PlayerEconomy,EconomyError}=modules;
 const database=embeddedDatabase(db),scope='acct_local_manual_test_evoros_grant';
 const reserved=await db.transaction(async tx=>{
  const players=await tx.query("SELECT p.id FROM player.players p WHERE p.status='active' AND EXISTS (SELECT 1 FROM player.identities i WHERE i.player_id=p.id AND i.provider='epic') FOR UPDATE");
  if(players.rows.length!==1)throw new Error('Exactly one existing active Epic player required; no account was created');
  const player=players.rows[0].id;
  const previous=(await tx.query('SELECT * FROM player.payment_orders WHERE player_id=$1 AND request_id=$2',[player,requestId])).rows[0];
  if(previous){if(previous.mode!=='test'||previous.payment_scope!==scope||previous.bundle_id!=='bundle_vault')throw new Error('Conflicting test grant');return previous;}
  return (await tx.query(`INSERT INTO player.payment_orders
   (id,player_id,request_id,bundle_id,evoros,rail,mode,payment_scope,currency,unit_amount,price_id,expires_at)
   SELECT $1,$2,$3,id,evoros,'stripe','test',$4,'usd',1,'price_local_manual_test_only',now()+interval '1 hour'
   FROM player.evoros_bundles WHERE id='bundle_vault' RETURNING *`,[randomUUID(),player,requestId,scope])).rows[0];
 });
 if(!reserved||reserved.evoros!==10000)throw new Error('Expected 10000-Evoros fixture bundle');
 const session='cs_local_manual_grant_'+reserved.id.replaceAll('-','');
 const economy=new PlayerEconomy({database,mode:'test',paymentScope:scope,prices:{},
  verifyCardPayment:async({sessionId})=>{
   if(sessionId!==session)throw new Error('Unknown local fixture');
   return {sessionId,mode:'test',paymentScope:scope,orderId:reserved.id,playerId:reserved.player_id,bundleId:reserved.bundle_id,
    evoros:reserved.evoros,priceId:reserved.price_id,currency:reserved.currency,amountSubtotal:reserved.unit_amount,
    amountTotal:reserved.unit_amount,quantity:1,status:'complete',paymentStatus:'paid'};
  },resolveEvoTemplate:async()=>{throw new EconomyError('CATALOGUE_DISABLED');}});
 const outcome=await economy.creditOnce(reserved.id,session);
 const balance=await db.transaction(tx=>economy.balance(tx,reserved.player_id));
 return {outcome,amount:reserved.evoros,balance,mode:'local-test-only'};
}
async function main(){
 const [accountRepo,runRoot,requestId]=process.argv.slice(2);
 if(process.env.NODE_ENV==='production'||!accountRepo||!runRoot||!path.isAbsolute(accountRepo)||!path.isAbsolute(runRoot)||
  path.dirname(path.resolve(runRoot))!==path.join(path.resolve(accountRepo),'Saved')||!/^EpicAccountLocal-[a-f0-9]{32}$/.test(path.basename(runRoot))||
  !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(requestId||''))throw new Error('Explicit isolated local run and grant UUID required');
 const stopped=JSON.parse(fs.readFileSync(path.join(runRoot,'stopped.json'),'utf8'));
 const ready=JSON.parse(fs.readFileSync(path.join(runRoot,'ready.json'),'utf8'));
 if(stopped.stopped!==true||stopped.database!=='closed'||ready.mode!=='Account')throw new Error('Stop the owned account service before opening its database');
 const backend=path.join(accountRepo,'Prototypes/player_economy');
 const {localPGlite}=require(path.join(backend,'scripts/local-pglite.cjs'));
 const modules={...require(path.join(backend,'src/database.cjs')),...require(path.join(backend,'src/economy.cjs'))};
 const db=new (localPGlite())(path.join(runRoot,'Database'));
 try{console.log(JSON.stringify(await grantTestEvoros(db,modules,requestId)));}finally{await db.close();}
}
if(require.main===module)main().catch(error=>{console.error(JSON.stringify({stage:'LOCAL_TEST_CREDIT_FAILED',code:/^[A-Z0-9_]{1,80}$/.test(error.code||'')?error.code:'UNKNOWN',type:error.name}));process.exitCode=1});
module.exports={grantTestEvoros};
