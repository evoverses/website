"use strict";
// Read-only by default. Optional signed local replay targets already-credited verified test payments only.
// Prints aggregate states, never keys, sessions, identities or card/customer details.
const fs = require("node:fs"),
  path = require("node:path"),
  Stripe = require("stripe");
(async () => {
  process.loadEnvFile(path.join(__dirname, "../.env.local"));
  if (
    process.env.EVOROS_STRIPE_MODE !== "test" ||
    !/^(rk|sk)_test_[A-Za-z0-9]+$/.test(process.env.STRIPE_SECRET_KEY || "")
  )
    throw Error("Sandbox required");
  const root = process.env.EVOVERSES_LOCAL_EPIC_RUN_ROOT,
    ready = JSON.parse(fs.readFileSync(path.join(root, "ready.json"), "utf8"));
  if (
    fs.existsSync(path.join(root, "stopped.json")) ||
    ready.storeAccount !== process.env.EVOROS_STRIPE_ACCOUNT ||
    !/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(ready.storeApiUrl) ||
    !/^[a-f0-9]{64}$/.test(
      process.env.EVOVERSES_LOCAL_STORE_SERVICE_TOKEN || "",
    )
  )
    throw Error("Reviewed service required");
  const sdk = new Stripe(process.env.STRIPE_SECRET_KEY, {
    timeout: 10000,
    maxNetworkRetries: 1,
  });
  const sessions = await sdk.checkout.sessions.list({ limit: 20 });
  let paid = 0,
    credited = 0,
    pending = 0,
    creditedEvoros = 0,
    matches = true;
  const replayResults = [];
  const initial = JSON.parse(
    fs.readFileSync(path.join(root, "status.json"), "utf8"),
  ).evoros;
  for (const s of sessions.data) {
    if (s.livemode !== false || s.metadata?.flow !== "evoros-store-v1")
      continue;
    const response = await fetch(ready.storeApiUrl + "/internal/store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer " + process.env.EVOVERSES_LOCAL_STORE_SERVICE_TOKEN,
      },
      body: JSON.stringify({
        operation: "find",
        orderId: s.client_reference_id,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) continue; // May be an isolated fixture/older test, not this database.
    const { value: order } = await response.json();
    if (!order) continue;
    if (s.status === "complete" && s.payment_status === "paid") paid++;
    if (order.status === "credited") {
      credited++;
      creditedEvoros += order.evoros;
    } else pending++;
    if (
      process.argv.includes("--replay-credited") &&
      order.status === "credited" &&
      s.status === "complete" &&
      s.payment_status === "paid"
    ) {
      for (let i = 0; i < 2; i++) {
        const raw = JSON.stringify({
          id: "evt_local_duplicate_rehearsal",
          object: "event",
          livemode: false,
          type: "checkout.session.completed",
          data: { object: { id: s.id } },
        });
        const signature = sdk.webhooks.generateTestHeaderString({
          payload: raw,
          secret: process.env.STRIPE_WEBHOOK_SECRET,
        });
        const replay = await fetch(
          "http://localhost:3100/api/store/stripe/webhook",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "stripe-signature": signature,
            },
            body: raw,
            signal: AbortSignal.timeout(30000),
          },
        );
        const body = await replay.json();
        if (replay.status !== 200 || body.status !== "already_credited")
          throw Error("Replay did not preserve credit");
        replayResults.push(body.status);
      }
    }
    matches &&=
      order.id === s.metadata.orderId &&
      order.playerId === s.metadata.playerId &&
      order.bundleId === s.metadata.bundleId &&
      String(order.evoros) === s.metadata.evoros &&
      order.unitAmount === s.amount_total &&
      order.stripeSessionId === s.id;
  }
  const status = JSON.parse(
    fs.readFileSync(path.join(root, "status.json"), "utf8"),
  );
  console.log(
    JSON.stringify({
      checkedRecentSessions: true,
      paid,
      credited,
      pending,
      creditedEvoros,
      allSavedOrdersMatch: matches,
      localPlayers: status.players,
      localBalanceTotal: status.evoros,
      ...(process.argv.includes("--replay-credited")
        ? { replayResults, balanceUnchanged: initial === status.evoros }
        : {}),
    }),
  );
})().catch(() => {
  console.error(
    "Read-only sandbox check unavailable; provider/credential details omitted.",
  );
  process.exitCode = 1;
});
