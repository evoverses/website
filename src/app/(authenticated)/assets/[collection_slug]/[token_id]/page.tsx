import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCollection, getNft, getNftEvents, OpenSeaAPI } from "@/lib/opensea";
import Image from "next/image";
import Identifier = OpenSeaAPI.NFTs.Identifier;
import Trait = OpenSeaAPI.NFTs.Trait;

const NFTAttribute = ({ trait }: { trait: Trait }) => {
  return (
    <Card className="w-40">
      <CardHeader className="p-4">
        <CardTitle>{trait.value}</CardTitle>
        <CardDescription>{trait.trait_type}</CardDescription>
      </CardHeader>
    </Card>
  );
};

const NftPage = async ({ params: { collection_slug, token_id } }: { params: Record<string, string> }) => {
  const collectionSlug = `evoverses-${collection_slug}`;
  const collection = await getCollection(collectionSlug);
  const contract = collection.contracts[0];
  const [ { nft }, { asset_events } ] = await Promise.all([
    getNft(contract.address, contract.chain, token_id as Identifier),
    getNftEvents(contract.address, contract.chain, token_id as Identifier, [ "all" ]),
  ]);

  return (
    <div className="py-24 px-4 sm:px-24 space-y-8">
      <section className="flex flex-col sm:flex-row items-center text-center">
        <div className="w-full">
          <h1>{nft.name}</h1>
        </div>
        <Image src={nft.image_url} alt={nft.name} width={472} height={684} unoptimized className="w-60" />
      </section>
      <section>
        <h2>Attributes</h2>
        <div className="flex flex-wrap gap-4 pt-2 justify-around">
          {nft.traits.map(trait => (
            <NFTAttribute key={trait.trait_type} trait={trait} />
          ))}
        </div>
      </section>
      <section>
        <h2>Events</h2>
        <div className="flex flex-col">
          {asset_events.map((event, i) => (
            <div key={i}>
              {event.event_type}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default NftPage;
