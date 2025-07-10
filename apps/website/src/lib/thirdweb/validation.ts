import { getChainById, getChainByName } from "@/lib/thirdweb/utils";
import z from "zod";

export const chainSchema = z.any().transform((v, ctx) => {

  const chainId = Number(v);
  if (!isNaN(chainId)) {
    const chain = getChainById(chainId);
    if (chain) {
      return chain;
    }
  }
  const chain = getChainByName(v || "FAKE");
  if (chain) {
    return chain;
  }
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: `Invalid chain identifier: ${v}`,
  });
  return z.NEVER;
});
