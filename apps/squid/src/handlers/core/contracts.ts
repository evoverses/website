import { Contract, ContractType } from "../../model";

import type { Context } from "../../utils/context";

export const getOrCreateContract = (ctx: Context, address: string, type?: ContractType) => {
  const id = ctx.entities.toId(address);
  let contract = ctx.entities.get(Contract, id, false);
  if (!contract) {
    contract = new Contract({
      id,
      address,
      chain: ctx.chain,
      type: type || ContractType.UNKNOWN,
    });
    ctx.entities.add(contract);
  }
  return contract;
};
