import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  compatible,
  parentCost,
  parentUnavailable,
  nativeBudget,
  hatchState,
  cooldown,
  DAY,
  INCUBATION,
  EVO_UNIT,
  type Parent,
} from "../../src/lib/nursery/rules.ts";
const parent = (changes: Partial<Parent> = {}): Parent => ({
  tokenId: "1",
  generation: 0n,
  totalBreeds: 0n,
  lastBreedTime: 0n,
  gender: "male",
  primaryType: "water",
  secondaryType: "none",
  ...changes,
});
describe("Nursery parent selection and pricing", () => {
  it("requires distinct parents, opposite known genders and a shared element", () => {
    const a = parent();
    assert.equal(
      compatible(a, parent({ tokenId: "2", gender: "female" })),
      true,
    );
    assert.equal(compatible(a, parent({ gender: "female" })), false);
    assert.equal(compatible(a, parent({ tokenId: "2" })), false);
    assert.equal(
      compatible(a, parent({ tokenId: "2", gender: "unknown" })),
      false,
    );
    assert.equal(
      compatible(
        a,
        parent({ tokenId: "2", gender: "female", primaryType: "fire" }),
      ),
      false,
    );
    assert.equal(
      compatible(
        parent({ primaryType: "fire", secondaryType: "water" }),
        parent({ tokenId: "2", gender: "female" }),
      ),
      true,
    );
    assert.equal(
      compatible(
        parent({ primaryType: "fire", secondaryType: "plant" }),
        parent({
          tokenId: "2",
          gender: "female",
          primaryType: "water",
          secondaryType: "plant",
        }),
      ),
      true,
    );
    assert.equal(
      compatible(
        parent({ primaryType: "none" }),
        parent({ tokenId: "2", gender: "female", primaryType: "none" }),
      ),
      false,
    );
  });
  it("uses the canonical numeric genders and type identifiers", () => {
    assert.equal(
      compatible(
        parent({ gender: 1, primaryType: 2, secondaryType: 1 }),
        parent({ tokenId: "2", gender: 0, primaryType: 1, secondaryType: 0 }),
      ),
      true,
    );
    assert.equal(
      compatible(
        parent({ gender: 1, primaryType: 2, secondaryType: 0 }),
        parent({ tokenId: "2", gender: 0, primaryType: 1, secondaryType: 0 }),
      ),
      false,
    );
  });
  it("preserves the generation multiplier and caps generation-zero pricing at 2500 EVO", () => {
    assert.equal(parentCost(parent()), 500n * EVO_UNIT);
    assert.equal(
      parentCost(parent({ generation: 2n, totalBreeds: 3n })),
      8000n * EVO_UNIT,
    );
    assert.equal(parentCost(parent({ totalBreeds: 4n })), 2500n * EVO_UNIT);
    assert.equal(parentCost(parent({ totalBreeds: 100n })), 2500n * EVO_UNIT);
    assert.throws(() => parentCost(parent({ generation: -1n })));
  });
  it("blocks spent breeds, reserved or unavailable adults and cooldowns", () => {
    assert.equal(
      parentUnavailable(parent({ generation: 1n, totalBreeds: 5n }), 99n * DAY),
      "All five breeds used",
    );
    assert.equal(
      parentUnavailable(parent({ totalBreeds: 50n }), 99n * DAY),
      null,
    );
    assert.equal(
      parentUnavailable(parent({ reserved: true }), 99n * DAY),
      "Already breeding",
    );
    assert.equal(
      parentUnavailable(parent({ available: false }), 99n * DAY),
      "Not ready for this nursery",
    );
    assert.equal(
      parentUnavailable(parent({ lastBreedTime: DAY }), 8n * DAY - 1n),
      "Recovering from breeding",
    );
    assert.equal(
      parentUnavailable(parent({ lastBreedTime: DAY }), 8n * DAY),
      null,
    );
    assert.equal(cooldown(6n), DAY);
    assert.equal(cooldown(20n), DAY);
  });
});
describe("Hermann incubation, treatment and native surcharge", () => {
  it("opens hatching at exactly three days and locks treatment before randomness", () => {
    assert.equal(
      hatchState(10n, 1, false, false, 10n + INCUBATION - 1n).canRequest,
      false,
    );
    assert.equal(
      hatchState(10n, 1, false, false, 10n + INCUBATION).canRequest,
      true,
    );
    assert.equal(hatchState(10n, 1, false, false, 20n).canTreat, true);
    assert.equal(hatchState(10n, 1, true, false, 20n).canTreat, false);
    assert.equal(hatchState(10n, 2, false, false, 20n).canTreat, false);
    assert.equal(hatchState(10n, 2, true, false, 20n).canComplete, false);
    assert.equal(hatchState(10n, 2, true, true, 20n).canComplete, true);
    assert.equal(hatchState(10n, 3, true, true, 20n).canComplete, false);
  });
  it("rounds the 10 percent native budget up without floating point or a subsidy surcharge", () => {
    assert.equal(nativeBudget(0n), 0n);
    assert.equal(nativeBudget(10n), 11n);
    assert.equal(nativeBudget(11n), 13n);
    assert.equal(nativeBudget(10n ** 18n), 11n * 10n ** 17n);
  });
});
