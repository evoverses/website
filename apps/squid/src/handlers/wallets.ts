import { Wallet } from "../model";
import type { Context } from "../model/context";

export const getOrCreateWallet = (ctx: Context, address: string) => {
  let wallet = ctx.entities.get(Wallet, address, false);
  if (!wallet) {
    wallet = new Wallet({ id: `${ctx.chain.id}-${address}`, address, chain: ctx.chain });
    ctx.entities.add(wallet);
  }
  return wallet;
};
