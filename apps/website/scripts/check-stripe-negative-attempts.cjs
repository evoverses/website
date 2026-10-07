"use strict";
// Read-only test-account evidence. Never prints identities, session IDs, card data or keys.
const fs = require("node:fs"),
  path = require("node:path"),
  Stripe = require("stripe");
(async () => {
  process.loadEnvFile(path.join(__dirname, "../.env.local"));
  if (
    process.env.EVOROS_STRIPE_MODE !== "test" ||
    !/^(rk|sk)_test_[A-Za-z0-9]+$/.test(process.env.STRIPE_SECRET_KEY || "")
  )
    throw Error("Test account required");
  const root = process.env.EVOVERSES_LOCAL_EPIC_RUN_ROOT;
  const ready = JSON.parse(
    fs.readFileSync(path.join(root, "ready.json"), "utf8"),
  );
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
  const attempts = [];
  for (const session of sessions.data) {
    if (
      session.livemode !== false ||
      session.metadata?.flow !== "evoros-store-v1" ||
      session.payment_status === "paid"
    )
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
        orderId: session.client_reference_id,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) continue;
    const { value: order } = await response.json();
    if (!order) continue;
    if (
      order.stripeSessionId !== session.id ||
      order.id !== session.metadata.orderId ||
      order.playerId !== session.metadata.playerId ||
      order.unitAmount !== session.amount_total
    )
      throw Error("Saved order mismatch");
    let intent,
      declineEvidenceUnavailable = false;
    if (typeof session.payment_intent === "string") {
      try {
        intent = await sdk.paymentIntents.retrieve(session.payment_intent);
      } catch {
        declineEvidenceUnavailable = true;
      }
    }
    const error = intent?.last_payment_error;
    const safeCode = (value) =>
      typeof value === "string" && /^[a-z_]{1,64}$/.test(value) ? value : null;
    attempts.push({
      stripeStatus: session.status,
      paymentStatus: session.payment_status,
      localOrderStatus: order.status,
      amountCents: session.amount_total,
      paymentIntentStatus: intent?.status ?? null,
      failureCode: safeCode(error?.code),
      declineCode: safeCode(error?.decline_code),
      declineEvidenceUnavailable,
    });
    if (order.status === "credited")
      throw Error("An unpaid session was credited");
  }
  const status = JSON.parse(
    fs.readFileSync(path.join(root, "status.json"), "utf8"),
  );
  const expectedArg = process.argv.find((value) =>
    value.startsWith("--expected-balance="),
  );
  const expected = expectedArg
    ? Number(expectedArg.slice("--expected-balance=".length))
    : undefined;
  if (expectedArg && (!Number.isSafeInteger(expected) || expected < 0))
    throw Error("INVALID_EXPECTED_BALANCE");
  const balanceUnchanged =
    expected === undefined ? undefined : status.evoros === expected;
  console.log(
    JSON.stringify({
      readOnly: true,
      unpaidSavedAttempts: attempts.length,
      attempts,
      localPlayers: status.players,
      localBalanceTotal: status.evoros,
      ...(expected !== undefined ? { balanceUnchanged } : {}),
    }),
  );
  if (balanceUnchanged === false) process.exitCode = 1;
})().catch(() => {
  console.error(
    "Read-only negative-payment check unavailable; provider and credential details withheld.",
  );
  process.exitCode = 1;
});
