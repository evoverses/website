"use strict";
const http = require("node:http"),
  { timingSafeEqual } = require("node:crypto");
function localStoreSettings(env, catalogue) {
  if (env.EVOVERSES_LOCAL_STORE_PAYMENTS !== "1") return null;
  const fail = () => {
    throw Error("Explicit sandbox-only payment configuration required");
  };
  if (
    env.NODE_ENV === "production" ||
    env.EVOROS_STRIPE_ENABLED !== "true" ||
    env.EVOROS_STRIPE_MODE !== "test" ||
    env.EVOROS_STORE_ORIGIN !== "http://localhost:3100" ||
    !/^(rk|sk)_test_[A-Za-z0-9]+$/.test(env.STRIPE_SECRET_KEY || "") ||
    !/^whsec_[A-Za-z0-9]+$/.test(env.STRIPE_WEBHOOK_SECRET || "") ||
    !/^[a-f0-9]{64}$/.test(env.EVOVERSES_LOCAL_STORE_SERVICE_TOKEN || "") ||
    env.EVOROS_STRIPE_ACCOUNT !== catalogue.accountId
  )
    fail();
  const prices = JSON.parse(env.EVOROS_STRIPE_PRICES || "{}");
  if (Object.keys(prices).length !== catalogue.products.length) fail();
  for (const p of catalogue.products) {
    const c = prices[p.bundleId];
    if (
      !c ||
      Object.keys(c).length !== 3 ||
      c.priceId !== p.priceId ||
      c.currency !== "usd" ||
      c.unitAmount !== p.evoros ||
      p.unitAmount !== p.evoros
    )
      fail();
  }
  return {
    mode: "test",
    paymentScope: catalogue.accountId,
    prices,
    secretKey: env.STRIPE_SECRET_KEY,
    token: env.EVOVERSES_LOCAL_STORE_SERVICE_TOKEN,
  };
}
function stripeReceiptVerifier(sdk, scope) {
  return async ({ sessionId }) => {
    const s = await sdk.checkout.sessions.retrieve(sessionId),
      lines = await sdk.checkout.sessions.listLineItems(sessionId, {
        limit: 2,
      });
    if (
      s.livemode !== false ||
      s.mode !== "payment" ||
      s.metadata?.flow !== "evoros-store-v1" ||
      lines.has_more ||
      lines.data.length !== 1
    )
      throw Error("Unexpected sandbox payment");
    const item = lines.data[0];
    return {
      sessionId: s.id,
      mode: "test",
      paymentScope: scope,
      orderId: s.metadata.orderId,
      playerId: s.metadata.playerId,
      bundleId: s.metadata.bundleId,
      evoros: Number(s.metadata.evoros),
      priceId: item.price?.id,
      currency: s.currency,
      amountSubtotal: s.amount_subtotal,
      amountTotal: s.amount_total,
      quantity: item.quantity,
      status: s.status,
      paymentStatus: s.payment_status,
    };
  };
}
async function startStoreBridge({ economy, token, onCredit = async () => {} }) {
  if (!/^[a-f0-9]{64}$/.test(token))
    throw Error("Private local service token required");
  let port;
  const tasks = new Set();
  const reply = (res, status, body) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      Connection: "close",
    });
    res.end(JSON.stringify(body));
  };
  async function handle(req, res) {
    try {
      const count = (name) =>
        req.rawHeaders.filter(
          (_, i) => i % 2 === 0 && req.rawHeaders[i].toLowerCase() === name,
        ).length;
      if (
        count("host") !== 1 ||
        req.headers.host !== `127.0.0.1:${port}` ||
        req.headers.origin !== undefined ||
        req.url !== "/internal/store"
      )
        return reply(res, 403, { error: "DENIED" });
      const auth = req.headers.authorization;
      if (
        count("authorization") !== 1 ||
        typeof auth !== "string" ||
        !/^Bearer [a-f0-9]{64}$/.test(auth) ||
        !timingSafeEqual(Buffer.from(auth.slice(7)), Buffer.from(token))
      )
        return reply(res, 403, { error: "DENIED" });
      if (
        req.method !== "POST" ||
        req.headers["content-type"] !== "application/json"
      )
        return reply(res, 400, { error: "INVALID_REQUEST" });
      let text = "",
        size = 0;
      for await (const part of req) {
        size += part.length;
        if (size > 4096) return reply(res, 413, { error: "TOO_LARGE" });
        text += part.toString("utf8");
      }
      const body = JSON.parse(text);
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw Error("Bad body");
      const fields = {
        reserve: ["operation", "sessionToken", "requestId", "bundleId"],
        find: ["operation", "orderId"],
        attach: ["operation", "orderId", "sessionId"],
        credit: ["operation", "orderId", "sessionId"],
      };
      if (
        !fields[body.operation] ||
        Object.keys(body).some((k) => !fields[body.operation].includes(k)) ||
        Object.keys(body).length !== fields[body.operation].length
      )
        throw Error("Bad command");
      let value;
      if (body.operation === "reserve")
        value = await economy.reserveOrder(body.sessionToken, {
          requestId: body.requestId,
          bundleId: body.bundleId,
        });
      else if (body.operation === "find")
        value = await economy.findOrder(body.orderId);
      else if (body.operation === "attach") {
        await economy.attachStripeSession(body.orderId, body.sessionId);
        value = true;
      } else {
        value = await economy.creditOnce(body.orderId, body.sessionId);
        await onCredit();
      }
      return reply(res, 200, { value });
    } catch (error) {
      const code = error.code;
      const denied = ["INVALID_SESSION", "ACCOUNT_UNAVAILABLE"].includes(code);
      reply(res, denied ? 401 : 503, {
        error: denied ? "INVALID_SESSION" : "PAYMENT_SERVICE_UNAVAILABLE",
      });
    }
  }
  const server = http.createServer(
    {
      maxHeaderSize: 8192,
      requestTimeout: 5000,
      headersTimeout: 5000,
      connectionsCheckingInterval: 100,
    },
    (req, res) => {
      const task = handle(req, res);
      tasks.add(task);
      task.finally(() => tasks.delete(task)).catch(() => {});
    },
  );
  server.maxConnections = 16;
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      port = server.address().port;
      server.removeListener("error", reject);
      resolve();
    });
  });
  return {
    url: `http://127.0.0.1:${port}`,
    close: async () => {
      await new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      });
      await Promise.allSettled([...tasks]);
    },
  };
}
module.exports = {
  localStoreSettings,
  stripeReceiptVerifier,
  startStoreBridge,
};
