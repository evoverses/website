import type { BlockHeader } from "@subsquid/evm-processor";
import { Block } from "../../model";
import { toDate } from "../../utils";
import type { Context } from "../../model/context";

export const createBlock = (ctx: Context, header: BlockHeader) => {
  const id = ctx.entities.toId(header.height.toString());
  let block = ctx.entities.get(Block, id, false);
  if (!block) {
    block = new Block({
      id,
      number: header.height,
      timestamp: toDate(header.timestamp),
      chain: ctx.chain,
    });
    ctx.entities.add(block);
  }
  return block;
};
