import { z } from "zod";

export const marketplaceStatusSchema = z.enum([ "UNSET", "CREATED", "ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED" ]);
export const marketplaceStatuses = marketplaceStatusSchema.options;
export const MarketplaceStatus = marketplaceStatusSchema.enum;
export type MarketplaceStatus = z.infer<typeof marketplaceStatusSchema>;
