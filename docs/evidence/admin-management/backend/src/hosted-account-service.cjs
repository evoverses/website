'use strict';
// Portable public-beta composition. No local files, fixtures, payments, automatic
// migrations, admin bootstrap, provider-token logging or ranked runner imports.
const {postgresDatabase}=require('./database.cjs');
const {PlayerEconomy,EconomyError}=require('./economy.cjs');
const {PlayerAccounts}=require('./accounts.cjs');
const {createEpicEvidenceVerifier}=require('./epic.cjs');
const {GameStore}=require('./game-store.cjs');
const {PlayerLoadouts}=require('./player-loadouts.cjs');
const {EvoCombatState}=require('./evo-combat-state.cjs');
const {GameTeamReservations}=require('./team-reservations.cjs');
const {CasualPractice}=require('./casual-practice.cjs');
const {BetaAdministration}=require('./beta-administration.cjs');
const {GameAccess}=require('./game-access.cjs');
const {WebOAuthStore}=require('./web-oauth-store.cjs');
const {startHostedBetaApi}=require('./http.cjs');
const progression=require('../../../Content/Store/Data/evo-progression.json');
const definitions=require('../../../Content/Store/Data/combat-definitions.json');
const tables=['players','sessions','starter_pack_grants','evo_combat_state','loadouts','item_uses',
 'practice_sessions','beta_administrators','beta_access','web_oauth_transactions'];
async function startHostedAccountService({pool,apiOrigin,port=3000,epicConfig,oauthKey,serviceToken,
 walletKey,readLinkedInventory,prepareLinkedTeam,prepareLinkedSpend,checkLinks,rankedConfig}){
 // Pin genuine signature verification before opening a listener. Consumers may
 // supply fetch for tests, but cannot inject a fabricated identity verifier.
 const verifier=createEpicEvidenceVerifier(epicConfig);
 const database=postgresDatabase(pool);
 const info=(await database.query(`SELECT current_database() AS database,
  (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS superuser`)).rows[0];
 if(info?.database!=='evoverses_beta_accounts'||info.superuser!==false)throw new Error('Dedicated restricted beta account database required');
 const present=await database.query('SELECT unnest($1::text[]) AS name,to_regclass(unnest($1::text[])) AS present', [tables.map(t=>'player.'+t)]);
 if(present.rows.length!==tables.length||present.rows.some(t=>!t.present))throw new Error('Explicit account migrations required before startup');
 const unavailable=async()=>{throw new EconomyError('PAYMENTS_DISABLED');};
 // Beta uses the existing virtual-currency test scope. This does not enable
 // live or sandbox payment processing; there are no payment HTTP routes.
 const economy=new PlayerEconomy({database,mode:'test',paymentScope:'acct_evoverses_public_beta',prices:{},
  verifyCardPayment:unavailable,resolveEvoTemplate:unavailable});
 const store=new GameStore({economy,mode:'local-test'});
 const accounts=new PlayerAccounts({database,mode:'test',...verifier,sessionTtlSeconds:604800,grantNewPlayer:(tx,id)=>store.grantStarter(tx,id)});
 const oauth=new WebOAuthStore({database,key:oauthKey});
 // Validate service credential before any Store seeding or listener startup.
 if(typeof serviceToken!=='string'||!/^[a-f0-9]{64}$/.test(serviceToken))throw new Error('Separate website service credential required');
 let links;
 if(walletKey!==undefined){
  if(!Buffer.isBuffer(walletKey)||walletKey.length!==32)throw Error('Injected wallet encryption key required');
  const wallet=require('./hosted-wallet-links.cjs');
  await wallet.initializeWalletKey(database,walletKey);
  links=wallet.createWalletLinks({accounts,key:walletKey,ErrorType:EconomyError});
  readLinkedInventory=require('./hosted-linked-inventory.cjs').createGameLinkedInventoryReader({links});
  const authorization=require('./hosted-team-authorization.cjs');
  prepareLinkedTeam=authorization.createGameTeamVerifier({links,ErrorType:EconomyError});
  prepareLinkedSpend=authorization.createGameSpendVerifier({links,ErrorType:EconomyError});
  checkLinks=async(tx,playerId,checkpoint)=>{
   const ids=(await tx.query('SELECT id FROM player.wallet_links WHERE player_id=$1 ORDER BY id',[playerId])).rows.map(r=>r.id).sort();
   if(!Array.isArray(checkpoint)||JSON.stringify(ids)!==JSON.stringify(checkpoint))throw new EconomyError('TEAM_UNAVAILABLE');
  };
 }
 const loadouts=new PlayerLoadouts({economy,readLinkedInventory,progression});
 const combat=new EvoCombatState({accounts,mode:'local-test',readLinkedInventory,progression,definitions});
 const practice=new GameTeamReservations({accounts,mode:'test',recovery:combat,prepareLinkedTeam});
 const casual=new CasualPractice({accounts,reservations:practice,combat,economy,readLinkedInventory,
  prepareLinkedSpend,checkLinks,mode:'local-test'});
 const betaAdmin=new BetaAdministration({accounts,economy,mode:'local-test'});
 const gameAccess=new GameAccess({accounts});
 let ranked,timer;
 if(rankedConfig){
  const required=['ranked_friend_challenges','ranked_friend_requests','ranked_item_escrow','ranked_checkpoints','ranked_admissions','ranked_xp_pending','ranked_xp_awards','ranked_linked_evo_experience'];
  const found=await database.query('SELECT unnest($1::text[]) AS name,to_regclass(unnest($1::text[])) AS present',[required.map(t=>'player.'+t)]);
  if(found.rows.some(t=>!t.present))throw Error('Explicit Ranked migration required before startup');
  const allocator=require('./ranked-edgegap.cjs').createEdgegapAllocator(rankedConfig);
  ranked=new(require('./ranked-friends.cjs').RankedFriends)({accounts,combat,reservations:practice,
   buildApprovedTeam:require('./approved-battle-team.cjs').createApprovedTeamBuilder({economy,readLinkedInventory}),allocator,
   key:rankedConfig.key,apiOrigin,protocolVersion:'ranked-friend-v2',allowNew:rankedConfig.allowNew!==false});
 }
 // Authored catalogue installation is idempotent and conflict-checked. It does
 // not erase bought quantities, credit balances, grant rewards or replace revisions.
 await store.installCatalogue();
 const api=await startHostedBetaApi({apiOrigin,port,economy,accounts,store,loadouts,practice,casual,combat,betaAdmin,gameAccess,
  ranked,readLinkedInventory,projectCombatInventory:(token,body)=>combat.project(token,body),webOAuth:{store:oauth,serviceToken},
  ...(links?{webWallet:{links,serviceToken}}:{})});
 let sweeping;
 if(ranked){const sweep=()=>{if(!sweeping)sweeping=ranked.sweep().catch(()=>{console.error('RANKED_RECOVERY_PENDING');}).finally(()=>{sweeping=null;});};timer=setInterval(sweep,15000);timer.unref();sweep();}
 return Object.freeze({url:api.url,close:async()=>{if(timer)clearInterval(timer);await api.close();if(sweeping)await sweeping;}});
}
module.exports={startHostedAccountService};
