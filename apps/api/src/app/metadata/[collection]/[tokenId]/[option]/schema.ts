import { metadataCollectionTokenIdRouteParamsSchema as schema } from "@/app/metadata/[collection]/[tokenId]/schema";
import { z } from "zod";

export const metadataCollectionTokenIdOptionRouteParamsSchema = schema.extend({
  option: z.string().transform(v => v.toLowerCase().split(".")[0]).refine(v => v === "image", "Invalid option"),
});
