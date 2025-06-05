import { Contract, Token } from "../../model";
import type { Context } from "../../utils/context";

export const getOrCreateToken = (ctx: Context, contract: Contract) => {
  const id = contract.address;
  let token = ctx.entities.get(Token, id, false);
  if (!token) {
    token = new Token({ id, contract, decimals: 18 });
    ctx.entities.add(token);
  }
  return token;
};
