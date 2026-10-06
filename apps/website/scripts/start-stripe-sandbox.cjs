"use strict";
// Captures CLI output privately. Signing secret stays in ignored .env.local, never stdout/chat.
const fs = require("node:fs"),
  path = require("node:path"),
  { spawn } = require("node:child_process"),
  { randomBytes } = require("node:crypto"),
  Stripe = require("stripe");
const envFile = path.join(__dirname, "../.env.local"),
  cli = path.join(__dirname, "../node_modules/.stripe-cli/stripe.exe");
function setEnv(key, value) {
  let text = fs.readFileSync(envFile, "utf8");
  const line = key + "='" + value + "'";
  const regex = new RegExp("^" + key + "=.*$", "m");
  text = regex.test(text)
    ? text.replace(regex, () => line)
    : text.replace(/\s*$/, "") + "\n" + line + "\n";
  fs.writeFileSync(envFile, text);
}
(async () => {
  process.loadEnvFile(envFile);
  if (!/^(rk|sk)_test_[A-Za-z0-9]+$/.test(process.env.STRIPE_SECRET_KEY || ""))
    throw Error("MISSING_TEST_KEY");
  const catalogue = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../../../docs/evoros-stripe-test-products.json"),
      "utf8",
    ),
  );
  const sdk = new Stripe(process.env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 1,
    timeout: 10000,
  });
  for (const p of catalogue.products) {
    const value = await sdk.prices.retrieve(p.priceId);
    if (
      value.livemode !== false ||
      !value.active ||
      value.currency !== "usd" ||
      value.unit_amount !== p.evoros ||
      value.product !== p.productId
    )
      throw Error("SANDBOX_CATALOGUE_MISMATCH");
  }
  console.log(
    "Runtime test key verified against the existing six sandbox prices.",
  );
  const token = process.env.EVOVERSES_LOCAL_STORE_SERVICE_TOKEN;
  if (!/^[a-f0-9]{64}$/.test(token || ""))
    setEnv(
      "EVOVERSES_LOCAL_STORE_SERVICE_TOKEN",
      randomBytes(32).toString("hex"),
    );
  setEnv("EVOROS_STRIPE_ACCOUNT", catalogue.accountId);
  setEnv("EVOROS_STRIPE_PRICES", JSON.stringify(catalogue.prices));
  setEnv("EVOROS_STRIPE_MODE", "test");
  setEnv("EVOROS_STORE_ORIGIN", "http://localhost:3100");
  const child = spawn(
    cli,
    [
      "listen",
      "--events",
      "checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed",
      "--forward-to",
      "http://localhost:3100/api/store/stripe/webhook",
      "--log-level",
      "error",
    ],
    {
      env: { ...process.env, STRIPE_API_KEY: process.env.STRIPE_SECRET_KEY },
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let ready = false,
    tail = "";
  const handle = (part) => {
    tail = (tail + part.toString()).slice(-8192);
    const secret = /whsec_[A-Za-z0-9]+/.exec(tail)?.[0];
    if (secret && !ready) {
      setEnv("STRIPE_WEBHOOK_SECRET", secret);
      setEnv("EVOROS_STRIPE_ENABLED", "true");
      setEnv("EVOVERSES_LOCAL_STORE_PAYMENTS", "1");
      ready = true;
      console.log(
        "Sandbox webhook forwarding ready. Signing secret saved privately; restart only the local account service and website.",
      );
      tail = "";
    }
    const lines = part.toString().split(/\r?\n/);
    for (const line of lines) {
      const status = /\[(\d{3})\]/.exec(line)?.[1];
      if (status) console.log("Sandbox webhook HTTP status " + status);
    }
  };
  child.stdout.on("data", handle);
  child.stderr.on("data", handle);
  child.once("error", () => {
    console.error(
      "Sandbox listener could not start. Provider details omitted.",
    );
    process.exitCode = 1;
  });
  child.once("exit", (code) => {
    if (!ready || code) {
      console.error(
        "Sandbox listener stopped before readiness or with an error. Check CLI access; credentials omitted.",
      );
      process.exitCode = 1;
    }
  });
  process.once("SIGINT", () => child.kill());
  process.once("SIGTERM", () => child.kill());
})().catch((error) => {
  console.error(
    JSON.stringify({
      stage: "SANDBOX_START_FAILED",
      status: error.statusCode || null,
      code: ["MISSING_TEST_KEY", "SANDBOX_CATALOGUE_MISMATCH"].includes(
        error.message,
      )
        ? error.message
        : "STRIPE_ACCESS_UNAVAILABLE",
    }),
  );
  process.exitCode = 1;
});
