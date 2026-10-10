const test = require("node:test"),
  assert = require("node:assert/strict"),
  path = require("node:path");
const {
  cashCents,
  usd,
  discountedEvoUnits,
  formatEvoEstimate,
  quoteIsFresh,
} = require(path.join(process.env.EVOROS_TEST_LIB, "lib/store/pricing.js"));
const { parseEvoMarketQuote, parseDexEvoMarketQuote, createEvoMarketQuoteFetcher, fetchEvoMarketQuote, EVO_MARKET_POOL } = require(
  path.join(process.env.EVOROS_TEST_LIB, "lib/store/evo-price.js"),
);
const token = "0x42006ab57701251b580bdfc24778c43c9ff589a1";
const data = () => ({
  data: {
    id: "avax_" + token,
    type: "token",
    attributes: { address: token, decimals: 18, price_usd: "0.0001" },
    relationships: { top_pools: { data: [{ id: "avax_" + EVO_MARKET_POOL }] } },
  },
});
test("accepted bundles cost one USD cent per Evoro, with a 90 percent EVO discount", () => {
  [250, 500, 1000, 2500, 5000, 10000].forEach((n) => {
    assert.equal(cashCents(n), n);
    assert.equal(discountedEvoUnits(n, "0.0001"), BigInt(n) * 10n ** 19n);
  });
  assert.equal(usd(cashCents(250)), "US$2.50");
  assert.equal(formatEvoEstimate(discountedEvoUnits(250, "0.0001")), "2,500");
});
test("EVO calculation rounds up at token precision and handles tiny/large quotes exactly", () => {
  assert.equal(discountedEvoUnits(250, "3"), 83333333333333334n);
  assert.equal(formatEvoEstimate(1n), "0.1");
  for (const v of ["0", "-1", "NaN", "Infinity", "1e-4", "", "garbage"])
    assert.throws(() => discountedEvoUnits(250, v));
  assert.throws(() => cashCents(-250));
});
test("price payload must match Avalanche EVO and the known first pool", () => {
  assert.equal(parseEvoMarketQuote(data()).priceUsd, "0.0001");
  for (const change of [
    (v) => (v.data.id = "eth_" + token),
    (v) => (v.data.attributes.address = "wrong"),
    (v) => (v.data.attributes.decimals = 6),
    (v) => (v.data.attributes.price_usd = "0"),
    (v) => (v.data.relationships.top_pools.data[0].id = "wrong"),
    (v) => (v.data.relationships.top_pools.data = []),
  ]) {
    const v = data();
    change(v);
    assert.throws(() => parseEvoMarketQuote(v));
  }
});
test("failed/missing provider quotes cannot become zero or a historical fallback", async () => {
  await assert.rejects(
    fetchEvoMarketQuote(async () => new Response("fail", { status: 503 })),
  );
  await assert.rejects(
    fetchEvoMarketQuote(async () => Response.json({ data: null })),
  );
  let options;
  const q = await fetchEvoMarketQuote(async (url, o) => {
    options = o;
    assert.match(url, /networks\/avax\/tokens\/0x42006/);
    return Response.json(data());
  });
  assert.equal(options.cache, "no-store");
  assert.equal(q.source, "GeckoTerminal");
});
test("quotes expire at five minutes and invalid/future timestamps are rejected", () => {
  const now = Date.now();
  assert.equal(quoteIsFresh(new Date(now).toISOString(), now), true);
  assert.equal(quoteIsFresh(new Date(now - 300000).toISOString(), now), false);
  assert.equal(quoteIsFresh(new Date(now + 6000).toISOString(), now), false);
  assert.equal(quoteIsFresh("bad", now), false);
});

test("EVO display rounds to integers at 100 and one decimal below, without free estimates", () => {
  assert.equal(formatEvoEstimate(100n * 10n ** 18n), "100");
  assert.equal(formatEvoEstimate(1505n * 10n ** 17n), "151");
  assert.equal(formatEvoEstimate(123456n * 10n ** 15n), "123");
  assert.equal(formatEvoEstimate(12345n * 10n ** 15n), "12.3");
  assert.equal(formatEvoEstimate(12355n * 10n ** 15n), "12.4");
  assert.equal(formatEvoEstimate(9996n * 10n ** 16n), "100");
  assert.equal(formatEvoEstimate(1n), "0.1");
});

const dexData = () => ({ pairs: [{ chainId: "avalanche", pairAddress: EVO_MARKET_POOL, baseToken: { address: token }, priceUsd: "0.00006612" }] });
test("provider failure or invalid market falls back to a live price from the same verified pool", async () => {
  for (const first of [new Response("rate limit", {status:429}), Response.json({data:null})]) {
    let calls=0;
    const q=await fetchEvoMarketQuote(async url => {
      calls++;
      if(calls===1)return first;
      assert.match(url,/api.dexscreener.com.*avalanche/);
      return Response.json(dexData());
    });
    assert.equal(q.source,"DexScreener");assert.equal(q.priceUsd,"0.00006612");assert.equal(calls,2);
  }
});
test("fallback rejects wrong chain, pool, token, missing and non-positive prices", () => {
  for(const change of [p=>p.chainId="ethereum",p=>p.pairAddress="wrong",p=>p.baseToken.address="wrong",p=>p.priceUsd=null,p=>p.priceUsd="0"]){
    const d=dexData();change(d.pairs[0]);assert.throws(()=>parseDexEvoMarketQuote(d));
  }
});
test("concurrent refreshes share a request; short cache preserves timestamp and expiry", async () => {
  let clock=Date.now(),calls=0,release;
  const hold=new Promise(r=>release=r);
  const fetchQuote=createEvoMarketQuoteFetcher(async()=>{calls++;await hold;return Response.json(data());},()=>clock);
  const a=fetchQuote(),b=fetchQuote();assert.equal(a,b);release();
  const q=await a;await b;assert.equal(calls,1);
  clock+=29_999;assert.deepEqual(await fetchQuote(),q);assert.equal(calls,1);
  clock+=1;const newer=await fetchQuote();assert.equal(calls,2);assert.notEqual(newer.fetchedAt,q.fetchedAt);
});
test("failed refresh cannot renew an expired cache timestamp and can be retried",async()=>{
  let clock=Date.now(),fail=false,calls=0;
  const fetchQuote=createEvoMarketQuoteFetcher(async()=>{calls++;return fail?new Response("down",{status:503}):Response.json(data());},()=>clock);
  const q=await fetchQuote();fail=true;clock+=300_000;
  await assert.rejects(fetchQuote());assert.equal(quoteIsFresh(q.fetchedAt,clock),false);
  fail=false;assert.notEqual((await fetchQuote()).fetchedAt,q.fetchedAt);assert.equal(calls,4);
});
