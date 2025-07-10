import { z } from "zod";

export type SquidError = {
  message: string;
  extensions: {
    code: string;
    exception: {
      stacktrace: string[];
    };
  }
}

export type SquidErrorResponse = {
  errors: SquidError[];
}

export const marketplaceStatusSchema = z.enum([ "UNSET", "CREATED", "ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED" ]);
export const MarketplaceStatus = marketplaceStatusSchema.enum;
export type MarketplaceStatus = z.infer<typeof marketplaceStatusSchema>;
