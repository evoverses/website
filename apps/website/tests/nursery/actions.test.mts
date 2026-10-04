import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { submitBreed } from "../../src/lib/nursery/actions.ts";
function flow(changes: Record<string, unknown> = {}) {
  const sent: unknown[] = [];
  const approved: bigint[] = [];
  let previews = 0;
  let guards = 0;
  return {
    sent,
    approved,
    dependencies: {
      guard: async () => {
        guards++;
      },
      preview: async () => {
        previews++;
        return 1000n;
      },
      approve: async (amount: bigint) => {
        approved.push(amount);
      },
      quote: async () => ({ quote: 90n, gasPrice: 15n }),
      send: async (payment: unknown) => {
        sent.push(payment);
        return "receipt";
      },
      ...changes,
    },
    counts: () => ({ guards, previews }),
  };
}
describe("Breeding payment limits and wallet changes", () => {
  it("uses the current gas price and the displayed limits, with an exact EVO approval", async () => {
    const f = flow();
    assert.equal(
      await submitBreed({ cost: 1000n, maximum: 100n }, f.dependencies),
      "receipt",
    );
    assert.deepEqual(f.approved, [1000n]);
    assert.deepEqual(f.sent, [{ cost: 1000n, value: 100n, gasPrice: 15n }]);
  });
  it("does not approve EVO when the first quote has changed", async () => {
    const f = flow({ preview: async () => 1001n });
    await assert.rejects(
      submitBreed({ cost: 1000n, maximum: 100n }, f.dependencies),
      /price changed/,
    );
    assert.deepEqual(f.approved, []);
    assert.deepEqual(f.sent, []);
  });
  it("does not spend after a price change while an approval was confirming", async () => {
    let reads = 0;
    const f = flow({ preview: async () => (++reads === 1 ? 1000n : 2000n) });
    await assert.rejects(
      submitBreed({ cost: 1000n, maximum: 100n }, f.dependencies),
      /quote changed/,
    );
    assert.deepEqual(f.sent, []);
  });
  it("does not spend above the displayed AVAX limit", async () => {
    const f = flow({ quote: async () => ({ quote: 101n, gasPrice: 99n }) });
    await assert.rejects(
      submitBreed({ cost: 1000n, maximum: 100n }, f.dependencies),
      /quote changed/,
    );
    assert.deepEqual(f.sent, []);
  });
  it("aborts if the wallet changes after approval", async () => {
    let checks = 0;
    const f = flow({
      guard: async () => {
        if (++checks === 2) throw new Error("Your wallet changed");
      },
    });
    await assert.rejects(
      submitBreed({ cost: 1000n, maximum: 100n }, f.dependencies),
      /wallet changed/,
    );
    assert.deepEqual(f.sent, []);
  });
  it("does not start breeding if approval is rejected", async () => {
    const f = flow({
      approve: async () => {
        throw new Error("Wallet request cancelled");
      },
    });
    await assert.rejects(
      submitBreed({ cost: 1000n, maximum: 100n }, f.dependencies),
      /cancelled/,
    );
    assert.deepEqual(f.sent, []);
  });
  it("sends no AVAX surcharge for a subsidised quote", async () => {
    const f = flow({ quote: async () => ({ quote: 0n, gasPrice: 15n }) });
    await submitBreed({ cost: 1000n, maximum: 0n }, f.dependencies);
    assert.deepEqual(f.sent, [{ cost: 1000n, value: 0n, gasPrice: 15n }]);
  });
});
