"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {randomUUID}=require('node:crypto');
const {prepareWebsiteGameStore}=require('../../scripts/game-store-local.cjs');
const accountRepo=path.resolve(__dirname,'../../../../..','evoverses-beta-account-bridge');
const {localPGlite}=require(path.join(accountRepo,'Prototypes/player_economy/scripts/local-pglite.cjs'));
const {setup}=require(path.join(accountRepo,'Prototypes/player_economy/scripts/fixtures.cjs'));
test('default website service never opens or migrates a game Store',async()=>{
 assert.equal(await prepareWebsiteGameStore({}),null);
 await assert.rejects(prepareWebsiteGameStore({enabled:true,accountRepo,runRoot:path.join(accountRepo,'Saved','not-an-owned-account-run')}));
});
test('owned local activation writes a restorable pre-migration backup, preserves accounts, and repeats once',async()=>{
 const runRoot=path.join(accountRepo,'Saved','EpicAccountLocal-'+randomUUID().replaceAll('-',''));fs.mkdirSync(runRoot);let db,restored;
 try {
  const PGlite=localPGlite();db=new PGlite();const fixture=await setup(db);
  const before=(await db.query('SELECT count(*)::integer AS total FROM player.players')).rows[0].total;
  const args={enabled:true,accountRepo,runRoot,db,economy:fixture.economy};
  const store=await prepareWebsiteGameStore(args);assert.equal((await store.offers(fixture.aliceToken)).items.length,57);
  const backups=fs.readdirSync(runRoot).filter(p=>p.endsWith('.tar.gz'));assert.equal(backups.length,1);
  const bytes=fs.readFileSync(path.join(runRoot,backups[0]));assert.ok(bytes.length>0);
  restored=new PGlite({loadDataDir:new Blob([bytes])});
  assert.equal((await restored.query('SELECT count(*)::integer AS total FROM player.players')).rows[0].total,before);
  assert.equal((await restored.query("SELECT to_regclass('player.evo_pack_openings') AS found")).rows[0].found,null);
  await prepareWebsiteGameStore(args);assert.equal(fs.readdirSync(runRoot).filter(p=>p.endsWith('.tar.gz')).length,1);
  assert.equal((await db.query('SELECT count(*)::integer AS total FROM player.players')).rows[0].total,before);
 }finally{if(restored)await restored.close();if(db)await db.close();fs.rmSync(runRoot,{recursive:true,force:true});}
});
