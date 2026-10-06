"use strict";
const {test}=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const {websiteAccountContext}=require('../../scripts/player-account-context.cjs');
const game='gamefixtureclient00000000000001',web='websitefixtureclient000000000001';
const expected={audience:game,productId:'fixture-product',sandboxId:'fixture-sandbox',deploymentId:'fixture-deployment'};
const reviewed={...expected,issuer:'https://api.epicgames.dev/epic/oauth/v1',applicationId:'fixture-app'};
const env={NODE_ENV:'development',EVOVERSES_LOCAL_EPIC_ACCOUNT_LOGIN:'1',NEXT_PUBLIC_EVOVERSES_LOCAL_PLAYER_LOGIN:'1',AUTH_EPIC_ID:web,AUTH_EPIC_SECRET:'synthetic-secret'};
test('trusted web/game allowlist binds both clients to the reviewed environment and excludes secrets',()=>{
 const c=websiteAccountContext(env,expected,reviewed,{...reviewed});
 assert.deepEqual(c.clients.map(c=>c.audience),[game,web]);assert.equal(c.issuer,reviewed.issuer);
 for(const client of c.clients)assert.deepEqual(client.requiredClaims,{appid:'fixture-app',pfpid:'fixture-product',pfsid:'fixture-sandbox',pfdid:'fixture-deployment'});
 assert.equal(JSON.stringify(c).includes(env.AUTH_EPIC_SECRET),false);
});
test('missing web configuration, game-client fallback and changed reviewed context fail closed',()=>{
 for(const change of [{AUTH_EPIC_ID:undefined},{AUTH_EPIC_SECRET:undefined},{AUTH_EPIC_SECRET:'REPLACE_ME'},{AUTH_EPIC_ID:game},{AUTH_EPIC_SECRET:' padded '},{NODE_ENV:'production'},{EVOVERSES_LOCAL_EPIC_ACCOUNT_LOGIN:'0'},{NEXT_PUBLIC_EVOVERSES_LOCAL_PLAYER_LOGIN:'0'}])assert.throws(()=>websiteAccountContext({...env,...change},expected,reviewed,{...reviewed}));
 for(const key of Object.keys(reviewed))assert.throws(()=>websiteAccountContext(env,expected,reviewed,{...reviewed,[key]:'wrong'}));
 assert.throws(()=>websiteAccountContext(env,expected,{...reviewed,issuer:'https://attacker.test'},{...reviewed,issuer:'https://attacker.test'}));
});
function server(options={}){
 const root=path.resolve('synthetic/EpicAccountLocal-'+('a'.repeat(32))),config={...env,EVOVERSES_LOCAL_EPIC_RUN_ROOT:root,...options.env};
 const files={'expected-context.json':expected,'reviewed-context.json':reviewed,'verified-context.json':{...reviewed},'ready.json':{mode:'Account',apiUrl:'http://127.0.0.1:50999',websiteClientId:options.readyClient??web}};
 const mod={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/player/server.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module:mod,exports:mod.exports,process:{env:config},require:name=>({
  'server-only':{},'node:fs':{statSync:()=>({size:100}),existsSync:()=>!!options.stopped,readFileSync:file=>{const data=files[path.basename(file)];assert.ok(data,'Only public context/readiness files may be read');return JSON.stringify(data);}},
  'node:path':{default:path},'react':{cache:fn=>fn},'next/headers':{},'./auth-core':{PlayerWebError:class extends Error{}}
 }[name])});return mod.exports;
}
test('website selects its own server-only credentials only when backend readiness approves that same client',()=>{
 const c=server().getLocalEpicConfig();assert.equal(c.clientId,web);assert.equal(c.clientSecret,env.AUTH_EPIC_SECRET);assert.equal(c.applicationId,reviewed.applicationId);
 for(const o of [{readyClient:game},{stopped:true},{env:{AUTH_EPIC_ID:undefined}},{env:{AUTH_EPIC_ID:game}}])assert.equal(server(o).getLocalEpicConfig(),null);
});
test('signed game/web login maps one player; forged or wrong-context evidence cannot issue sessions; web logout preserves game session',async()=>{
 const backend=path.join(process.env.EVOVERSES_ACCOUNT_TEST_REPO||path.resolve(__dirname,'../../../../..','evoverses-beta-account-bridge'),'Prototypes/player_economy');
 const {signedEpic}=require(path.join(backend,'tests/helpers/epic.cjs')),{createEpicEvidenceVerifier}=require(path.join(backend,'src/epic.cjs'));
 const {localPGlite}=require(path.join(backend,'scripts/local-pglite.cjs')),{embeddedDatabase}=require(path.join(backend,'src/database.cjs')),{PlayerAccounts}=require(path.join(backend,'src/accounts.cjs'));
 const signed=signedEpic(),{websiteClientId,...restrictions}=websiteAccountContext(env,expected,reviewed,{...reviewed});
 const verifier=createEpicEvidenceVerifier({...restrictions,fetchImpl:signed.config.fetchImpl}),db=new (localPGlite())();
 try{
  for(const schema of ['001_player_economy.sql','002_account_lifecycle.sql'])await db.exec(fs.readFileSync(path.join(backend,'schema',schema),'utf8'));
  const accounts=new PlayerAccounts({database:embeddedDatabase(db),mode:'test',...verifier});
  const first=await accounts.login({proof:signed.token({aud:game}),confirmNewPlayer:true}),second=await accounts.login({proof:signed.token({aud:web})});
  assert.equal(first.player.id,second.player.id);assert.notEqual(first.sessionToken,second.sessionToken);
  const before=Number((await db.query('SELECT count(*) AS n FROM player.sessions')).rows[0].n);
  for(const claims of [{aud:'unapproved-client'},{aud:web,appid:'wrong-app'},{aud:web,pfpid:'wrong-product'},{aud:web,pfsid:'wrong-sandbox'},{aud:web,pfdid:'wrong-deployment'},{aud:web,iss:'https://api.epicgames.dev/epic/oauth/v2'}])await assert.rejects(accounts.login({proof:signed.token(claims),confirmNewPlayer:true}),e=>e.code==='INVALID_PROVIDER_EVIDENCE');
  const parts=signed.token({aud:web}).split('.'),c=JSON.parse(Buffer.from(parts[1],'base64url'));c.sub='b'.repeat(32);parts[1]=Buffer.from(JSON.stringify(c)).toString('base64url');
  await assert.rejects(accounts.login({proof:parts.join('.'),confirmNewPlayer:true}),e=>e.code==='INVALID_PROVIDER_EVIDENCE');
  assert.equal(Number((await db.query('SELECT count(*) AS n FROM player.sessions')).rows[0].n),before);assert.equal(Number((await db.query('SELECT count(*) AS n FROM player.players')).rows[0].n),1);
  await accounts.logout(second.sessionToken);await assert.rejects(accounts.session(second.sessionToken),e=>e.code==='INVALID_SESSION');assert.equal((await accounts.session(first.sessionToken)).id,first.player.id);
 }finally{await db.close();}
});
