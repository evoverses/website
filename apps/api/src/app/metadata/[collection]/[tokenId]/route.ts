import {
  metadataCollectionTokenIdRouteParamsSchema as paramsSchema,
} from "@/app/metadata/[collection]/[tokenId]/schema";
import { Element } from "@workspace/database/types/evo";
import { fetchSquidAsset } from "@workspace/evoverses/lib/asset/actions";
import {
  getLevelOfEvo,
  hasElements,
  isEgg,
  isEvo,
  isGen0,
  toAssetFullName,
} from "@workspace/evoverses/lib/asset/utils";
import { toTimestampSeconds } from "@workspace/evoverses/utils/numbers";
import { toTitleCase } from "@workspace/evoverses/utils/strings";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const GET = async (_req: NextRequest, context: { params: Promise<z.infer<typeof paramsSchema>> }) => {
  const result = paramsSchema.safeParse(await context.params);
  if (!result.success) {
    return NextResponse.json({ error: `Failed to generate the image: ${result.error.message}` }, { status: 500 });
  }
  const { tokenId } = result.data;

  const asset = await fetchSquidAsset(tokenId, { revalidate: 0 });
  const isEvoAsset = isEvo(asset);
  const hasElement = hasElements(asset);
  return NextResponse.json({
    name: toAssetFullName(asset),
    description: "EvoVerses Evo",
    image: `https://api.evoverses.com/metadata/evo/${asset.tokenId}/image.png`,
    attributes: [
      { trait_type: "Species", value: toTitleCase(asset.metadata.species) },
      { trait_type: "Generation", value: asset.metadata.generation, display_type: "number" },
      ...(
        hasElement ? [
          { trait_type: "Primary Type", value: toTitleCase(asset.metadata.primaryType) },
          { trait_type: "Secondary Type", value: toTitleCase(asset.metadata.secondaryType) },
        ] : []
      ),
      ...(
        isEvoAsset ? [
          { trait_type: "Chroma", value: toTitleCase(asset.metadata.chroma) },
          { trait_type: "Gender", value: toTitleCase(asset.metadata.gender) },
          {
            trait_type: "Breeds Remaining",
            value: isGen0(asset) ? 5 : 5 - asset.metadata.totalBreeds,
            max_value: 5,
          },
          {
            trait_type: "Last Breed Time",
            value: toTimestampSeconds(asset.metadata.lastBreedTime),
            display_type: "date",
          },
          {
            trait_type: "Hatched At",
            value: toTimestampSeconds(asset.metadata.hatchedAt),
            display_type: "date",
          },
          { trait_type: "Total Breeds", value: asset.metadata.totalBreeds, display_type: "number" },
          { trait_type: "Level", value: getLevelOfEvo(asset), display_type: "number" },
          { trait_type: "Nature", value: asset.metadata.nature },
          { trait_type: "Attack", value: asset.metadata.attack, max_value: 50 },
          { trait_type: "Defense", value: asset.metadata.defense, max_value: 50 },
          { trait_type: "Special", value: asset.metadata.special, max_value: 50 },
          { trait_type: "Resistance", value: asset.metadata.resistance, max_value: 50 },
          { trait_type: "Speed", value: asset.metadata.speed, max_value: 50 },
          { trait_type: "Size", value: asset.metadata.size, display_type: "boost_percentage" },
          { trait_type: "Created At", value: toTimestampSeconds(asset.metadata.createdAt), display_type: "date" },
          { trait_type: "Stage", value: isEvoAsset ? "Evo" : "Egg" },
        ] : isEgg(asset)
          ? [ { trait_type: "Treated", value: asset.metadata.treated ? "Yes" : "No" } ]
          : []
      ),
    ].filter(trait => trait && ![ undefined, "#undefined", Element.none, "None", NaN, null ].includes(trait.value)),
  });
};
