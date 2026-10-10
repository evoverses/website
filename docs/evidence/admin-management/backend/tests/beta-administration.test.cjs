"use strict";
const {test,beforeEach,afterEach}=require('node:test'),assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {localPGlite,setup}=require('../scripts/fixtures.cjs');
const {embeddedDatabase}=require('../src/database.cjs');
const {accountFixtures}=require('../scripts/account-fixtures.cjs');
const {BetaAdministration,pinLocalAdministrator}=require('../src/beta-administration.cjs');
const {prepareLocalBetaAdministration}=require('../src/local-beta-administration.cjs');
const {GameStore}=require('../src/game-store.cjs');
const {startLocalStoreApi,startLocalReadApi}=require('../src/http.cjs');
let db,f,a,admin,dan,shop;
const reject=(p,code)=>assert.rejects(p,e=>e.code===code);
beforeEach(async()=>{
 db=new (localPGlite())();f=await setup(db);a=accountFixtures(embeddedDatabase(db));
 await db.exec(fs.readFileSync(path.join(__dirname,'../schema/004_game_store_packs.sql'),'utf8'));
 await db.exec(fs.readFileSync(path.join(__dirname,'../schema/011_beta_administration.sql'),'utf8'));
 await db.exec(fs.readFileSync(path.join(__dirname,'../schema/014_beta_admin_promotion.sql'),'utf8'));
 await db.exec(fs.readFileSync(path.join(__dirname,'../schema/016_account_bans.sql'),'utf8'));
 await db.exec(fs.readFileSync(path.join(__dirname,'../schema/018_account_deletion.sql'),'utf8'));
 shop=new GameStore({economy:f.economy,mode:'local-test'});await shop.installCatalogue();
 dan=await a.accounts.login({proof:a.proof('fixture:dan','fixture-web',{displayName:'Danmancs'}),confirmNewPlayer:true});
 await pinLocalAdministrator({database:embeddedDatabase(db),displayName:'Danmancs'});
 admin=new BetaAdministration({accounts:a.accounts,economy:f.economy,mode:'local-test'});
});
afterEach(async()=>db.close());
const action=(kind,extra={})=>({requestId:randomUUID(),playerId:f.alice,action:kind,reason:'Beta testing reward',...(kind==='approve'||kind==='revoke'?{expectedVersion:0}:{}),...extra});
const approve=()=>admin.perform(dan.sessionToken,action('approve'));
test('only a verified explicitly selected Epic player can bootstrap; role persists across renamed display names',async()=>{
 const pinned=await pinLocalAdministrator({database:embeddedDatabase(db),displayName:'Someone else'});assert.equal(pinned.alreadyPinned,true);assert.deepEqual(pinned.playerIds,[dan.player.id]);
 await db.query('UPDATE player.players SET display_name=$1 WHERE id=$2',['Renamed Dan',dan.player.id]);
 assert.equal((await admin.list(dan.sessionToken)).administratorId,dan.player.id);
 await assert.rejects(db.exec('DELETE FROM player.beta_administrators'),e=>e.code==='23514');
});
test('ordinary, expired and revoked sessions cannot inspect players or grant anything',async()=>{
 await reject(admin.list(f.aliceToken),'ADMIN_REQUIRED');await reject(admin.perform(f.aliceToken,action('approve')),'ADMIN_REQUIRED');
 await a.accounts.logout(dan.sessionToken);await reject(admin.list(dan.sessionToken),'INVALID_SESSION');
 assert.equal((await f.economy.getSnapshot(f.aliceToken)).evoros,0);
});
test('approval credits exactly 5000, preserves old money, and retries and reapproval never duplicate it',async()=>{
 await f.topUp();const input=action('approve'),first=await admin.perform(dan.sessionToken,input);
 assert.equal(first.evoros,5250);assert.deepEqual(await admin.perform(dan.sessionToken,input),first);
 const again=await admin.perform(dan.sessionToken,action('approve',{expectedVersion:1}));assert.equal(again.evorosGranted,0);
 assert.equal((await f.economy.getSnapshot(f.aliceToken)).evoros,5250);
 assert.equal((await db.query("SELECT count(*)::integer AS n FROM player.beta_admin_grants WHERE source='beta_start'")).rows[0].n,1);
});
test('simultaneous approval and new request IDs cannot multiply starter currency',async()=>{
 const request=action('approve');const results=await Promise.all(Array.from({length:5},()=>admin.perform(dan.sessionToken,request)));
 assert.equal(new Set(results.map(r=>r.operationId)).size,1);
 await reject(admin.perform(dan.sessionToken,action('approve')),'STALE_ACCESS');
 assert.equal((await f.economy.getSnapshot(f.aliceToken)).evoros,5000);
});
test('repeated rewards are possible with different IDs; a changed retry fails',async()=>{
 await approve();const input=action('grant_evoros',{amount:750});const first=await admin.perform(dan.sessionToken,input);
 assert.equal(first.evoros,5750);assert.deepEqual(await admin.perform(dan.sessionToken,input),first);
 await reject(admin.perform(dan.sessionToken,{...input,amount:751}),'RETRY_CONFLICT');
 await admin.perform(dan.sessionToken,action('grant_evoros',{amount:100}));assert.equal((await f.economy.getSnapshot(f.aliceToken)).evoros,5850);
});
test('consumables and unopened packs are granted atomically; pack opening uses saved random flow',async()=>{
 await approve();const input=action('grant_item',{productId:'vital_dew',revision:2,quantity:3});
 assert.equal((await admin.perform(dan.sessionToken,input)).remainingQuantity,3);await admin.perform(dan.sessionToken,input);
 await admin.perform(dan.sessionToken,action('grant_item',{productId:'evo_pack_2',revision:2,quantity:1}));
 const opening=await shop.openPack(f.aliceToken,{requestId:randomUUID(),productId:'evo_pack_2',revision:2});assert.equal(opening.evos.length,2);
 const snapshot=await f.economy.getSnapshot(f.aliceToken);assert.equal(snapshot.items.find(i=>i.productId==='vital_dew'&&i.revision===2).quantity,3);assert.equal(snapshot.evoros,5000);
});
test('unknown revisions, invented effects, prices, recipients and invalid quantities fail closed',async()=>{
 await approve();for(const patch of [{amount:0},{amount:-1},{amount:1.2},{amount:2147483648},{amount:1,administratorId:dan.player.id},{amount:1,verified:true},{amount:1,reason:''}])await reject(admin.perform(dan.sessionToken,action('grant_evoros',patch)),'INVALID_REQUEST');
 await reject(admin.perform(dan.sessionToken,action('grant_item',{productId:'evo_pack_2',revision:999,quantity:1})),'PRODUCT_UNAVAILABLE');
 await reject(admin.perform(dan.sessionToken,action('grant_item',{productId:'evo_pack_2',revision:2,quantity:1,effect:{evos:100}})),'INVALID_REQUEST');
 assert.equal((await f.economy.getSnapshot(f.aliceToken)).evoros,5000);
});
test('beta revocation preserves login; reapproval preserves inventory and never repeats initial money',async()=>{
 await approve();await admin.perform(dan.sessionToken,action('grant_item',{productId:'evo_pack_4',revision:2,quantity:2}));
 const revoked=await admin.perform(dan.sessionToken,action('revoke',{expectedVersion:1}));assert.equal(revoked.sessionsRevoked,0);
 assert.equal((await f.economy.getSnapshot(f.aliceToken)).evoros,5000);
 await admin.perform(dan.sessionToken,action('grant_evoros',{amount:10}));
 const again=await admin.perform(dan.sessionToken,action('approve',{expectedVersion:2}));assert.equal(again.evoros,5010);assert.equal(again.evorosGranted,0);
 assert.equal((await db.query("SELECT quantity FROM player.item_inventory WHERE player_id=$1 AND product_id='evo_pack_4'",[f.alice])).rows[0].quantity,2);
});
test('beta status is independent of the operator account; manual suspensions cannot be bypassed',async()=>{
 await admin.perform(dan.sessionToken,action('revoke',{playerId:dan.player.id}));
 assert.equal((await admin.list(dan.sessionToken)).administratorId,dan.player.id);
 await db.query("UPDATE player.players SET status='suspended' WHERE id=$1",[f.alice]);await reject(approve(),'PLAYER_UNAVAILABLE');
});
test('audit insert failure rolls money, item grant, and approval back together',async()=>{
 await db.exec("CREATE FUNCTION player.fail_beta_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture'; END $$; CREATE TRIGGER fail_beta_audit BEFORE INSERT ON player.beta_admin_operations FOR EACH ROW EXECUTE FUNCTION player.fail_beta_audit();");
 await reject(approve(),'STORAGE_FAILURE');assert.equal((await f.economy.getSnapshot(f.aliceToken)).evoros,0);
 assert.equal((await db.query('SELECT count(*)::integer AS n FROM player.beta_admin_grants')).rows[0].n,0);
 assert.equal((await db.query('SELECT count(*)::integer AS n FROM player.beta_access')).rows[0].n,0);
});
test('ledger binds grant amount, recipient and source; audit and grants remain append-only',async()=>{
 await approve();const grant=(await db.query('SELECT * FROM player.beta_admin_grants')).rows[0];
 for(const sql of ['DELETE FROM player.beta_admin_grants','DELETE FROM player.beta_admin_operations','UPDATE player.beta_admin_grants SET amount=1'])await assert.rejects(db.exec(sql),e=>e.code==='23514');
 await assert.rejects(db.query('INSERT INTO player.evoros_ledger(id,player_id,kind,delta,admin_grant_id) VALUES($1,$2,\'reward_credit\',1,$3)',[randomUUID(),f.bob,grant.id]),e=>['23514','23503'].includes(e.code));
});
test('management snapshot contains catalogue and audited reasons but no wallets, identities or sessions',async()=>{
 await approve();const got=await admin.list(dan.sessionToken,{search:'Alice'});assert.equal(got.players.length,1);assert.equal(got.products.length,57);assert.ok(got.products.every(p=>[null,2,4,6].includes(p.packSize)));
 const text=JSON.stringify(got);for(const secret of [dan.sessionToken,'fixture:dan','token_hash','wallet_address'])assert.ok(!text.includes(secret));
 assert.ok(got.history.some(o=>o.reason==='Beta testing reward'));
});
test('admin routes enforce session and strict payload; read-only API never exposes administration',async()=>{
 const api=await startLocalStoreApi({economy:f.economy,accounts:a.accounts,store:shop,betaAdmin:admin});
 try{
 const request=(route,body,token)=>fetch(api.url+route,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
 assert.equal((await request('/v1/beta/admin/list',{},f.aliceToken)).status,403);
 assert.equal((await request('/v1/beta/admin/list',{})).status,401);
 assert.equal((await request('/v1/beta/admin/action',action('approve'),dan.sessionToken)).status,200);
 assert.equal((await request('/v1/beta/admin/action',{...action('grant_evoros',{amount:10}),verified:true},dan.sessionToken)).status,400);
 }finally{await api.close();}
 const read=await startLocalReadApi({economy:f.economy});try{assert.equal((await fetch(read.url+'/v1/beta/admin/list',{method:'POST',headers:{'content-type':'application/json',authorization:'Bearer '+dan.sessionToken},body:'{}'})).status,404);}finally{await read.close();}
});

test('automatic reward seam stays disabled without trusted event resolver and has no public route',async()=>{
 await reject(admin.applyRuleReward({eventId:'level-event'}),'AUTOMATED_REWARDS_DISABLED');
 await reject(admin.applyRuleReward({eventId:'level-event',quantity:999}),'INVALID_REQUEST');
});
test('future verified milestone events use common unopened-pack grant and deduplicate the milestone across event IDs',async()=>{
 await approve();
 const reward={playerId:f.alice,ruleId:'player-level-pack-v1',eventKey:'level:10',productId:'evo_pack_2',revision:2,quantity:1};
 const rules=new BetaAdministration({accounts:a.accounts,economy:f.economy,mode:'local-test',resolveRuleReward:async()=>reward});
 const one=await rules.applyRuleReward({eventId:'trusted-progress-event-1'});
 assert.deepEqual(await rules.applyRuleReward({eventId:'trusted-progress-event-2'}),one);
 assert.equal((await f.economy.getSnapshot(f.aliceToken)).items.find(i=>i.productId==='evo_pack_2').quantity,1);
 reward.eventKey='level:20';await rules.applyRuleReward({eventId:'trusted-progress-event-3'});
 assert.equal((await f.economy.getSnapshot(f.aliceToken)).items.find(i=>i.productId==='evo_pack_2').quantity,2);
 const automatic=(await admin.list(dan.sessionToken)).history.filter(h=>h.ruleId);assert.equal(automatic.length,2);assert.equal(automatic[0].administratorId,null);
});

test('reward audit failures also roll currency and stock back',async()=>{
 await approve();await db.exec("CREATE FUNCTION player.fail_reward_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'fixture'; END $$; CREATE TRIGGER fail_reward_audit BEFORE INSERT ON player.beta_admin_operations FOR EACH ROW EXECUTE FUNCTION player.fail_reward_audit();");
 await reject(admin.perform(dan.sessionToken,action('grant_evoros',{amount:500})),'STORAGE_FAILURE');
 await reject(admin.perform(dan.sessionToken,action('grant_item',{productId:'evo_pack_2',revision:2,quantity:1})),'STORAGE_FAILURE');
 const snapshot=await f.economy.getSnapshot(f.aliceToken);assert.equal(snapshot.evoros,5000);assert.equal(snapshot.items.length,0);
 assert.equal((await db.query('SELECT count(*)::integer AS n FROM player.beta_admin_grants')).rows[0].n,1);
});
test('first bootstrap fails for missing or ambiguous Epic name and refuses migration without backup',async()=>{
 const fresh=new (localPGlite())();try{
 const fixture=await setup(fresh),accounts=accountFixtures(embeddedDatabase(fresh));
 await reject(prepareLocalBetaAdministration({enabled:true,db:fresh,accounts:accounts.accounts,economy:fixture.economy}),'LOCAL_BACKUP_REQUIRED');
 await fresh.exec(fs.readFileSync(path.join(__dirname,'../schema/011_beta_administration.sql'),'utf8'));
 await fresh.exec(fs.readFileSync(path.join(__dirname,'../schema/014_beta_admin_promotion.sql'),'utf8'));
 await reject(pinLocalAdministrator({database:embeddedDatabase(fresh),displayName:'Danmancs'}),'ADMIN_IDENTITY_NOT_FOUND');
 for(const subject of ['fixture:dan1','fixture:dan2'])await accounts.accounts.login({proof:accounts.proof(subject,'fixture-web',{displayName:'Danmancs'}),confirmNewPlayer:true});
 await reject(pinLocalAdministrator({database:embeddedDatabase(fresh),displayName:'Danmancs'}),'ADMIN_IDENTITY_AMBIGUOUS');
 assert.equal((await fresh.query('SELECT count(*)::integer AS n FROM player.beta_administrators')).rows[0].n,0);
 }finally{await fresh.close();}
});


test('active verified players can be made admin independently of beta, with an immutable idempotent receipt',async()=>{
 const other=await a.accounts.login({proof:a.proof('fixture:second-admin','fixture-web',{displayName:'Second Admin'}),confirmNewPlayer:true});
 const input=action('promote_admin',{playerId:other.player.id});
 await reject(admin.perform(other.sessionToken,input),'ADMIN_REQUIRED');
 const saved=await admin.perform(dan.sessionToken,input);assert.equal(saved.administrator,true);assert.equal(saved.evoros,0);assert.equal(saved.access,'pending');
 assert.deepEqual(await admin.perform(dan.sessionToken,input),saved);
 await reject(admin.perform(dan.sessionToken,{...input,reason:'changed'}),'RETRY_CONFLICT');
 assert.equal((await admin.list(other.sessionToken)).administratorId,other.player.id);
 await admin.perform(dan.sessionToken,action('revoke',{playerId:other.player.id,expectedVersion:0}));
 assert.equal((await admin.list(other.sessionToken)).administratorId,other.player.id);
});
test('account search sorts XP and balances and pages all accounts without accepting arbitrary SQL',async()=>{
 await db.query('UPDATE player.players SET experience=123 WHERE id=$1',[dan.player.id]);
 const listing=await admin.list(dan.sessionToken,{sort:'experience',direction:'desc',page:1});
 assert.equal(listing.players[0].experience,123);assert.equal(listing.players[0].id,dan.player.id);assert.ok(listing.total>=1);
 const empty=await admin.list(dan.sessionToken,{page:2});assert.equal(empty.players.length,0);
 for(const input of [{sort:'p.id; DROP TABLE player.players'},{direction:'DESC;--'},{page:0}])await reject(admin.list(dan.sessionToken,input),'INVALID_REQUEST');
});


test('admin revocation is independent of beta, immediately removes authority and protects the last active admin',async()=>{
 await reject(admin.perform(dan.sessionToken,action('revoke_admin',{playerId:dan.player.id})),'LAST_ADMINISTRATOR');
 const other=await a.accounts.login({proof:a.proof('fixture:revocable-admin','fixture-web',{displayName:'Another Admin'}),confirmNewPlayer:true});
 await admin.perform(dan.sessionToken,action('promote_admin',{playerId:other.player.id}));
 await admin.perform(dan.sessionToken,action('approve',{playerId:other.player.id}));
 const input=action('revoke_admin',{playerId:other.player.id}),saved=await admin.perform(dan.sessionToken,input);
 assert.equal(saved.administrator,false);assert.equal(saved.access,'approved');assert.equal(saved.evoros,5000);
 assert.deepEqual(await admin.perform(dan.sessionToken,input),saved);
 await reject(admin.list(other.sessionToken),'ADMIN_REQUIRED');
 await admin.perform(dan.sessionToken,action('promote_admin',{playerId:other.player.id}));
 assert.equal((await admin.list(other.sessionToken)).administratorId,other.player.id);
});


test('protected master membership is visible and cannot be revoked by another administrator',async()=>{
 const master=await a.accounts.login({proof:a.proof('fixture:master','fixture-web',{displayName:'Master'}),confirmNewPlayer:true});
 await db.query('INSERT INTO player.beta_administrators(player_id,is_master) VALUES($1,true)',[master.player.id]);
 const listing=await admin.list(dan.sessionToken,{search:'Master'});assert.equal(listing.players[0].masterAdministrator,true);
 await reject(admin.perform(dan.sessionToken,action('revoke_admin',{playerId:master.player.id})),'MASTER_ADMINISTRATOR_PROTECTED');
 await admin.perform(dan.sessionToken,action('revoke',{playerId:master.player.id}));
 assert.equal((await admin.list(master.sessionToken)).administratorId,master.player.id);
});

test('ban revokes web/game sessions and login; unban preserves inventory, balance, beta and expired sessions',async()=>{
 const login=await a.accounts.login({proof:a.proof('fixture:ban-target','fixture-web'),confirmNewPlayer:true});
 const game=await a.accounts.login({proof:a.proof('fixture:ban-target','fixture-game')});
 const playerId=login.player.id;
 await admin.perform(dan.sessionToken,action('approve',{playerId}));
 await admin.perform(dan.sessionToken,action('grant_item',{playerId,productId:'vital_dew',revision:2,quantity:2}));
 const input=action('ban',{playerId,expectedAccountStatus:'active'}),saved=await admin.perform(dan.sessionToken,input);
 assert.equal(saved.accountStatus,'suspended');assert.equal(saved.sessionsRevoked,2);
 assert.equal(saved.access,'approved');assert.equal(saved.evoros,5000);
 assert.deepEqual(await admin.perform(dan.sessionToken,input),saved);
 await reject(admin.perform(dan.sessionToken,{...input,reason:'Changed retry'}),'RETRY_CONFLICT');
 for(const token of [login.sessionToken,game.sessionToken])await reject(a.accounts.session(token),'INVALID_SESSION');
 await reject(a.accounts.login({proof:a.proof('fixture:ban-target')}),'ACCOUNT_UNAVAILABLE');
 await reject(admin.perform(login.sessionToken,action('unban',{playerId,expectedAccountStatus:'suspended'})),'INVALID_SESSION');
 await reject(admin.perform(dan.sessionToken,action('unban',{playerId,expectedAccountStatus:'active'})),'STALE_ACCESS');
 const restored=await admin.perform(dan.sessionToken,action('unban',{playerId,expectedAccountStatus:'suspended'}));
 assert.equal(restored.accountStatus,'active');assert.equal(restored.evorosGranted,0);
 const fresh=await a.accounts.login({proof:a.proof('fixture:ban-target')});
 assert.equal(fresh.player.id,playerId);await reject(a.accounts.session(login.sessionToken),'INVALID_SESSION');
 assert.equal((await f.economy.getSnapshot(fresh.sessionToken)).evoros,5000);
 assert.equal((await db.query('SELECT quantity FROM player.item_inventory WHERE player_id=$1 AND product_id=$2',[playerId,'vital_dew'])).rows[0].quantity,2);
});
test('ban requires administrator authority and protects own and master accounts',async()=>{
 await reject(admin.perform(f.aliceToken,action('ban',{expectedAccountStatus:'active'})),'ADMIN_REQUIRED');
 await reject(admin.perform(dan.sessionToken,action('ban',{playerId:dan.player.id,expectedAccountStatus:'active'})),'SELF_BAN_PROTECTED');
 const master=await a.accounts.login({proof:a.proof('fixture:ban-master'),confirmNewPlayer:true});
 await db.query('INSERT INTO player.beta_administrators(player_id,is_master) VALUES($1,true)',[master.player.id]);
 await reject(admin.perform(dan.sessionToken,action('ban',{playerId:master.player.id,expectedAccountStatus:'active'})),'MASTER_ADMINISTRATOR_PROTECTED');
});

test('delete permanently closes a player, hides it, revokes sessions and retains audited rewards on identical retry',async()=>{
 const player=await a.accounts.login({proof:a.proof('fixture:delete-player','fixture-web',{displayName:'Disposable tester'}),confirmNewPlayer:true});
 const other=await a.accounts.login({proof:a.proof('fixture:delete-player','fixture-game'),confirmNewPlayer:true});
 await admin.perform(dan.sessionToken,{requestId:randomUUID(),playerId:player.player.id,action:'grant_evoros',reason:'Test balance',amount:200});
 const input={requestId:randomUUID(),playerId:player.player.id,action:'delete',reason:'Remove synthetic test account',expectedAccountStatus:'active'};
 const result=await admin.perform(dan.sessionToken,input);assert.equal(result.accountStatus,'closed');assert.equal(result.sessionsRevoked,2);
 assert.deepEqual(await admin.perform(dan.sessionToken,input),result);
 await reject(admin.perform(dan.sessionToken,{...input,reason:'Changed retry'}),'RETRY_CONFLICT');
 await reject(a.accounts.session(player.sessionToken),'INVALID_SESSION');await reject(a.accounts.session(other.sessionToken),'INVALID_SESSION');
 await reject(a.accounts.login({proof:a.proof('fixture:delete-player','fixture-web'),confirmNewPlayer:true}),'ACCOUNT_UNAVAILABLE');
 const list=await admin.list(dan.sessionToken,{search:'Disposable tester'});assert.equal(list.players.length,0);assert.equal(list.total,0);assert.ok(list.history.some(h=>h.action==='delete'&&h.playerId===player.player.id));
 assert.equal((await db.query('SELECT evoros FROM player.balances WHERE player_id=$1',[player.player.id])).rows[0].evoros,200);
});
test('delete is administrator-only, protects current/admin accounts and rejects stale status',async()=>{
 const player=await a.accounts.login({proof:a.proof('fixture:delete-protection','fixture-web'),confirmNewPlayer:true});
 const input={requestId:randomUUID(),playerId:player.player.id,action:'delete',reason:'Testing guards',expectedAccountStatus:'active'};
 await reject(admin.perform(player.sessionToken,input),'ADMIN_REQUIRED');
 await reject(admin.perform(dan.sessionToken,{...input,playerId:dan.player.id}),'SELF_DELETE_PROTECTED');
 await reject(admin.perform(dan.sessionToken,{...input,expectedAccountStatus:'suspended'}),'STALE_ACCESS');
 await admin.perform(dan.sessionToken,{requestId:randomUUID(),playerId:player.player.id,action:'promote_admin',reason:'Testing role guard'});
 await reject(admin.perform(dan.sessionToken,input),'ADMIN_ACCOUNT_PROTECTED');
 assert.equal((await a.accounts.session(player.sessionToken)).id,player.player.id);
});
test('deleting a shared-wallet account removes only its links and challenges with unlink audit',async()=>{
 await db.exec(fs.readFileSync(path.join(__dirname,'../schema/013_wallet_links.sql'),'utf8'));
 const player=await a.accounts.login({proof:a.proof('fixture:delete-wallet','fixture-web'),confirmNewPlayer:true});
 const fingerprint='a'.repeat(64);
 for(const id of [player.player.id,dan.player.id])await db.query('INSERT INTO player.wallet_links(player_id,id,chain_id,address_fingerprint,address_ciphertext) VALUES($1,$2,43114,$3,$4)',[id,randomUUID(),fingerprint,'synthetic-ciphertext']);
 await admin.perform(dan.sessionToken,{requestId:randomUUID(),playerId:player.player.id,action:'delete',reason:'Clean local fixture',expectedAccountStatus:'active'});
 assert.equal((await db.query('SELECT player_id FROM player.wallet_links')).rows.length,1);
 assert.equal((await db.query('SELECT player_id FROM player.wallet_links')).rows[0].player_id,dan.player.id);
 assert.equal((await db.query("SELECT count(*)::int AS n FROM player.wallet_link_audit WHERE player_id=$1 AND action='wallet_unlinked'",[player.player.id])).rows[0].n,1);
});
test('live battle reservation blocks deletion and preserves usable session and account state',async()=>{
 await db.exec(fs.readFileSync(path.join(__dirname,'../schema/003_game_team_reservations.sql'),'utf8'));
 const player=await a.accounts.login({proof:a.proof('fixture:delete-held','fixture-web'),confirmNewPlayer:true});
 const {createHash}=require('node:crypto');
 await db.query("INSERT INTO player.game_reservations(id,player_id,session_hash,request_id,team,expires_at) VALUES($1,$2,$3,$4,'[{}]',clock_timestamp()+interval '2 minutes')",[randomUUID(),player.player.id,createHash('sha256').update(player.sessionToken).digest('hex'),randomUUID()]);
 await reject(admin.perform(dan.sessionToken,{requestId:randomUUID(),playerId:player.player.id,action:'delete',reason:'Must not delete active participant',expectedAccountStatus:'active'}),'ACCOUNT_IN_BATTLE');
 assert.equal((await a.accounts.session(player.sessionToken)).id,player.player.id);
});
