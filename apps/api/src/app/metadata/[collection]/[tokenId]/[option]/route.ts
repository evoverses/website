import {
  metadataCollectionTokenIdOptionRouteParamsSchema as paramsSchema,
} from "@/app/metadata/[collection]/[tokenId]/[option]/schema";
import { evoCardImageResponse } from "@workspace/evoverses/components/evo-card-image-response";
import { fetchSquidAsset } from "@workspace/evoverses/lib/asset/actions";
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

export const GET = async (_req: NextRequest, context: { params: Promise<z.infer<typeof paramsSchema>> }) => {
  const result = paramsSchema.safeParse(await context.params);
  if (!result.success) {
    return new Response(`Failed to generate the image: ${result.error.message}`, { status: 500 });
  }
  const { tokenId } = result.data;
  try {
    const asset = await fetchSquidAsset(tokenId, { revalidate: 0 });
    const nunitoBold = await readFile(join(process.cwd(), "src", "assets", "nunito-bold.ttf"));
    return new ImageResponse(
      evoCardImageResponse(asset),
      {
        width: 512,
        height: 725,
        fonts: [ { name: "Nunito", data: nunitoBold, weight: 900, style: "normal" } ],
      },
    );
  } catch (e: unknown) {
    const error = e as Error;
    console.log(`${error.message}`);
    return new Response(`Failed to generate the image`, { status: 500 });
  }
};
