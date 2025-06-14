import { z } from "zod";

export const metadataCollectionRouteParamsSchema = z.object({
  collection: z.string()
    .transform(v => v.toLowerCase())
    .refine(v => [ "evo", "evos" ].includes(v), "Invalid collection"),
});
