"use strict";
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  { randomUUID } = require("node:crypto");
const {
  localStoreSettings,
  stripeReceiptVerifier,
  startStoreBridge,
} = require("../../scripts/local-store-payments.cjs");
const backend =
  process.env.EVOVERSES_ACCOUNT_TEST_DIR ||
  path.resolve(
    __dirname,
    "../../../../../evoverses-beta-account-bridge/Prototypes/player_economy",
  );
const { setup, localPGlite } = require(
  path.join(backend, "scripts/fixtures.cjs"),
);
const { embeddedDatabase } = require(path.join(backend, "src/database.cjs"));
const { PlayerEconomy } = require(path.join(backend, "src/economy.cjs"));
const { createCardCheckout, fulfillCardPayment } = require(
  path.join(process.env.EVOROS_TEST_LIB, "lib/store/stripe/core.js"),
);
const catalogue = require("../../../../docs/evoros-stripe-test-products.json");
const serviceToken = "a".repeat(64),
  PGlite = localPGlite(),
  http = require("node:http");
let db, f, api, dir, session, verifiedOrder;
const gateway = {
  retrievePrice: async (id) => ({
    id,
    type: "one_time",
    active: true,
    livemode: false,
    currency: "usd",
    unit_amount: 250,
  }),
  createSession: async (params) => {
    session = {
      id: "cs_test_local_" + randomUUID().replaceAll("-", ""),
      livemode: false,
      mode: "payment",
      status: "open",
      payment_status: "unpaid",
      url: "https://checkout.stripe.com/c/pay/cs_test_fixture",
      metadata: params.metadata,
      client_reference_id: params.client_reference_id,
      currency: "usd",
      amount_subtotal: 250,
      amount_total: 250,
    };
    return session;
  },
  retrieveSession: async () => ({ ...session }),
  listLineItems: async () => ({
    has_more: false,
    data: [{ quantity: 1, price: { id: "price_local_fixture_250" } }],
  }),
};
const sdk = {
  checkout: {
    sessions: {
      retrieve: gateway.retrieveSession,
      listLineItems: gateway.listLineItems,
    },
  },
};
const config = {
  live: false,
  origin: "http://localhost:3100",
  prices: {
    bundle_pouch: {
      priceId: "price_local_fixture_250",
      currency: "usd",
      unitAmount: 250,
    },
  },
};
async function rpc(body, headers = {}) {
  const url = new URL(api.url);
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: "/internal/store",
        method: "POST",
        agent: false,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + serviceToken,
          ...headers,
        },
      },
      (res) => {
        let text = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (text += chunk));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: JSON.parse(text) }),
        );
      },
    );
    req.on("error", reject);
    req.end(JSON.stringify(body));
  });
}
const players = {
  reserveOrder: async (input) => {
    const r = await rpc({
      operation: "reserve",
      sessionToken: f.aliceToken,
      requestId: input.requestId,
      bundleId: input.bundleId,
    });
    assert.equal(r.status, 200);
    return r.body.value;
  },
  findOrder: async (orderId) =>
    (await rpc({ operation: "find", orderId })).body.value,
  attachStripeSession: async (orderId, sessionId) => {
    assert.equal(
      (await rpc({ operation: "attach", orderId, sessionId })).status,
      200,
    );
  },
  creditOnce: async (orderId, sessionId) => {
    const r = await rpc({ operation: "credit", orderId, sessionId });
    if (r.status !== 200) throw Error("Verification rejected");
    return r.body.value;
  },
};
before(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "evoverses-payment-test-"));
  db = new PGlite(dir);
  f = await setup(db);
  f.economy = new PlayerEconomy({
    database: embeddedDatabase(db),
    ...f.options,
    verifyCardPayment: stripeReceiptVerifier(sdk, f.options.paymentScope),
  });
  api = await startStoreBridge({ economy: f.economy, token: serviceToken });
});
after(async () => {
  await api?.close();
  await db?.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

test("payment settings require explicit localhost test account, secrets and approved six prices", () => {
  const env = {
    NODE_ENV: "development",
    EVOVERSES_LOCAL_STORE_PAYMENTS: "1",
    EVOROS_STRIPE_ENABLED: "true",
    EVOROS_STRIPE_MODE: "test",
    EVOROS_STORE_ORIGIN: "http://localhost:3100",
    STRIPE_SECRET_KEY: "rk_test_fixture",
    STRIPE_WEBHOOK_SECRET: "whsec_fixture",
    EVOVERSES_LOCAL_STORE_SERVICE_TOKEN: serviceToken,
    EVOROS_STRIPE_ACCOUNT: catalogue.accountId,
    EVOROS_STRIPE_PRICES: JSON.stringify(catalogue.prices),
  };
  assert.equal(localStoreSettings({}, catalogue), null);
  assert.equal(
    localStoreSettings(env, catalogue).paymentScope,
    catalogue.accountId,
  );
  for (const [key, value] of Object.entries({
    NODE_ENV: "production",
    EVOROS_STRIPE_MODE: "live",
    STRIPE_SECRET_KEY: "sk_live_fixture",
    EVOROS_STRIPE_ACCOUNT: "acct_other",
    EVOROS_STORE_ORIGIN: "https://evoverses.com",
    EVOROS_STRIPE_PRICES: "{}",
  }))
    assert.throws(() =>
      localStoreSettings({ ...env, [key]: value }, catalogue),
    );
});
test("private bridge rejects missing/bad service auth, browser origins, host injection and caller-selected player", async () => {
  const body = {
    operation: "reserve",
    sessionToken: f.aliceToken,
    requestId: randomUUID(),
    bundleId: "bundle_pouch",
  };
  for (const headers of [
    { Authorization: "" },
    { Authorization: "Bearer " + "b".repeat(64) },
    { Origin: "http://localhost:3100" },
    { Host: "attacker.example" },
  ])
    assert.equal((await rpc(body, headers)).status, 403);
  assert.equal((await rpc({ ...body, playerId: f.bob })).status, 503);
  assert.equal(
    (await rpc({ ...body, sessionToken: "c".repeat(64) })).status,
    401,
  );
  assert.equal(
    Number(
      (await db.query("SELECT count(*) AS n FROM player.payment_orders"))
        .rows[0].n,
    ),
    0,
  );
});
test("real Checkout core reserves for the authenticated session, and unpaid receipt cannot credit", async () => {
  const result = await createCardCheckout(
    { playerId: f.alice, requestId: randomUUID(), bundleId: "bundle_pouch" },
    config,
    gateway,
    players,
  );
  verifiedOrder = await players.findOrder(result.orderId);
  assert.equal(verifiedOrder.playerId, f.alice);
  assert.equal(verifiedOrder.stripeSessionId, session.id);
  assert.equal(
    await fulfillCardPayment(session.id, config, gateway, players),
    "pending",
  );
  assert.equal(
    (
      await rpc({
        operation: "credit",
        orderId: verifiedOrder.id,
        sessionId: session.id,
      })
    ).status,
    503,
  );
  assert.equal((await f.economy.getSnapshot(f.aliceToken)).evoros, 0);
});
test("signed unpaid, declined and expired notifications leave the real SQL balance, receipts and ledger untouched", async () => {
  const Stripe = require("stripe"),
    sdk = new Stripe("sk_test_fixture"),
    { handleStripeWebhook } = require(
      path.join(
        process.env.EVOROS_TEST_LIB,
        "lib/store/stripe/webhook-handler.js",
      ),
    );
  const webhookSecret = "whsec_fixture";
  const service = {
    config: { ...config, webhookSecret },
    gateway,
    players,
    sdk,
  };
  for (const [type, object, expected] of [
    ["checkout.session.completed", { ...session }, "pending"],
    [
      "payment_intent.payment_failed",
      { id: "pi_fixture_declined", status: "requires_payment_method" },
      "ignored",
    ],
    ["checkout.session.async_payment_failed", { ...session }, "ignored"],
    ["checkout.session.expired", { ...session, status: "expired" }, "ignored"],
  ]) {
    const raw = JSON.stringify({
      id: "evt_fixture_" + randomUUID(),
      object: "event",
      livemode: false,
      type,
      data: { object },
    });
    const signature = sdk.webhooks.generateTestHeaderString({
      payload: raw,
      secret: webhookSecret,
    });
    const response = await handleStripeWebhook(
      new Request("http://localhost:3100/api/store/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": signature },
        body: raw,
      }),
      service,
    );
    assert.equal(response.status, 200, type);
    assert.equal((await response.json()).status, expected, type);
    assert.equal((await f.economy.getSnapshot(f.aliceToken)).evoros, 0, type);
    assert.equal((await f.economy.getSnapshot(f.bobToken)).evoros, 0, type);
    const counts = await db.query(
      "SELECT (SELECT count(*)::int FROM player.evoros_ledger) AS ledger, (SELECT count(*)::int FROM player.payment_receipts) AS receipts",
    );
    assert.deepEqual(counts.rows[0], { ledger: 0, receipts: 0 }, type);
    assert.equal(
      (await players.findOrder(verifiedOrder.id)).status,
      "awaiting_payment",
      type,
    );
  }
});
test("altered recipient, amount and live-mode receipts cannot reach the ledger", async () => {
  session = { ...session, status: "complete", payment_status: "paid" };
  const original = structuredClone(session);
  for (const patch of [
    { metadata: { ...original.metadata, playerId: f.bob } },
    { amount_total: 249 },
    { livemode: true },
  ]) {
    session = { ...original, ...patch };
    assert.equal(
      (
        await rpc({
          operation: "credit",
          orderId: verifiedOrder.id,
          sessionId: session.id,
        })
      ).status,
      503,
    );
  }
  session = original;
  assert.equal((await f.economy.getSnapshot(f.aliceToken)).evoros, 0);
});
test("concurrent verified payment retries give one credit, one receipt and no other player balance", async () => {
  const results = await Promise.all(
    Array.from({ length: 4 }, () =>
      fulfillCardPayment(session.id, config, gateway, players),
    ),
  );
  assert.equal(results.filter((x) => x === "credited").length, 1);
  assert.equal(results.filter((x) => x === "already_credited").length, 3);
  assert.equal((await f.economy.getSnapshot(f.aliceToken)).evoros, 250);
  assert.equal((await f.economy.getSnapshot(f.bobToken)).evoros, 0);
  assert.equal(
    Number(
      (await db.query("SELECT count(*) AS n FROM player.evoros_ledger")).rows[0]
        .n,
    ),
    1,
  );
  assert.equal(
    Number(
      (await db.query("SELECT count(*) AS n FROM player.payment_receipts"))
        .rows[0].n,
    ),
    1,
  );
});
test("paid order and ledger persist after database/service restart and replay stays credited once", async () => {
  await api.close();
  api = null;
  await db.close();
  db = new PGlite(dir);
  f.economy = new PlayerEconomy({
    database: embeddedDatabase(db),
    ...f.options,
    verifyCardPayment: stripeReceiptVerifier(sdk, f.options.paymentScope),
  });
  api = await startStoreBridge({ economy: f.economy, token: serviceToken });
  assert.equal(
    await fulfillCardPayment(session.id, config, gateway, players),
    "already_credited",
  );
  assert.equal((await f.economy.getSnapshot(f.aliceToken)).evoros, 250);
});
