import { it } from "node:test";
import assert from "node:assert/strict";
import { encodeEventTopics, encodeAbiParameters, type Address } from "viem";
import {
  breedPreparedEvent,
  breedingRequest,
} from "../../src/lib/nursery/events.ts";
const bertha = "0x1111111111111111111111111111111111111111" as Address;
const owner = "0x2222222222222222222222222222222222222222" as Address;
const other = "0x3333333333333333333333333333333333333333" as Address;
const log = {
  address: bertha,
  topics: encodeEventTopics({
    abi: [breedPreparedEvent],
    eventName: "BreedPrepared",
    args: { requestId: 15n, breeder: owner },
  }),
  data: encodeAbiParameters(
    [{ type: "uint256" }, { type: "uint256" }, { type: "uint256" }],
    [1n, 2n, 1000n],
  ),
};
it("recovers only a correctly decoded request for this wallet and this Bertha", () => {
  assert.equal(breedingRequest(log, bertha, owner), 15n);
  assert.equal(breedingRequest(log, bertha, other), null);
  assert.equal(
    breedingRequest({ ...log, address: other }, bertha, owner),
    null,
  );
  assert.equal(breedingRequest({ ...log, data: "0x" }, bertha, owner), null);
});
