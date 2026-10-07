"use strict";
const http = require("node:http"),
  { timingSafeEqual } = require("node:crypto");
async function startWalletLinkBridge({ links, token }) {
  if (!/^[a-f0-9]{64}$/.test(token || "") || !links)
    throw Error("Private wallet bridge required");
  let port,
    active = 0,
    requests = [];
  const tasks = new Set();
  const fields = {
    projection: [],
    status: ["connectedAddress"],
    challenge: ["address"],
    verify: ["challengeId", "signature"],
    unlink: ["linkId", "confirm"],
  };
  const statuses = {
    INVALID_SESSION: 401,
    ACCOUNT_UNAVAILABLE: 403,
    INVALID_REQUEST: 400,
    CHALLENGE_EXPIRED: 409,
    INVALID_SIGNATURE: 400,
    WALLET_ALREADY_LINKED: 409,
    LINK_CHANGED: 409,
    WALLET_LIMIT_REACHED: 409,
    RATE_LIMITED: 429,
  };
  const reply = (res, status, value) => {
    if (res.destroyed || res.writableEnded) return;
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      Connection: "close",
    });
    res.end(JSON.stringify(value));
  };
  async function handle(req, res) {
    let admitted = false;
    try {
      const count = (name) =>
        req.rawHeaders.filter(
          (_, i) => i % 2 === 0 && req.rawHeaders[i].toLowerCase() === name,
        ).length;
      if (
        count("host") !== 1 ||
        req.headers.host !== `127.0.0.1:${port}` ||
        count("origin") ||
        count("cookie") ||
        req.url !== "/internal/wallet-link"
      )
        return reply(res, 403, { error: { code: "DENIED" } });
      const auth = req.headers.authorization;
      if (
        count("authorization") !== 1 ||
        typeof auth !== "string" ||
        !/^Bearer [a-f0-9]{64}$/.test(auth) ||
        !timingSafeEqual(Buffer.from(auth.slice(7)), Buffer.from(token))
      )
        return reply(res, 403, { error: { code: "DENIED" } });
      if (
        req.method !== "POST" ||
        count("content-type") !== 1 ||
        req.headers["content-type"] !== "application/json" ||
        count("content-encoding") ||
        count("content-length") > 1 ||
        count("transfer-encoding") > 1
      )
        return reply(res, 400, { error: { code: "INVALID_REQUEST" } });
      const now = performance.now();
      requests = requests.filter((t) => t > now - 60000);
      if (requests.length >= 60 || active >= 4)
        return reply(res, 429, { error: { code: "RATE_LIMITED" } });
      requests.push(now);
      active++;
      admitted = true;
      const chunks = [];
      let size = 0;
      for await (const part of req) {
        size += part.length;
        if (size > 2048)
          return reply(res, 413, { error: { code: "INVALID_REQUEST" } });
        chunks.push(part);
      }
      const body = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)),
      );
      if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        !Object.hasOwn(fields, body.operation) ||
        !/^([a-f0-9]{64})$/.test(body.sessionToken || "")
      )
        return reply(res, 400, { error: { code: "INVALID_REQUEST" } });
      const keys = ["operation", "sessionToken", ...fields[body.operation]];
      if (
        Object.keys(body).length !== keys.length ||
        Object.keys(body).some((k) => !keys.includes(k))
      )
        return reply(res, 400, { error: { code: "INVALID_REQUEST" } });
      const input = Object.fromEntries(
        fields[body.operation].map((k) => [k, body[k]]),
      );
      const value = await links[body.operation](body.sessionToken, input);
      reply(res, 200, { value });
    } catch (error) {
      const code = Object.hasOwn(statuses, error.code)
        ? error.code
        : "SERVICE_UNAVAILABLE";
      reply(res, statuses[code] || 503, { error: { code } });
    } finally {
      if (admitted) active--;
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
      // Bound stalled bodies independently of the handler's parsing loop.
      req.setTimeout(2000, () => req.destroy());
      res.once("finish", () => req.destroy());
      const task = handle(req, res);
      tasks.add(task);
      task.finally(() => tasks.delete(task));
    },
  );
  server.maxConnections = 16;
  const rejectExpectation = (req, res) => {
    res.once("finish", () => req.destroy());
    reply(res, 417, { error: { code: "INVALID_REQUEST" } });
  };
  server.on("checkContinue", rejectExpectation);
  server.on("checkExpectation", rejectExpectation);
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
module.exports = { startWalletLinkBridge };
