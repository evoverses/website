import { metadataCollectionRouteParamsSchema as schema } from "@/app/metadata/[collection]/schema";
import { z } from "zod";

export const metadataCollectionTokenIdRouteParamsSchema = schema.extend({
  tokenId: z.coerce.number().positive("Invalid TokenID").transform(v => v.toString()),
});
