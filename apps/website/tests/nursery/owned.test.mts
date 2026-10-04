import { it } from "node:test";
import assert from "node:assert/strict";
import { fetchOwnedEvos } from "../../src/lib/nursery/owned.ts";

it("loads a paginated wallet list through the local route and forwards cancellation", async (t) => {
  const owner = "0xa79726d21d16e4d6143b0c99aa57526b08b73e64";
  const signal = new AbortController().signal;
  const page = { items: [{ tokenId: "1", owner }], total: 49, nextPage: 1 };
  t.mock.method(globalThis, "fetch", async (input: string, init: RequestInit) => {
    const url = new URL(input, "http://localhost:3100");
    assert.equal(url.origin, "http://localhost:3100");
    assert.equal(url.pathname, "/api/nursery/evos");
    assert.equal(url.searchParams.get("owner"), owner);
    assert.equal(url.searchParams.get("page"), "0");
    assert.equal(init.signal, signal);
    assert.equal(init.cache, "no-store");
    return Response.json(page);
  });
  assert.deepEqual(await fetchOwnedEvos(owner, 0, signal), page);
});

it("reports upstream failures rather than presenting an empty wallet", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ error: "Unavailable" }, { status: 502 }));
  await assert.rejects(fetchOwnedEvos("0xa79726d21d16e4d6143b0c99aa57526b08b73e64", 0), /Could not load/);
});
