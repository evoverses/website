import { z } from "zod";
import { evorosBundles } from "../../data/evoros-bundles";
import { encodeFunctionData, erc20Abi } from "viem";
export const evoPurchaseToken = "0x42006ab57701251b580bdfc24778c43c9ff589a1";
export const evoPurchaseTreasury = "0x9f64c4beca7bbda647b9a755b29f7f9687bc4303";
export const evoOrderSchema = z.object({
  orderId: z.string().uuid(), bundleId: z.string().refine(id => evorosBundles.some(bundle => bundle.id === id)), evoros: z.number().int().positive(), status: z.enum(["awaiting_payment", "credited"]),
  chainId: z.literal(43114), token: z.string(), recipient: z.string(), payer: z.string(),
  units: z.string().regex(/^[1-9][0-9]{0,77}$/), expiresAt: z.string().datetime(), data: z.string().regex(/^0x[a-fA-F0-9]+$/),
});
export type EvoOrder = z.infer<typeof evoOrderSchema>;
export function validateEvoOrder(raw: unknown, payer: string, bundleId: string, evoros: number): EvoOrder {
  const order = evoOrderSchema.parse(raw), units = BigInt(order.units);
  if (order.status !== "awaiting_payment" || order.token.toLowerCase() !== evoPurchaseToken || order.recipient.toLowerCase() !== evoPurchaseTreasury || order.payer.toLowerCase() !== payer.toLowerCase() || order.bundleId !== bundleId || order.evoros !== evoros || units >= 2n ** 256n || Date.parse(order.expiresAt) <= Date.now() + 5000) throw Error("Invalid or expired EVO purchase. Please refresh before paying.");
  const data = encodeFunctionData({ abi: erc20Abi, functionName: "transfer", args: [evoPurchaseTreasury, units] }) + "45564f524f5331" + order.orderId.replaceAll("-", "");
  if (data.toLowerCase() !== order.data.toLowerCase()) throw Error("Unexpected EVO payment request.");
  return order;
}
