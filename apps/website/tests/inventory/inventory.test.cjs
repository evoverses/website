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

const { parseEvoStats, evoProgression } = require(
  path.join(base, "lib/player/inventory/evo.js"),
);
const generatedStats = () => ({
  schemaVersion: 1,
  level: 1,
  experience: 0,
  baseStats: {
    health: 50,
    attack: 90,
    special: 80,
    defense: 70,
    resistance: 60,
    speed: 50,
  },
  genetics: {
    health: 25,
    attack: 25,
    special: 25,
    defense: 25,
    resistance: 25,
    speed: 25,
  },
  trainingPoints: {
    health: 0,
    attack: 0,
    special: 0,
    defense: 0,
    resistance: 0,
    speed: 0,
  },
  values: {
    health: 50,
    attack: 1,
    special: 1,
    defense: 1,
    resistance: 1,
    speed: 1,
  },
  nature: "Loyal",
  gender: "Female",
  size: 0,
  currentHealth: 17,
  moves: [4001, 7016],
  strengthTier: "Future",
  privateOperatorNote: "must never reach browser",
});
test("generated Evo schema preserves HP/genes and starting moves; malformed or locked details fail closed", () => {
  const input = generatedStats(),
    parsed = parseEvoStats(input, "nissel");
  assert.equal(parsed.currentHealth, 17);
  assert.deepEqual(parsed.moves, [4001, 7016]);
  assert.equal(parsed.strengthTier, undefined);
  assert.equal(parsed.privateOperatorNote, undefined);
  for (const change of [
    { schemaVersion: 2 },
    { level: 7 },
    { moves: [7014] },
    { moves: [4001, 4001] },
    { moves: [999999] },
    { currentHealth: 51 },
    { genetics: { ...input.genetics, attack: 0 } },
    { genetics: { ...input.genetics, attack: 51 } },
    { trainingPoints: { ...input.trainingPoints, attack: 1 } },
  ])
    assert.throws(() => parseEvoStats({ ...input, ...change }, "nissel"));
  assert.throws(() => parseEvoStats(input, "unknown-species"));
  const details = evoProgression("nissel", parsed);
  assert.equal(details.level, 1);
  assert.equal(details.projected.health, 50);
  assert.equal(details.moves.find((m) => m.id === 4001).name, "Tackle");
  assert.equal(details.moves.find((m) => m.id === 7014).level, 7);
  assert.equal(details.moves.find((m) => m.id === 7014).unlocked, false);
  const rows = ordinaryInventory({
    items: [{ productId: "evo_pack_2", revision: 2, quantity: 1 }],
    evos: [
      {
        id: owned.evos[0].id,
        speciesKey: "nissel",
        experience: 0,
        displayId: "E-0000000042",
        stats: parsed,
      },
    ],
  });
  assert.equal(rows[0].name, "2-Evo Pack");
  assert.equal(rows[1].details.currentHealth, 17);
  assert.equal(
    visibleInventory(rows, {
      search: "E-0000000042",
      type: "all",
      wallet: "all",
      sort: "name-asc",
      proMode: false,
    }).length,
    1,
  );
});
test("website account reader accepts the real nested pack format without forwarding private fields", async () => {
  const evo = {
    ...owned.evos[0],
    speciesKey: "nissel",
    experience: 0,
    displayId: "E-0000000042",
    breedable: false,
    generation: null,
    stats: generatedStats(),
  };
  const flow = createPlayerWebAuth({
    configuration: () => ({
      apiUrl: "http://127.0.0.1:50999",
      clientId: "fixture",
      clientSecret: "synthetic",
      applicationId: "fixture",
      deploymentId: "fixture",
    }),
    fetchImpl: async () => Response.json({ items: [], evos: [evo] }),
  });
  const inventory = await flow.readInventory("a".repeat(64));
  assert.equal(inventory.evos[0].displayId, evo.displayId);
  assert.equal(inventory.evos[0].stats.currentHealth, 17);
  assert.equal(inventory.evos[0].stats.privateOperatorNote, undefined);
});
test("same Epic identity in game and website reads one saved pack roster; other accounts cannot see it", async () => {
  const gameRoot = path.resolve(
    __dirname,
    "../../../../../evoverses-beta-account-bridge/Prototypes/player_economy",
  );
  const { localPGlite, setup } = require(
    path.join(gameRoot, "scripts/fixtures.cjs"),
  );
  const { accountFixtures } = require(
    path.join(gameRoot, "scripts/account-fixtures.cjs"),
  );
  const { embeddedDatabase } = require(path.join(gameRoot, "src/database.cjs"));
  const { GameStore } = require(path.join(gameRoot, "src/game-store.cjs"));
  const { startLocalStoreApi } = require(path.join(gameRoot, "src/http.cjs"));
  const fs = require("node:fs"),
    { randomUUID } = require("node:crypto");
  let db, api;
  try {
    db = new (localPGlite())();
    const f = await setup(db);
    await db.exec(
      fs.readFileSync(
        path.join(gameRoot, "schema/004_game_store_packs.sql"),
        "utf8",
      ),
    );
    const store = new GameStore({ economy: f.economy, mode: "local-test" });
    await store.installCatalogue();
    const a = accountFixtures(embeddedDatabase(db), {
      grantNewPlayer: (tx, id) => store.grantStarter(tx, id),
    });
    const web = await a.accounts.login({
      proof: a.proof("same-epic-player", "fixture-web"),
      confirmNewPlayer: true,
    });
    const game = await a.accounts.login({
      proof: a.proof("same-epic-player", "fixture-game"),
    });
    assert.equal(web.player.id, game.player.id);
    const opened = await store.openPack(game.sessionToken, {
      requestId: randomUUID(),
      productId: "evo_pack_2",
      revision: 2,
    });
    api = await startLocalStoreApi({
      accounts: a.accounts,
      economy: f.economy,
      store,
    });
    const reader = createPlayerWebAuth({
      configuration: () => ({
        apiUrl: api.url,
        clientId: "fixture",
        clientSecret: "synthetic",
        applicationId: "fixture",
        deploymentId: "fixture",
      }),
    });
    const inventory = await reader.readInventory(web.sessionToken);
    assert.equal(inventory.evos.length, 2);
    assert.deepEqual(
      inventory.evos.map((e) => e.id).sort(),
      opened.evos.map((e) => e.id).sort(),
    );
    const rows = ordinaryInventory(inventory);
    assert.ok(
      rows.every(
        (r) =>
          r.details.level === 1 &&
          r.details.currentHealth === 50 &&
          r.details.moves.some((m) => m.equipped),
      ),
    );
    const other = await reader.readInventory(f.bobToken);
    assert.equal(other.evos.length, 0);
    await a.accounts.logout(game.sessionToken);
    assert.equal((await reader.readInventory(web.sessionToken)).evos.length, 2);
  } finally {
    if (api) await api.close();
    if (db) await db.close();
  }
});

test("actual inventory card renders saved HP, stats and move unlocks without Pro labels", () => {
  const fs = require("node:fs"),
    vm = require("node:vm"),
    ts = require("typescript"),
    React = require("react"),
    { renderToStaticMarkup } = require("react-dom/server");
  const code = ts.transpileModule(
    fs.readFileSync(
      path.resolve(
        __dirname,
        "../../src/components/player/account-inventory.tsx",
      ),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const mod = { exports: {} },
    evo = require(path.join(base, "lib/player/inventory/evo.js"));
  const stubs = {
    "next/image": (props) =>
      React.createElement("img", {
        src: props.src,
        alt: props.alt,
        className: props.className,
      }),
    "@tanstack/react-query": {},
    "@/components/providers/pro-mode-provider": {},
    "@/lib/player/inventory/model": require(
      path.join(base, "lib/player/inventory/model.js"),
    ),
    "@/lib/player/inventory/evo": evo,
    "@workspace/ui/components/button": {},
    "@workspace/ui/components/input": {},
    // Render disclosure contents for value checks; pointer/focus behaviour is checked in the browser.
    "@workspace/ui/components/popover": {
      Popover: ({ children }) =>
        React.createElement(React.Fragment, null, children),
      PopoverTrigger: ({ children }) => children,
      PopoverContent: ({ children, className }) =>
        React.createElement("div", { className }, children),
    },
  };
  vm.runInNewContext(code, {
    module: mod,
    exports: mod.exports,
    require: (name) =>
      Object.hasOwn(stubs, name) ? stubs[name] : require(name),
  });
  const row = ordinaryInventory({
    items: [],
    evos: [
      {
        id: owned.evos[0].id,
        speciesKey: "nissel",
        experience: 0,
        displayId: "E-0000000042",
        stats: parseEvoStats(generatedStats(), "nissel"),
      },
    ],
  })[0];
  const html = renderToStaticMarkup(
    React.createElement(mod.exports.InventoryCard, { row }),
  );
  for (const text of [
    "E-0000000042",
    "Stats and moves",
    "Battle stats",
    "Level 100",
    "Genetic ratings",
    "Smoke Bomb",
    "Locked",
    "Tackle",
    "Equipped",
  ])
    assert.ok(html.includes(text), text);
  assert.ok(/HP 17[^<]*\/50/.test(html));
  assert.equal(/NFT|off-chain|Future|Challenger/.test(html), false);
  const details = evo.nftProgression("kitsul", {
    xp: 0,
    nature: "loyal",
    gender: "female",
    attack: 25,
    special: 25,
    defense: 25,
    resistance: 25,
    speed: 25,
  });
  const nft = renderToStaticMarkup(
    React.createElement(mod.exports.InventoryCard, {
      row: {
        ...row,
        id: "nft:2253",
        kind: "nft",
        displayId: undefined,
        name: "kitsul #2253",
        tokenId: "2253",
        walletLabel: "0xaaaa…aaaa",
        image: "/test.png",
        details,
      },
    }),
  );
  assert.ok(nft.includes("Stats and moves"));
  assert.ok(nft.includes("Tackle"));
  assert.ok(nft.includes("Locked"));
  assert.ok(/HP 50[^<]*\/50/.test(nft));
  assert.ok(nft.includes("h-full w-2/3 object-contain"));
  assert.ok(nft.includes("space-y-2 text-xs"));
  assert.ok(nft.includes("max-w-[calc(100vw-32px)]"));
  assert.equal(nft.includes("<details"), false);
  const item = renderToStaticMarkup(
    React.createElement(mod.exports.InventoryCard, {
      row: {
        id: "item:test",
        kind: "item",
        name: "Potion",
        image: "/test.png",
        quantity: 1,
        xp: null,
        species: null,
        category: "Healing",
      },
    }),
  );
  assert.ok(item.includes("size-14 max-w-full object-contain"));
  assert.ok(item.includes("flex h-16"));
});

test("owned NFT details use genes and real XP unlocks; preserve zero HP and omit fabricated health genes", async () => {
  const { nftProgression } = require(
    path.join(base, "lib/player/inventory/evo.js"),
  );
  const m = {
    xp: 0,
    nature: "loyal",
    gender: "female",
    attack: 25,
    special: 25,
    defense: 25,
    resistance: 25,
    speed: 25,
  };
  const one = nftProgression("nissel", m);
  assert.equal(one.level, 1);
  assert.equal(one.currentHealth, 50);
  assert.equal(one.values.health, 50);
  assert.equal(one.geneticHealthAvailable, false);
  assert.equal(one.moves.filter((v) => v.unlocked).length, 2);
  const seven = nftProgression("nissel", { ...m, xp: 309, currentHealth: 0 });
  assert.equal(seven.level, 7);
  assert.equal(seven.currentHealth, 0);
  assert.equal(seven.moves.find((v) => v.id === 7014).unlocked, true);
  assert.equal(seven.moves.find((v) => v.id === 4023).unlocked, false);
  for (const bad of [
    { ...m, attack: 51 },
    { ...m, nature: "unknown" },
    { ...m, currentHealth: 51 },
    { ...m, xp: -1 },
  ])
    assert.equal(nftProgression("nissel", bad), undefined);
  assert.equal(nftProgression("nissel", {}), undefined);
});
