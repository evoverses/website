import { Block, Transaction } from "../../model";
import type { Blocks, Log, Transaction as TX } from "../../types/processor";
import type { Context } from "../../model/context";
import { getOrCreateWallet } from "../wallets";
import { createBlock } from "./blocks";

export const createTransaction = (ctx: Context, tx: TX) => {
  const block = ctx.entities.getOrFail(Block, `${tx.block.height}`, false);
  const id = `${block.id}-${tx.hash}`;
  const from = getOrCreateWallet(ctx, tx.from);
  ctx.entities.add(from);
  return new Transaction({ id, hash: tx.hash, block, from });
};

export const parseBlocks = (ctx: Context, blocks: Blocks) => {
  const logs: Log[] = [];
  for (let c of blocks) {
    const transactions = c.transactions.filter(t => t.status === 1);

    if (transactions.length === 0) {
      continue;
    }
    const block = createBlock(ctx, c.header);
    ctx.entities.add(block);

    for (let transaction of transactions) {
      ctx.entities.add(createTransaction(ctx, transaction));
      logs.push(...transaction.logs);
    }
  }
  return logs;
};
