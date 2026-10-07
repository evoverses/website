"use strict";
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const base = process.env.EVOVERSES_INVENTORY_TEST_LIB;
const { ordinaryInventory, visibleInventory } = require(
  path.join(base, "lib/player/inventory/model.js"),
);
const { loadLinkedNfts, walletProjection } = require(
  path.join(base, "lib/player/inventory/nfts.js"),
);
const { inventoryHandler } = require(
  path.join(base, "lib/player/inventory/handler.js"),
);
const { createPlayerWebAuth } = require(
  path.join(base, "lib/player/auth-core.js"),
);
const { WalletWebError } = require(
  path.join(base, "lib/player/wallet/handler.js"),
);
const collection = "0x4151b8afa10653d304fdac9a781afccd45ec164c",
  a = "0x" + "11".repeat(20),
  b = "0x" + "22".repeat(20),
  other = "0x" + "33".repeat(20);
const projection = {
  version: "a".repeat(64),
  wallets: [
    {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      chainId: 43114,
      address: a,
      label: "0x1111…1111",
    },
    {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      chainId: 43114,
      address: b,
      label: "0x2222…2222",
    },
  ],
};
const owned = {
  items: [
    { productId: "vital_dew", revision: 1, quantity: 3 },
    { productId: "vital_dew", revision: 2, quantity: 0 },
  ],
  evos: [
    {
      id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      speciesKey: "kitsul",
      experience: 12,
      stats: { hp: 10 },
    },
  ],
};
const asset = (id, owner = a, extra = {}) => ({
  chainId: "43114",
  address: collection,
  owner,
  tokenId: String(id),
  metadata: {
    type: "EVO",
    species: "kitsul",
    generation: 0,
    xp: 50,
    chroma: "none",
  },
  ...extra,
});
const sources = (items, overrides = {}) => ({
  fetchIndexed: async () => ({ items, total: items.length, nextPage: null }),
  readChain: async (owners, ids) => ({
    owners: ids.map(() => a),
    counts: owners.map(() => 0n),
  }),
  ...overrides,
});
const request = (
  body = { includeNfts: true, page: 0, linksVersion: null },
  headers = {},
) =>
  new Request("http://0.0.0.0:3100/api/player/inventory", {
    method: "POST",
    headers: {
      Host: "localhost:3100",
      Origin: "http://localhost:3100",
      "Content-Type": "application/json",
      Cookie: "ev:player-session=" + "f".repeat(64),
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
function deps(overrides = {}) {
  return {
    enabled: true,
    readInventory: async () => owned,
    projection: async () => projection,
    sources: sources([asset(1)]),
    image: () => null,
    ...overrides,
  };
}
test("catalogue item names/icons are display-only; normal items and Evos retain correct quantities/XP", () => {
  const rows = ordinaryInventory(owned);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].name, "Vital Dew");
  assert.equal(rows[0].quantity, 3);
  assert.equal(rows[0].image, "/inventory/items/vital_dew.png");
  assert.equal(rows[1].name, "Kitsul");
  assert.equal(rows[1].xp, 12);
  assert.equal(
    rows.some((r) => r.kind === "nft"),
    false,
  );
});
test("filter/sort works across categories; hidden Pro data never enters ordinary results", () => {
  const rows = [
    ...ordinaryInventory(owned),
    {
      id: "n1",
      kind: "nft",
      name: "Kitsul #2",
      quantity: 1,
      xp: 99,
      species: "kitsul",
      category: "Evos",
      walletId: projection.wallets[0].id,
      walletLabel: projection.wallets[0].label,
      form: "evo",
    },
    {
      id: "n2",
      kind: "nft",
      name: "Evo egg",
      quantity: 1,
      xp: null,
      species: "unknown",
      category: "Eggs",
      walletId: projection.wallets[1].id,
      walletLabel: projection.wallets[1].label,
      form: "egg",
    },
  ];
  const filter = {
    search: "",
    type: "all",
    wallet: "all",
    sort: "name-asc",
    proMode: true,
  };
  assert.equal(visibleInventory(rows, { ...filter, type: "evo" }).length, 2);
  assert.equal(visibleInventory(rows, { ...filter, type: "egg" }).length, 1);
  assert.equal(
    visibleInventory(rows, { ...filter, wallet: projection.wallets[1].id })[0]
      .id,
    "n2",
  );
  assert.equal(
    visibleInventory(rows, { ...filter, wallet: "account" }).length,
    2,
  );
  assert.equal(
    visibleInventory(rows, { ...filter, sort: "xp-desc" })[0].id,
    "n1",
  );
  assert.equal(
    visibleInventory(rows, { ...filter, sort: "quantity-desc" })[0].quantity,
    3,
  );
  assert.equal(
    visibleInventory(rows, { ...filter, search: "0x2222…2222" })[0].id,
    "n2",
  );
  assert.equal(
    visibleInventory(rows, {
      ...filter,
      proMode: false,
      type: "nft",
      wallet: projection.wallets[1].id,
    }).length,
    2,
  );
  assert.equal(rows.length, 4);
});
test("linked wallets combined, canonical NFT identity deduplicated and current chain owner sets wallet label", async () => {
  const result = await loadLinkedNfts(
    projection,
    0,
    sources(
      [
        asset(1),
        asset("01"),
        asset(2, b),
        asset(3, a, {
          metadata: { type: "EGG", species: "unknown", generation: 0 },
        }),
      ],
      { readChain: async () => ({ owners: [b, b, a], counts: [1n, 2n] }) },
    ),
  );
  assert.equal(result.rows.length, 3);
  assert.equal(result.rows[0].walletLabel, "0x2222…2222");
  assert.equal(result.rows[0].walletId, projection.wallets[1].id);
  assert.equal(result.rows[2].form, "egg");
  assert.equal(result.chainTotal, 3);
  assert.equal(JSON.stringify(result).includes(a), false);
  assert.equal(JSON.stringify(result).includes(b), false);
});
test("foreign owner, chain, collection and out-of-range token IDs cannot enter inventory", async () => {
  const result = await loadLinkedNfts(
    projection,
    0,
    sources(
      [
        asset(1, other),
        asset(2, a, { chainId: "1" }),
        asset(3, a, { address: other }),
        asset(2n ** 256n),
        asset(5),
      ],
      {
        readChain: async (_, ids) => {
          assert.deepEqual(ids, ["5"]);
          return { owners: [other], counts: [0n, 0n] };
        },
      },
    ),
  );
  assert.equal(result.rows.length, 0);
  assert.ok(result.warnings.includes("INDEXER_REFRESHING"));
});
test("unavailable ownership omitted, metadata lag and indexer failure are notices rather than false confirmed zero", async () => {
  const partial = await loadLinkedNfts(
    projection,
    0,
    sources([asset(1), asset(2)], {
      readChain: async () => ({ owners: [a, null], counts: [4n, 0n] }),
    }),
  );
  assert.equal(partial.rows.length, 1);
  assert.ok(partial.warnings.includes("OWNERSHIP_UNAVAILABLE"));
  assert.ok(partial.warnings.includes("METADATA_PENDING"));
  const outage = await loadLinkedNfts(
    projection,
    0,
    sources([], {
      fetchIndexed: async () => {
        throw Error("private data");
      },
    }),
  );
  assert.deepEqual(outage.warnings, ["DATA_SERVICE_UNAVAILABLE"]);
  assert.equal(outage.chainTotal, null);
  const chainFail = await loadLinkedNfts(
    projection,
    0,
    sources([asset(1)], {
      readChain: async () => {
        throw Error("RPC down");
      },
    }),
  );
  assert.deepEqual(chainFail.warnings, ["OWNERSHIP_UNAVAILABLE"]);
});
test("no linked wallets makes no upstream request; malformed projections and pagination are rejected", async () => {
  assert.throws(() =>
    walletProjection({
      ...projection,
      wallets: [{ ...projection.wallets[0], chainId: 1 }],
    }),
  );
  assert.throws(() =>
    walletProjection({
      ...projection,
      wallets: [projection.wallets[0], projection.wallets[0]],
    }),
  );
  const result = await loadLinkedNfts(
    { wallets: [], version: projection.version },
    0,
    sources([], {
      fetchIndexed: async () => {
        throw Error("Must not be called");
      },
    }),
  );
  assert.equal(result.chainTotal, 0);
  await assert.rejects(
    loadLinkedNfts(
      projection,
      0,
      sources([], {
        fetchIndexed: async () => ({ items: [], total: 0, nextPage: 0 }),
      }),
    ),
  );
});
test("ordinary-mode endpoint bypasses wallet decryption/indexer/RPC entirely", async () => {
  const response = await inventoryHandler(
    request({ includeNfts: false, page: 0, linksVersion: null }),
    deps({
      projection: async () => {
        throw Error("Must not decrypt");
      },
    }),
  );
  assert.equal(response.status, 200);
  const json = await response.json();
  assert.equal(json.rows.length, 2);
  assert.equal(json.nfts, null);
});
test("endpoint uses authenticated account links only and exposes masked IDs, never full wallet addresses", async () => {
  let verified = 0;
  const response = await inventoryHandler(
    request(),
    deps({
      projection: async (token) => {
        assert.equal(token, "f".repeat(64));
        verified++;
        return projection;
      },
    }),
  );
  assert.equal(response.status, 200);
  const text = await response.text();
  assert.equal(text.includes(a), false);
  assert.equal(text.includes(b), false);
  assert.equal(verified, 2);
  assert.equal(response.headers.get("cache-control"), "no-store");
});
test("logout/unlink during reads and changed pagination scope fail closed", async () => {
  let calls = 0;
  const changed = await inventoryHandler(
    request(),
    deps({
      projection: async () =>
        ++calls === 1 ? projection : { ...projection, version: "b".repeat(64) },
    }),
  );
  assert.equal(changed.status, 409);
  const page = await inventoryHandler(
    request({ includeNfts: true, page: 1, linksVersion: "b".repeat(64) }),
    deps(),
  );
  assert.equal(page.status, 409);
  calls = 0;
  const revoked = await inventoryHandler(
    request(),
    deps({
      projection: async () => {
        if (++calls === 2) throw new WalletWebError("INVALID_SESSION", 401);
        return projection;
      },
    }),
  );
  assert.equal(revoked.status, 401);
});
test("anonymous/cross-origin/claimed-wallet/malformed/big requests denied before upstream reads", async () => {
  let calls = 0;
  const d = deps({
    readInventory: async () => {
      calls++;
      return owned;
    },
  });
  assert.equal(
    (await inventoryHandler(request(undefined, { Cookie: "" }), d)).status,
    401,
  );
  assert.equal(
    (
      await inventoryHandler(
        request(undefined, { Origin: "https://evil.example" }),
        d,
      )
    ).status,
    403,
  );
  for (const value of [
    { includeNfts: true, page: 0, linksVersion: null, owners: [other] },
    { includeNfts: false, page: 1, linksVersion: null },
    { includeNfts: true, page: 1, linksVersion: null },
    { includeNfts: true, page: -1, linksVersion: null },
    "invalid",
  ])
    assert.equal((await inventoryHandler(request(value), d)).status, 400);
  assert.equal(
    (await inventoryHandler(request(" ".repeat(1025)), d)).status,
    413,
  );
  assert.equal(calls, 0);
});
test("account reader accepts SQL catalogue IDs and rejects malformed item revisions", async () => {
  const config = {
    clientId: "fixture",
    clientSecret: "fixture",
    apiUrl: "http://127.0.0.1:50000",
    applicationId: "fixture",
    deploymentId: "fixture",
  };
  let payload = owned;
  const auth = createPlayerWebAuth({
    configuration: () => config,
    fetchImpl: async () => Response.json(payload),
  });
  const value = await auth.readInventory("a".repeat(64));
  assert.equal(value.items[0].productId, "vital_dew");
  payload = {
    ...owned,
    items: [{ productId: "vital_dew", revision: 0, quantity: 1 }],
  };
  await assert.rejects(auth.readInventory("a".repeat(64)));
  payload = {
    ...owned,
    items: [{ productId: "../bad", revision: 1, quantity: 1 }],
  };
  await assert.rejects(auth.readInventory("a".repeat(64)));
});
