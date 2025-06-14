import { AssetActivity } from "@/app/assets/[slug]/[token_id]/asset-activity";
import { AssetAttributes } from "@/app/assets/[slug]/[token_id]/asset-attributes";
import { AssetBreeding } from "@/app/assets/[slug]/[token_id]/asset-breeding";
import { AssetDetails } from "@/app/assets/[slug]/[token_id]/asset-details";
import { AssetImage } from "@/app/assets/[slug]/[token_id]/asset-image";
import { AssetMarketplaceCard } from "@/app/assets/[slug]/[token_id]/asset-marketplace-card";
import { AssetStats } from "@/app/assets/[slug]/[token_id]/asset-stats";
import { Accordion } from "@workspace/ui/components/accordion";
import { notFound } from "next/navigation";
import { z } from "zod";

const typeSchema = z.enum([ "evo", "egg" ]);
const paramSchema = z.object({ slug: typeSchema, token_id: z.coerce.number().gt(0) })
  .transform(params => (
    { type: params.slug, tokenId: params.token_id.toString() }
  ));

const NftPage = async (props: { params: Promise<{ slug: "evo" | "egg", token_id: string }> }) => {
  const { type, tokenId } = paramSchema.parse(await props.params);

  if (!typeSchema.options.includes(type)) {
    notFound();
  }

  return (
    <div className="@5xl:grid @5xl:grid-cols-5 @5xl:items-start @5xl:h-full @8xl:grid-cols-2 @8xl:max-w-379 @8xl:mx-auto @8xl:w-full gap-8 page-container px-8">
      <div className="@5xl:sticky @5xl:top-23 w-full inset-0 @5xl:col-span-2 @8xl:col-span-1">
        <div className="relative aspect-card w-full mt-4 @5xl:mt-0 @8xl:mt-6">
          <AssetImage tokenId={tokenId} />
        </div>
      </div>
      <div className="flex flex-col gap-6 w-full @5xl:col-span-3 @8xl:col-span-1">
        <AssetDetails tokenId={tokenId} />
        <AssetMarketplaceCard tokenId={tokenId} />
        <Accordion
          type="multiple"
          defaultValue={[ "attributes", "stats", "breeding", "activity" ]}
        >
          <AssetAttributes tokenId={tokenId} />
          <AssetStats tokenId={tokenId} />
          <AssetBreeding tokenId={tokenId} />
          <AssetActivity tokenId={tokenId} />
        </Accordion>
      </div>
    </div>
  );
};

export default NftPage;
