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
    closing = false,
    initialized = false,
    loginCount = 0,
    logoutCount = 0;
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
    const accountApiFactory = gameStore
      ? require(path.join(backend, "src/http.cjs")).startLocalStoreApi
      : startLocalAccountApi;
    api = await accountApiFactory({
      economy,
      ...(gameStore ? { store: gameStore } : {}),
      readLinkedInventory: links
        ? require("./game-linked-inventory.cjs").createGameLinkedInventoryReader(
            { links },
          )
        : undefined,
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
      2 * 60 * 60 * 1000,
    );
    process.once("SIGINT", () => close().catch(() => (process.exitCode = 1)));
  } catch {
    try {
      await close();
    } catch {}
    console.error(
      "Local Epic service failed. Credentials and provider responses omitted.",
    );
    process.exitCode = 1;
  }
})();
