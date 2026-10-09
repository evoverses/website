"use strict";
// Website-owned local service; reuses existing game backend modules without changing game code.
// Opens the reviewed database only through the ownership-checked PowerShell launcher.
const fs = require("node:fs"),
  path = require("node:path");
const { websiteAccountContext } = require("./player-account-context.cjs");
const {
  localStoreSettings,
  stripeReceiptVerifier,
  startStoreBridge,
} = require("./local-store-payments.cjs");
const {
  walletLinkSettings,
  migrateWalletLinks,
  initializeWalletKey,
  createWalletLinks,
} = require("./wallet-link/core.cjs");
const { startWalletLinkBridge } = require("./wallet-link/bridge.cjs");
const [accountRepo, runRoot] = process.argv.slice(2),
  mode = "Account";
if (
  !accountRepo ||
  !runRoot ||
  !path.isAbsolute(accountRepo) ||
  !path.isAbsolute(runRoot) ||
  path.dirname(path.resolve(runRoot)) !==
    path.join(path.resolve(accountRepo), "Saved") ||
  !/^EpicAccountLocal-[a-f0-9]{32}$/.test(path.basename(runRoot))
)
  throw new Error("Explicit reviewed isolated local run required");
const backend = path.join(accountRepo, "Prototypes/player_economy");
const { localPGlite } = require(path.join(backend, "scripts/local-pglite.cjs"));
const { embeddedDatabase } = require(path.join(backend, "src/database.cjs"));
const { PlayerAccounts } = require(path.join(backend, "src/accounts.cjs"));
const { PlayerEconomy, EconomyError } = require(
  path.join(backend, "src/economy.cjs"),
);
const { startLocalAccountApi } = require(path.join(backend, "src/http.cjs"));
const { createEpicEvidenceVerifier } = require(
  path.join(backend, "src/epic.cjs"),
);
(async () => {
  let db,
    api,
    storeApi,
    walletApi,
    timer,
    deadline,
    cleanupTimer,
    cleanupPending,
    closing = false,
    initialized = false,
    loginCount = 0,
    logoutCount = 0,
    startupStage = "account-context";
  const statusPath = path.join(runRoot, "status.json");
  async function status() {
    const counts =
      await db.query(`SELECT (SELECT count(*)::int FROM player.players) players,
    (SELECT count(*)::int FROM player.identities) identities,
    (SELECT count(*)::int FROM player.sessions WHERE revoked_at IS NULL AND expires_at>clock_timestamp()) active_sessions,
    (SELECT count(*)::int FROM player.account_audit WHERE action='session_issued') issued_sessions,
    (SELECT count(*)::int FROM player.account_audit WHERE action='session_issued' AND details->>'epicDisplayNameApplied'='true') epic_named_logins,
    (SELECT count(*)::int FROM player.account_audit WHERE action='session_logged_out') logged_out_sessions,
    (SELECT coalesce(sum(evoros),0)::int FROM player.balances) evoros,
    (SELECT count(*)::int FROM player.ordinary_evos) evos`);
    fs.writeFileSync(
      statusPath,
      JSON.stringify({ mode, loginCount, logoutCount, ...counts.rows[0] }) +
        "\n",
    );
  }
  async function close() {
    if (closing) return;
    closing = true;
    clearInterval(timer);
    clearTimeout(deadline);
    clearInterval(cleanupTimer);
    if (cleanupPending) await cleanupPending;
    if (walletApi) await walletApi.close();
    if (storeApi) await storeApi.close();
    if (api) await api.close();
    if (db) {
      try {
        if (initialized) {
          await db.query(
            "UPDATE player.sessions SET revoked_at=clock_timestamp() WHERE revoked_at IS NULL",
          );
          await status();
        }
      } finally {
        await db.close();
      }
    }
    fs.writeFileSync(
      path.join(runRoot, "stopped.json"),
      JSON.stringify({ stopped: true, database: "closed" }) + "\n",
    );
  }
  try {
    const expected = JSON.parse(
      fs.readFileSync(path.join(runRoot, "expected-context.json"), "utf8"),
    );
    process.loadEnvFile(path.join(__dirname, "../.env.local"));
    const reviewed = JSON.parse(
      fs.readFileSync(path.join(runRoot, "reviewed-context.json"), "utf8"),
    );
    const verified = JSON.parse(
      fs.readFileSync(path.join(runRoot, "verified-context.json"), "utf8"),
    );
    const context = websiteAccountContext(
      process.env,
      expected,
      reviewed,
      verified,
    );
    const { websiteClientId, ...restrictions } = context;
    const verifier = createEpicEvidenceVerifier(restrictions);
    startupStage = "database-open";
    db = new (localPGlite())(path.join(runRoot, "Database"));
    await db.query("SELECT count(*) FROM player.sessions");
    initialized = true;
    const database = embeddedDatabase(db);
    const catalogue = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "../../../docs/evoros-stripe-test-products.json"),
        "utf8",
      ),
    );
    startupStage = "payment-configuration";
    const store = localStoreSettings(process.env, catalogue);
    const sdk = store
      ? new (require("stripe"))(store.secretKey, {
          maxNetworkRetries: 1,
          timeout: 5000,
        })
      : null;
    const economy = new PlayerEconomy({
      database,
      mode: "test",
      paymentScope: store?.paymentScope || "acct_local_epic_no_payments",
      prices: store?.prices || {},
      verifyCardPayment: store
        ? stripeReceiptVerifier(sdk, store.paymentScope)
        : async () => {
            throw new EconomyError("PAYMENTS_DISABLED");
          },
      resolveEvoTemplate: async () => {
        throw new EconomyError("CATALOGUE_DISABLED");
      },
    });
    if (store)
      storeApi = await startStoreBridge({
        economy,
        token: store.token,
        onCredit: status,
      });
    startupStage = "game-store";
    const gameStore = await require("./game-store-local.cjs").prepareWebsiteGameStore({
      enabled: process.env.EVOVERSES_LOCAL_GAME_STORE === "1",
      accountRepo, runRoot, db, economy,
    });
    const accounts = new PlayerAccounts({
      database,
      mode: "test",
      ...verifier,
      grantNewPlayer: gameStore ? (tx, id) => gameStore.grantStarter(tx, id) : undefined,
    });
    let links;
    startupStage = "wallet-link";
    const walletSettings = walletLinkSettings(process.env);
    if (walletSettings) {
      await migrateWalletLinks(database);
      await initializeWalletKey(database, walletSettings.key);
      links = createWalletLinks({
        accounts,
        key: walletSettings.key,
        ErrorType: EconomyError,
      });
      walletApi = await startWalletLinkBridge({
        links,
        token: walletSettings.token,
      });
    }
    const readLinkedInventory = links ? require("./game-linked-inventory.cjs").createGameLinkedInventoryReader({links}) : undefined;
    startupStage = "loadouts";
    const loadouts = gameStore ? await require(path.join(backend,"src/player-loadouts.cjs")).prepareLocalLoadouts({
      db,economy,readLinkedInventory,
      progression: JSON.parse(fs.readFileSync(path.join(accountRepo,"Content/Store/Data/evo-progression.json"),"utf8")),
      beforeFirstMigration: async()=>{
        const backup=await db.dumpDataDir("gzip"),bytes=Buffer.from(await backup.arrayBuffer());
        if(!bytes.length)throw Error("Empty local backup");
        const backupPath=path.join(runRoot,"LoadoutsBeforeSchema006-"+Date.now()+".tar.gz");
        fs.writeFileSync(backupPath,bytes,{flag:"wx"});
        if(fs.statSync(backupPath).size!==bytes.length)throw Error("Incomplete local backup");
      }
    }) : undefined;
    let practice, combat, casual;
    if(gameStore){
      const present=(await db.query("SELECT to_regclass('player.game_reservations') AS leases,to_regclass('player.game_evo_reservations') AS members")).rows[0];
      if(Boolean(present.leases)!==Boolean(present.members))throw Error('Inconsistent practice schema');
      if(!present.leases){
        const backup=await db.dumpDataDir('gzip'),bytes=Buffer.from(await backup.arrayBuffer());
        if(!bytes.length)throw Error('Empty local backup');
        const target=path.join(runRoot,'PracticeBeforeSchema003-'+Date.now()+'.tar.gz');fs.writeFileSync(target,bytes,{flag:'wx'});
        if(fs.statSync(target).size!==bytes.length)throw Error('Incomplete local backup');
        await db.exec(fs.readFileSync(path.join(backend,'schema/003_game_team_reservations.sql'),'utf8'));
      }
      startupStage = "combat-state";
      combat=await require(path.join(backend,'src/local-item-use.cjs')).prepareLocalItemUse({enabled:true,db,accounts,readLinkedInventory,
        beforeFirstMigration:async(name)=>{
          const backup=await db.dumpDataDir('gzip'),bytes=Buffer.from(await backup.arrayBuffer());if(!bytes.length)throw Error('Empty local backup');
          const target=path.join(runRoot,'ItemsBefore-'+name.replace('.sql','')+'-'+Date.now()+'.tar.gz');fs.writeFileSync(target,bytes,{flag:'wx'});
          if(fs.statSync(target).size!==bytes.length)throw Error('Incomplete local backup');
        }});
      practice=new (require(path.join(backend,'src/team-reservations.cjs')).GameTeamReservations)({accounts,mode:'test',recovery:combat,prepareLinkedTeam:links?require("./game-team-authorization.cjs").createGameTeamVerifier({links,ErrorType:EconomyError}):undefined});
      startupStage = "casual-items";
      casual=await require(path.join(backend,'src/local-casual-practice.cjs')).prepareLocalCasualPractice({enabled:true,db,accounts,reservations:practice,combat,economy,
        prepareLinkedSpend:links?require("./game-team-authorization.cjs").createGameSpendVerifier({links,ErrorType:EconomyError}):undefined,
        checkLinks:async(tx,playerId,checkpoint)=>{
          const ids=(await tx.query('SELECT id FROM player.wallet_links WHERE player_id=$1 ORDER BY id',[playerId])).rows.map(r=>r.id).sort();
          if(!Array.isArray(checkpoint)||JSON.stringify(ids)!==JSON.stringify(checkpoint))throw new EconomyError('TEAM_UNAVAILABLE');
        },beforeFirstMigration:async(name)=>{
          const backup=await db.dumpDataDir('gzip'),bytes=Buffer.from(await backup.arrayBuffer());if(!bytes.length)throw Error('Empty local backup');
          const target=path.join(runRoot,'CasualBefore-'+name.replace('.sql','')+'-'+Date.now()+'.tar.gz');fs.writeFileSync(target,bytes,{flag:'wx'});
          if(fs.statSync(target).size!==bytes.length)throw Error('Incomplete local backup');
        }});
    }
    startupStage = "operational-cleanup";
    if(casual){
      await casual.prune();
      cleanupTimer=setInterval(()=>{
        if(closing||cleanupPending)return;
        cleanupPending=casual.prune().catch(()=>{}).finally(()=>{cleanupPending=undefined;});
      },60*60*1000);
    }
    startupStage = "account-api";
    const accountApiFactory = gameStore
      ? require(path.join(backend, "src/http.cjs")).startLocalStoreApi
      : startLocalAccountApi;
    api = await accountApiFactory({
      economy,
      ...(gameStore ? { store: gameStore, loadouts, practice, casual, combat, projectCombatInventory:(token,body)=>combat.project(token,body) } : {}),
      readLinkedInventory,
      accounts: {
        login: async (input) => {
          const result = await accounts.login(input);
          loginCount++;
          await status();
          return result;
        },
        logout: async (token) => {
          await accounts.logout(token);
          logoutCount++;
          await status();
        },
        logoutEverywhere: async (token) => {
          const result = await accounts.logoutEverywhere(token);
          logoutCount++;
          await status();
          return result;
        },
      },
    });
    await status();
    fs.writeFileSync(
      path.join(runRoot, "ready.json"),
      JSON.stringify({
        mode,
        apiUrl: api.url,
        gameStoreEnabled: !!gameStore,
        websiteClientId,
        storeApiUrl: storeApi?.url,
        storeAccount: store?.paymentScope,
        walletLinkApiUrl: walletApi?.url,
      }) + "\n",
    );
    timer = setInterval(() => {
      if (fs.existsSync(path.join(runRoot, "stop.txt")))
        close().catch(() => (process.exitCode = 1));
    }, 250);
    deadline = setTimeout(
      () => close().catch(() => (process.exitCode = 1)),
      8 * 60 * 60 * 1000,
    );
    process.once("SIGINT", () => close().catch(() => (process.exitCode = 1)));
  } catch (error) {
    const safeCode = typeof error?.code === "string" && /^[A-Z0-9_]{3,64}$/.test(error.code) ? error.code : "UNSPECIFIED";
    try {
      await close();
    } catch {}
    console.error(
      `Local Epic service failed at ${startupStage} (${safeCode}). Credentials and provider responses omitted.`,
    );
    process.exitCode = 1;
  }
})();
