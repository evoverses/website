const path = require("node:path");
const lib = process.env.NURSERY_TEST_LIB;
if (!lib) throw new Error("Run the Nursery test runner.");
process.env.CHAIN_ID = "43114";
process.env.GATEWAY_NETWORK_SLUG = "";
process.env.GATEWAY_URL = "http://127.0.0.1:1";
process.env.NFT_ADDRESSES = "0x4151b8afa10653d304fdac9a781afccd45ec164c";
delete process.env.NURSERY_HERMANN_ADDRESS;
delete process.env.NURSERY_EVO_ADDRESS;
delete process.env.NURSERY_FROM_BLOCK;
const load = (name) => require(path.join(lib, name));
const collection = process.env.NFT_ADDRESSES;
const hatcher = "0x1111111111111111111111111111111111111111";
const config = { chainId: "43114", collection, hatcher, fromBlock: 10 };
const block = (height = 10) => ({
  height,
  hash: "0x" + BigInt(height).toString(16).padStart(64, "0"),
  timestamp: 1700000000000 + height * 1000,
});
const event = (name, tokenId = 101n, height = 10, index = 0, seed) => ({
  ...block(height),
  name,
  tokenId,
  index,
  seed,
});
const seed = { species: 13n, generation: 1n, parent1: 1n, parent2: 2n };
const adult = (changes = {}) => ({
  species: 13n,
  generation: 0n,
  totalBreeds: 7n,
  lastBreedTime: 1699000000n,
  attributes: {
    gender: 1n,
    rarity: 0n,
    primaryType: 2n,
    secondaryType: 0n,
    nature: 0n,
    size: 10n,
  },
  stats: {
    health: 50n,
    attack: 23n,
    defense: 24n,
    special: 25n,
    resistance: 26n,
    speed: 27n,
  },
  ...changes,
});
const egg = (status = 1, treated = false) => ({
  ...seed,
  speciesVersion: 2n,
  createdAt: 1700000010n,
  treated,
  status,
  vrfRequestId: status > 1 ? 71n : 0n,
});
const reader = (status = 1, treated = false, changes = {}) => ({
  known: async () => true,
  egg: async () => egg(status, treated),
  adult: async () => adult({ generation: 1n, totalBreeds: 0n }),
  species: async () => ({ id: 13n, primaryType: 2n, secondaryType: 0n }),
  ...changes,
});
const word = (value) => BigInt(value).toString(16).padStart(64, "0");
const encoded = (values) => "0x" + values.map(word).join("");
function rpcFixture(status = 1, treated = false, changes = {}) {
  const { functions } = load("abi/generated/hatcher-hermann");
  const calls = [];
  const client = {
    call: async (method, params) => {
      calls.push({ method, params });
      if (method === "eth_chainId") return "0xa86a";
      if (method !== "eth_call") throw new Error("Unexpected RPC method");
      const [{ data }] = params;
      const selector = data.slice(0, 10);
      const tokenId = data.length > 10 ? BigInt("0x" + data.slice(10)) : 0n;
      if (selector === functions.evoNft.selector)
        return "0x" + collection.slice(2).padStart(64, "0");
      if (selector === functions.known.selector) return encoded([1]);
      if (selector === functions.eggs.selector) {
        const e = tokenId <= 2n ? egg(0) : egg(status, treated);
        return encoded([
          e.parent1,
          e.parent2,
          e.speciesVersion,
          e.createdAt,
          e.treated ? 1 : 0,
          e.status,
          e.vrfRequestId,
        ]);
      }
      if (selector === functions.getSpeciesPool.selector)
        return encoded([32, 1, 13, 1, 10, 50, 2, 0]);
      if (selector === functions.adultOf.selector) {
        const a = adult(
          tokenId <= 2n ? {} : { generation: 1n, totalBreeds: 0n, ...changes },
        );
        return encoded([
          a.species,
          a.generation,
          a.totalBreeds,
          a.lastBreedTime,
          ...Object.values(a.attributes),
          ...Object.values(a.stats),
        ]);
      }
      throw new Error("Unknown selector");
    },
  };
  return { client, calls };
}
const quiet = {
  child() {
    return this;
  },
  debug() {},
  warn() {},
  error() {},
};
function context(rows = new Map(), rpc = rpcFixture().client) {
  const { EntityManager } = load("model/entity-manager");
  const { Chain, NurseryEvo } = load("model");
  const store = {
    findBy: async (_class, { id }) =>
      id.value
        .filter((key) => rows.has(key))
        .map((key) => new NurseryEvo(structuredClone(rows.get(key)))),
    upsert: async (entities) => {
      for (const e of entities) rows.set(e.id, structuredClone(e));
    },
  };
  return {
    entities: new EntityManager(store, new Chain({ id: "43114" }), quiet),
    _chain: { client: rpc },
    log: quiet,
  };
}
module.exports = {
  load,
  lib,
  collection,
  hatcher,
  config,
  block,
  event,
  seed,
  adult,
  egg,
  reader,
  word,
  encoded,
  rpcFixture,
  context,
};
