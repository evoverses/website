import { AssetHistory, SnowtraceLink } from "@/app/(authenticated)/assets/[collection_slug]/[token_id]/history";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCollectionItem } from "@/lib/evoverses/metadata";
import { getEvoHistory } from "@/lib/subsquid";
import { cn } from "@/lib/utils";
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

const NftPage = async ({ params: { collection_slug, token_id } }: { params: Record<string, string> }) => {

  const [ item, history ] = await Promise.all([
    getCollectionItem(collection_slug as any, token_id),
    getEvoHistory(token_id),
  ]);
  const egg = "treated" in item;

  const nextBreed = Date.now() - Date.parse(item.lastBreedTime) > 604_800_000
    ? "Ready"
    : Math.floor((
    Date.parse(item.lastBreedTime) + 604_800_000
  ) / 86_400_000) + " Days";

  const breedBaseCost = 250;
  const genBreedBaseCost = breedBaseCost * 2 ** item.generation;
  const breedCost = item.generation === 0 && item.totalBreeds >= 5 ? 2_500 : genBreedBaseCost
    + genBreedBaseCost
    * item.totalBreeds;
  return (
    <div className="py-4 px-2.5 sm:p-24 space-y-8">
      <section className="flex flex-col sm:flex-row items-center text-center">
        <div className="w-full pb-4 sm:pb-0">
          <h1>{egg && item.generation === 0 ? "Genesis" : item.species}{egg ? " Egg" : ""} #{item.tokenId}</h1>
          {egg ? (
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
          src={`https://evoverses.com/api/images/${collection_slug}/${token_id}`}
          alt={item.species} width={512} height={725} unoptimized className="w-60"
        />
      </section>
      {(
        !egg || item.generation > 0
      ) && (
        <section className="space-y-2">
          <h2>Attributes</h2>
          <div className="flex flex-wrap gap-4 pt-2 justify-around">
            <NFTAttribute name="Gender" value={egg ? "Unknown" : item.gender} />
            <NFTAttribute name="Nature" value={egg ? "Unknown" : item.nature} />
            <NFTAttribute name="Primary Type" value={item.types.primary} />
            <NFTAttribute name="Secondary Type" value={item.types.secondary} />
            <NFTAttribute name="Rarity" value={egg ? "Unknown" : item.rarity} />
            <NFTAttribute name="Chroma" value={egg ? "Unknown" : item.chroma} />
          </div>
        </section>
      )}
      {!egg && (
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
          <AssetHistory slug={collection_slug} tokenId={token_id} />
        </Suspense>
      </section>
    </div>
  );
};

export default NftPage;
