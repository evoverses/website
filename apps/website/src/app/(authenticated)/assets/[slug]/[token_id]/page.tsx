import { AssetHistory } from "@/app/(authenticated)/assets/[slug]/[token_id]/history";
import { SnowtraceLink } from "@/components/buttons/snowtrace-link-button";
import { BASE_URL } from "@/data/constants";
import { getCollectionItem } from "@/lib/evoverses/metadata";
import { getEvoHistory } from "@/lib/subsquid";
import { cn } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import Image from "next/image";
import { Suspense } from "react";

type NFTAttributeProps = {
  name: string
  value: string | number | null
  display?: string
  className?: string
}

const NFTAttribute = ({ name, value, display, className }: NFTAttributeProps) => {
  return (
    <Card className={cn("w-40", className)}>
      <CardHeader className="p-4">
        <CardTitle>{value ?? "None"}</CardTitle>
        <CardDescription>{name}</CardDescription>
      </CardHeader>
    </Card>
  );
};

const NftPage = async ({ params }: { params: Promise<Record<string, string>> }) => {
  const { slug: in_slug, token_id } = await params;
  const slug = in_slug === "egg" ? "evo" : "evo";
  const [ item, history ] = await Promise.all([
    getCollectionItem(slug as any, token_id),
    getEvoHistory(token_id),
  ]);
  const isEgg = "treated" in item;

  const nextBreed = isEgg ? "" : Date.now() - Date.parse(item.lastBreedTime) > 604_800_000
    ? "Ready"
    : Math.floor((
    Date.parse(item.lastBreedTime) + 604_800_000
  ) / 86_400_000) + " Days";

  const breedBaseCost = 250;
  const genBreedBaseCost = breedBaseCost * 2 ** item.generation;
  const breedCost = isEgg ? 0 : item.generation === 0 && item.totalBreeds >= 5 ? 2_500 : genBreedBaseCost
    + genBreedBaseCost
    * item.totalBreeds;
  return (
    <div className="py-4 px-2.5 sm:p-24 space-y-8">
      <section className="flex flex-col sm:flex-row items-center text-center">
        <div className="w-full pb-4 sm:pb-0">
          <h1>{isEgg && item.generation === 0 ? "Genesis" : item.species}{isEgg ? " Egg" : ""} #{item.tokenId}</h1>
          {isEgg ? (
            <h3>Gen {item.generation}</h3>
          ) : (
            <h3>Level {item.xp + 1} | Gen {item.generation}</h3>
          )}
          {history && (
            <h6 className="flex justify-center space-x-2">
              <span>Owner:</span>
              <SnowtraceLink bytes={history.owner} />
            </h6>
          )}
        </div>
        <Image
          src={`${BASE_URL}/api/images/${slug}/${token_id}`}
          alt={item.species} width={512} height={725} unoptimized className="w-60"
        />
      </section>
      {(
        !isEgg || item.generation > 0
      ) && (
        <section className="space-y-2">
          <h2>Attributes</h2>
          <div className="flex flex-wrap gap-4 pt-2 justify-around">
            <NFTAttribute name="Gender" value={isEgg ? "Unknown" : item.gender} />
            <NFTAttribute name="Nature" value={isEgg ? "Unknown" : item.nature} />
            <NFTAttribute name="Primary Type" value={item.types.primary} />
            <NFTAttribute name="Secondary Type" value={item.types.secondary} />
            <NFTAttribute name="Rarity" value={isEgg ? "Unknown" : item.rarity} />
            <NFTAttribute name="Chroma" value={isEgg ? "Unknown" : item.chroma} />
          </div>
        </section>
      )}
      {!isEgg && (
        <>
          <section className="space-y-2">
            <h2>Stats</h2>
            <div className="flex flex-wrap gap-4 pt-2 justify-around">
              <NFTAttribute name="Health" value={50} />
              <NFTAttribute name="Attack" value={item.attack} />
              <NFTAttribute name="Special" value={item.special} />
              <NFTAttribute name="Defense" value={item.defense} />
              <NFTAttribute name="Resistance" value={item.resistance} />
              <NFTAttribute name="Speed" value={item.speed} />
            </div>
          </section>
          <section className="space-y-2">
            <h2>Breeding</h2>
            <div className="flex flex-wrap gap-4 pt-2 justify-around">
              <NFTAttribute
                name="Last Breed Time"
                value={new Date(Date.parse(item.lastBreedTime)).toLocaleString()}
                className="w-full max-w-[336px]"
              />
              <NFTAttribute name="Total Breeds" value={`${item.totalBreeds} / ${item.generation === 0 ? "∞" : 5}`} />
              <NFTAttribute name="Next Breed Status" value={nextBreed} />
              <NFTAttribute name="Next Breed Cost" value={breedCost.toLocaleString()} />
              <NFTAttribute name="Breed Cooldown" value={Math.max(7 - item.generation, 1) + " Days"} />
            </div>
          </section>
        </>

      )}
      <section className="space-y-4">
        <h2>History</h2>
        <Suspense fallback={<div>Loading...</div>}>
          <AssetHistory slug={slug} tokenId={token_id} />
        </Suspense>
      </section>
    </div>
  );
};

export default NftPage;
