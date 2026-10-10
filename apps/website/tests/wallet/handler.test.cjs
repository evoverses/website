"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
const moduleValue = { exports: {} };
const compiled = ts.transpileModule(
  fs.readFileSync("src/lib/player/wallet/handler.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
new Function("module", "exports", "require", compiled)(
  moduleValue,
  moduleValue.exports,
  (name) =>
    name === "../auth-core"
      ? {
          playerSessionCookie: "ev:player-session",
          playerWebOrigin: "http://localhost:3100",
        }
      : require(name),
);
const { walletHandler, WalletWebError, walletReply } = moduleValue.exports;
const token = "a".repeat(64),
  address = "0x" + "11".repeat(20);
test("hosted wallet actions require the pinned HTTPS beta Host and Origin", async () => {
  let calls = 0;
  const deps = {enabled:true,webOrigin:"https://beta.evoverses.com",rpc:async()=>{calls++;return {links:[]};}};
  const headers={Host:"beta.evoverses.com",Origin:"https://beta.evoverses.com"};
  assert.equal((await walletHandler(request(undefined,headers,"https://beta.evoverses.com/api/player/wallet"),deps)).status,200);
  for(const [host,origin,url] of [
    ["beta.evoverses.com","http://beta.evoverses.com","https://beta.evoverses.com/api/player/wallet"],
    ["evil.example","https://beta.evoverses.com","https://beta.evoverses.com/api/player/wallet"],
    ["beta.evoverses.com","https://beta.evoverses.com","https://evil.example/api/player/wallet"],
  ]) assert.equal((await walletHandler(request(undefined,{Host:host,Origin:origin},url),deps)).status,403);
  assert.equal(calls,1);
});
function request(
  body = { operation: "status", connectedAddress: address },
  headers = {},
  url = "http://localhost:3100/api/player/wallet",
) {
  return new Request(url, {
    method: "POST",
    headers: {
      Host: "localhost:3100",
      Origin: "http://localhost:3100",
      "Content-Type": "application/json",
      Cookie: "ev:player-session=" + token,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
test("exact local Host and Origin required; disabled mode and query parameters fail closed before RPC", async () => {
  let calls = 0;
  const deps = {
    enabled: true,
    rpc: async () => {
      calls++;
      return { links: [] };
    },
  };
  for (const r of [
    request(undefined, { Origin: "https://evil.example" }),
    request(undefined, { Host: "evil.example" }),
    request(
      undefined,
      {},
      "http://localhost:3100/api/player/wallet?player=claimed",
    ),
    request(undefined, {}, "https://localhost:3100/api/player/wallet"),
  ])
    assert.equal((await walletHandler(r, deps)).status, 403);
  assert.equal(
    (await walletHandler(request(), { ...deps, enabled: false })).status,
    403,
  );
  assert.equal(calls, 0);
});
test("missing, duplicate and malformed session cookies denied before RPC", async () => {
  let calls = 0;
  const deps = {
    enabled: true,
    rpc: async () => {
      calls++;
      return { links: [] };
    },
  };
  for (const cookie of [
    "",
    "ev:player-session=claimed",
    "ev:player-session=" + token + ";ev:player-session=" + token,
  ])
    assert.equal(
      (await walletHandler(request(undefined, { Cookie: cookie }), deps))
        .status,
      401,
    );
  assert.equal(calls, 0);
});
test("browser cannot supply player, session, message or destination fields; large/malformed requests denied", async () => {
  let calls = 0;
  const deps = {
    enabled: true,
    rpc: async () => {
      calls++;
      return { links: [] };
    },
  };
  for (const body of [
    { operation: "projection" },
    { operation: "status", connectedAddress: address, playerId: "claim" },
    {
      operation: "verify",
      challengeId: "id",
      signature: "sig",
      message: "altered",
    },
    { operation: "status", connectedAddress: address, sessionToken: token },
    "{}",
    "not-json",
    "[1]",
  ])
    assert.equal((await walletHandler(request(body), deps)).status, 400);
  assert.equal(
    (await walletHandler(request(" ".repeat(2049)), deps)).status,
    413,
  );
  assert.equal(calls, 0);
});
test("session travels only from HttpOnly cookie to backend; output is sanitized with no-store headers", async () => {
  const result = await walletHandler(request(), {
    enabled: true,
    rpc: async (op, session, input) => {
      assert.equal(op, "status");
      assert.equal(session, token);
      assert.deepEqual(input, { connectedAddress: address });
      return { links: [], secret: "must-not-leak" };
    },
  });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.deepEqual(await result.json(), { links: [] });
  const invalid = await walletHandler(request(), {
    enabled: true,
    rpc: async () => {
      throw new WalletWebError("INVALID_SESSION", 401);
    },
  });
  assert.equal(invalid.status, 401);
  const unknown = await walletHandler(request(), {
    enabled: true,
    rpc: async () => {
      throw Error("sensitive diagnostic");
    },
  });
  assert.deepEqual(await unknown.json(), {
    error: { code: "SERVICE_UNAVAILABLE" },
  });
});
test("status refuses raw full addresses, invalid IDs, unrecognized chains and malformed replies", () => {
  const link = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    chainId: 43114,
    addressLabel: "0x1111…1111",
    matchesConnected: true,
    verifiedAt: new Date().toISOString(),
  };
  assert.deepEqual(
    walletReply({ links: [{ ...link, extra: token }] }, "status"),
    { links: [link] },
  );
  for (const v of [
    null,
    {},
    { links: [{ ...link, addressLabel: address }] },
    { links: [{ ...link, chainId: 1 }] },
    { links: [{ ...link, id: "claim" }] },
  ])
    assert.throws(() => walletReply(v, "status"));
});

test("Next internal bind URL is accepted only with exact localhost Host and Origin", async () => {
  const r = await walletHandler(
    request(undefined, {}, "http://0.0.0.0:3100/api/player/wallet"),
    { enabled: true, rpc: async () => ({ links: [] }) },
  );
  assert.equal(r.status, 200);
});
