import { assertNotNull } from "@subsquid/util-internal";
import { CHAIN_ID } from "../../constants";
import { Chain } from "../../model";
import type { ProcessorContext } from "../../types/processor";

export const getOrCreateChain = async (ctx: ProcessorContext) => {

  let chain = await ctx.store.findOne(Chain, { where: { id: CHAIN_ID } });
  if (!chain) {
    assertNotNull(CHAIN_ID, "CHAIN_ID not set");
    if (isNaN(parseInt(CHAIN_ID!))) {
      throw new Error(`CHAIN_ID must be a number but received '${CHAIN_ID}`);
    }
    chain = new Chain({ id: CHAIN_ID });
    await ctx.store.upsert(chain);
  }
  return chain;
};
