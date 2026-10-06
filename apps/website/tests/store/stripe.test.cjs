const test = require("node:test"),
  assert = require("node:assert/strict"),
  path = require("node:path"),
  Stripe = require("stripe");
const { stripeStoreConfig } = require(
  path.join(process.env.EVOROS_TEST_LIB, "lib/store/stripe/config.js"),
);
const { createCardCheckout, fulfillCardPayment } = require(
  path.join(process.env.EVOROS_TEST_LIB, "lib/store/stripe/core.js"),
);
const { evorosBundles } = require(
  path.join(process.env.EVOROS_TEST_LIB, "data/evoros-bundles.js"),
);
function fixture() {
  const prices = Object.fromEntries(
    evorosBundles.map((b, i) => [
      b.id,
      { priceId: "price_fixture" + i, currency: "usd", unitAmount: b.amount },
    ]),
  );
  const env = {
    EVOROS_STRIPE_ENABLED: "true",
    EVOROS_STRIPE_MODE: "test",
    STRIPE_SECRET_KEY: "sk_test_fixture",
    STRIPE_WEBHOOK_SECRET: "whsec_fixture",
    EVOROS_STORE_ORIGIN: "http://localhost:3100",
    EVOROS_STRIPE_PRICES: JSON.stringify(prices),
  };
  const config = stripeStoreConfig(env),
    price = prices.bundle_pouch;
  const order = {
    id: "order1",
    playerId: "player1",
    bundleId: "bundle_pouch",
    evoros: 250,
    ...price,
    stripeSessionId: null,
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    status: "awaiting_payment",
  };
  const session = {
    id: "cs_test_fixture",
    url: "https://checkout.stripe.com/c/pay/cs_test_fixture",
    status: "open",
    payment_status: "unpaid",
    livemode: false,
    mode: "payment",
    client_reference_id: order.id,
    currency: price.currency,
    amount_subtotal: price.unitAmount,
    amount_total: price.unitAmount,
    metadata: {
      flow: "evoros-store-v1",
      orderId: order.id,
      playerId: order.playerId,
      bundleId: order.bundleId,
      evoros: "250",
    },
  };
  const records = [],
    credits = new Map();
  const gateway = {
    retrievePrice: async (id) => ({
      id,
      active: true,
      type: "one_time",
      livemode: false,
      currency: price.currency,
      unit_amount: price.unitAmount,
    }),
    createSession: async (params, options) => {
      records.push({ params, options });
      return session;
    },
    retrieveSession: async (id) => {
      assert.equal(id, session.id);
      return session;
    },
    listLineItems: async () => ({
      data: [{ quantity: 1, price: { id: order.priceId } }],
      has_more: false,
    }),
  };
  const players = {
    authenticate: async () => ({ playerId: "player1" }),
    reserveOrder: async (input) => {
      assert.equal(input.playerId, order.playerId);
      assert.equal(input.evoros, order.evoros);
      return order;
    },
    attachStripeSession: async (id, sessionId) => {
      assert.equal(id, order.id);
      assert.ok(!order.stripeSessionId || order.stripeSessionId === sessionId);
      order.stripeSessionId = sessionId;
    },
    findOrder: async (id) => (id === order.id ? order : null),
    creditOnce: async (id, sessionId) => {
      assert.equal(id, order.id);
      assert.equal(sessionId, order.stripeSessionId);
      if (credits.has(id)) return "already_credited";
      credits.set(id, { playerId: order.playerId, evoros: order.evoros });
      order.status = "credited";
      return "credited";
    },
  };
  return { config, env, gateway, players, order, session, records, credits };
}
const input = {
  playerId: "player1",
  bundleId: "bundle_pouch",
  requestId: "d0e105fd-60e3-4aa1-b315-e38a4cb9347a",
};
const paid = (f) => {
  f.session.status = "complete";
  f.session.payment_status = "paid";
};
test("Stripe is off by default; incomplete prices, wrong mode and unsafe return URLs fail closed", () => {
  assert.equal(stripeStoreConfig({}), null);
  const f = fixture();
  for (const override of [
    { STRIPE_SECRET_KEY: "sk_live_fixture" },
    { STRIPE_SECRET_KEY: "rk_live_fixture" },
    { STRIPE_SECRET_KEY: "pk_test_fixture" },
    { STRIPE_SECRET_KEY: "rk_test_" },
    { EVOROS_STRIPE_MODE: "guess" },
    { EVOROS_STRIPE_PRICES: "{}" },
    {
      EVOROS_STRIPE_PRICES: JSON.stringify({
        ...f.config.prices,
        bundle_pouch: { ...f.config.prices.bundle_pouch, unitAmount: 1 },
      }),
    },
    {
      EVOROS_STRIPE_PRICES: JSON.stringify({
        ...f.config.prices,
        bundle_pouch: { ...f.config.prices.bundle_pouch, currency: "eur" },
      }),
    },

    { EVOROS_STORE_ORIGIN: "http://example.com" },
    { EVOROS_STORE_ORIGIN: "https://example.com/path" },
    { EVOROS_STORE_ORIGIN: "https://user:password@example.com" },
    { EVOROS_STORE_ORIGIN: "https://example.com/?next=bad" },
  ])
    assert.throws(() => stripeStoreConfig({ ...f.env, ...override }));
});
test("restricted keys are accepted only for their matching environment", () => {
  const f = fixture();
  assert.equal(
    stripeStoreConfig({ ...f.env, STRIPE_SECRET_KEY: "rk_test_fixture" }).live,
    false,
  );
  const live = {
    ...f.env,
    EVOROS_STRIPE_MODE: "live",
    STRIPE_SECRET_KEY: "rk_live_fixture",
    EVOROS_STORE_ORIGIN: "https://evoverses.com",
  };
  assert.equal(stripeStoreConfig(live).live, true);
  assert.throws(() =>
    stripeStoreConfig({ ...live, STRIPE_SECRET_KEY: "rk_test_fixture" }),
  );
});
test("checkout uses a verified player and fixed server price/quantity, without granting Evoros", async () => {
  const f = fixture();
  const result = await createCardCheckout(
    input,
    f.config,
    f.gateway,
    f.players,
  );
  assert.match(result.url, /^https:\/\/checkout\.stripe\.com\//);
  assert.equal(f.records.length, 1);
  const { params, options } = f.records[0];
  assert.deepEqual(params.line_items, [
    { price: "price_fixture0", quantity: 1 },
  ]);
  assert.equal(params.payment_method_types, undefined);
  assert.equal(params.allowed_payment_method_types, undefined);
  assert.equal(params.client_reference_id, f.order.id);
  assert.match(params.integration_identifier, /^evoros-store-[a-z]{8}$/);
  assert.equal(params.metadata.playerId, "player1");
  assert.equal(options.idempotencyKey, "evoros-order-order1");
  assert.equal(params.allow_promotion_codes, false);
  assert.equal(params.expires_at, f.order.expiresAt);
  assert.equal(f.credits.size, 0);
});
test("a checkout retry reuses its attached session, and never creates a second charge for that order", async () => {
  const f = fixture();
  const first = await createCardCheckout(input, f.config, f.gateway, f.players);
  const again = await createCardCheckout(input, f.config, f.gateway, f.players);
  assert.deepEqual(again, first);
  assert.equal(f.records.length, 1);
});
test("invalid bundle/request, changed Stripe price, foreign player/order and expired creation cannot open checkout", async () => {
  for (const mutation of ["bundle", "request", "price", "player", "expiry"]) {
    const f = fixture(),
      args = { ...input };
    if (mutation === "bundle") args.bundleId = "attacker_bundle";
    if (mutation === "request") args.requestId = "arbitrary";
    if (mutation === "price")
      f.gateway.retrievePrice = async () => ({
        active: true,
        type: "one_time",
        livemode: false,
        currency: "usd",
        unit_amount: 1,
      });
    if (mutation === "player") f.order.playerId = "another_player";
    if (mutation === "expiry") f.order.expiresAt = 1;
    await assert.rejects(
      createCardCheckout(args, f.config, f.gateway, f.players),
    );
    assert.equal(f.records.length, 0);
    assert.equal(f.credits.size, 0);
  }
});
test("checkout never returns an attacker-controlled redirect or a closed session", async () => {
  for (const override of [
    { url: "https://attacker.example/pay" },
    { status: "expired" },
  ]) {
    const f = fixture();
    Object.assign(f.session, override);
    await assert.rejects(
      createCardCheckout(input, f.config, f.gateway, f.players),
    );
    assert.equal(f.credits.size, 0);
  }
});
test("unpaid completion stays pending and a forged return URL cannot grant anything", async () => {
  const f = fixture();
  assert.equal(
    await fulfillCardPayment(f.session.id, f.config, f.gateway, f.players),
    "pending",
  );
  assert.equal(f.credits.size, 0);
});
test("paid webhook retries credit the reserved account once, including concurrent deliveries and session-attachment recovery", async () => {
  const f = fixture();
  paid(f);
  const results = await Promise.all(
    Array.from({ length: 8 }, () =>
      fulfillCardPayment(f.session.id, f.config, f.gateway, f.players),
    ),
  );
  assert.equal(results.filter((r) => r === "credited").length, 1);
  assert.equal(f.credits.size, 1);
  assert.deepEqual(f.credits.get("order1"), {
    playerId: "player1",
    evoros: 250,
  });
});
test("wrong price, quantity, amount, currency, mode, session or recipient/units never grant Evoros", async () => {
  for (const mutation of [
    "price",
    "quantity",
    "total",
    "currency",
    "live",
    "mode",
    "session",
    "player",
    "evoros",
    "missing_order",
  ]) {
    const f = fixture();
    paid(f);
    if (mutation === "price")
      f.gateway.listLineItems = async () => ({
        data: [{ quantity: 1, price: { id: "price_other" } }],
        has_more: false,
      });
    if (mutation === "quantity")
      f.gateway.listLineItems = async () => ({
        data: [{ quantity: 2, price: { id: f.order.priceId } }],
        has_more: false,
      });
    if (mutation === "total") f.session.amount_total = 1;
    if (mutation === "currency") f.session.currency = "eur";
    if (mutation === "live") f.session.livemode = true;
    if (mutation === "mode") f.session.mode = "subscription";
    if (mutation === "session") f.order.stripeSessionId = "cs_test_other";
    if (mutation === "player") f.session.metadata.playerId = "someone_else";
    if (mutation === "evoros") f.session.metadata.evoros = "9999999";
    if (mutation === "missing_order") f.players.findOrder = async () => null;
    await assert.rejects(
      fulfillCardPayment(f.session.id, f.config, f.gateway, f.players),
      undefined,
      mutation,
    );
    assert.equal(f.credits.size, 0, mutation);
  }
});
test("a previously reserved paid order retains its approved price when the current catalogue changes", async () => {
  const f = fixture();
  paid(f);
  f.config.prices.bundle_pouch = {
    priceId: "price_new",
    currency: "usd",
    unitAmount: 999,
  };
  assert.equal(
    await fulfillCardPayment(f.session.id, f.config, f.gateway, f.players),
    "credited",
  );
  assert.equal(f.credits.get("order1").evoros, 250);
});
test("the official Stripe SDK verifies raw-body signatures and rejects changed or expired deliveries", () => {
  const stripe = new Stripe("sk_test_fixture"),
    secret = "whsec_fixture";
  const payload = JSON.stringify({
    id: "evt_fixture",
    object: "event",
    type: "checkout.session.completed",
    data: { object: { id: "cs_test_fixture" } },
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
  });
  assert.equal(
    stripe.webhooks.constructEvent(payload, signature, secret).id,
    "evt_fixture",
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(payload + " ", signature, secret),
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(payload, signature, "whsec_wrong"),
  );
  const expired = stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
    timestamp: Math.floor(Date.now() / 1000) - 1000,
  });
  assert.throws(() => stripe.webhooks.constructEvent(payload, expired, secret));
});

const { createCheckoutHandler } = require(
  path.join(
    process.env.EVOROS_TEST_LIB,
    "lib/store/stripe/checkout-handler.js",
  ),
);
const checkoutBody = { bundleId: input.bundleId, requestId: input.requestId };
const checkoutRequest = (body = checkoutBody) =>
  new Request("https://example.com/api/store/stripe/checkout", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3100",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
test("signed-out requests never open checkout, even with a wallet or a supplied recipient", async () => {
  const f = fixture();
  f.players.authenticate = async () => null;
  const handle = createCheckoutHandler(() => f);
  const response = await handle(
    checkoutRequest({
      ...input,
      playerId: "attacker",
      walletAddress: "0x1111111111111111111111111111111111111111",
    }),
  );
  assert.equal(response.status, 401);
  assert.equal(f.records.length, 0);
  assert.equal(f.credits.size, 0);
});
test("the authenticated game account owns checkout; client account and price overrides are rejected", async () => {
  const f = fixture();
  f.players.authenticate = async () => ({ playerId: "player1" });
  const handle = createCheckoutHandler(() => f);
  for (const extra of [
    { playerId: "attacker" },
    { unitAmount: 1 },
    { walletAddress: "0x1111111111111111111111111111111111111111" },
  ]) {
    const response = await handle(
      checkoutRequest({ ...checkoutBody, ...extra }),
    );
    assert.equal(response.status, 400);
  }
  assert.equal(f.records.length, 0);
  assert.equal((await handle(checkoutRequest())).status, 200);
  assert.equal(f.records[0].params.metadata.playerId, "player1");
});

test("webhook handler verifies raw signatures, rejects live/oversized payloads and acknowledges failures without credit", async () => {
  const { handleStripeWebhook } = require(
    path.join(
      process.env.EVOROS_TEST_LIB,
      "lib/store/stripe/webhook-handler.js",
    ),
  );
  const f = fixture(),
    sdk = new Stripe("sk_test_fixture");
  const service = {
    config: f.config,
    gateway: f.gateway,
    players: f.players,
    sdk,
  };
  const request = (payload, signature) =>
    new Request("http://localhost:3100/api/store/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": signature },
      body: payload,
    });
  const event = {
    id: "evt_fixture",
    object: "event",
    livemode: false,
    type: "checkout.session.async_payment_failed",
    data: { object: f.session },
  };
  const raw = JSON.stringify(event, null, 2),
    sig = sdk.webhooks.generateTestHeaderString({
      payload: raw,
      secret: f.config.webhookSecret,
    });
  assert.equal(
    (await handleStripeWebhook(request(raw, sig), service)).status,
    200,
  );
  assert.equal(
    (await handleStripeWebhook(request(raw + " ", sig), service)).status,
    400,
  );
  event.livemode = true;
  const live = JSON.stringify(event);
  assert.equal(
    (
      await handleStripeWebhook(
        request(
          live,
          sdk.webhooks.generateTestHeaderString({
            payload: live,
            secret: f.config.webhookSecret,
          }),
        ),
        service,
      )
    ).status,
    400,
  );
  assert.equal(
    (await handleStripeWebhook(request("x".repeat(1_048_577), sig), service))
      .status,
    413,
  );
  assert.equal(f.credits.size, 0);
});
