import { getAllNFTs } from "@/app/(authenticated)/assets/[collection_slug]/fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OpenSeaAPI } from "@/lib/opensea";
import Image from "next/image";
import Link from "next/link";
import Contract = OpenSeaAPI.NFTs.Contract;

export const ViewerLoading = () => {
  return (
    <div className="flex gap-2 flex-wrap justify-around  w-full">
      {[ 1, 2, 3, 4 ].map(id => (
        <Card key={id} className="flex flex-row w-[350px]">
          <Skeleton className="w-full max-w-[160px] h-[231.86px]" />
          <div className="flex flex-col w-full">
            <CardHeader className="pr-2">
              <Skeleton className="w-32 h-5" />
            </CardHeader>
            <CardContent className="flex-grow">
            </CardContent>
            <CardFooter>
              <Skeleton className="w-full h-9" />
            </CardFooter>
          </div>
        </Card>
      ))}
    </div>
  );
};

export const Viewer = async ({ contract }: { contract: Contract }) => {

  const nfts = await getAllNFTs(contract.collection);
  /// console.log( collectionSlug, nfts)
  console.log(nfts.length, contract);
  return (
    <div className="flex gap-2 flex-wrap justify-around  w-full">
      {nfts.map(nft => (
        <Card key={nft.identifier} className="flex flex-row w-[350px]">
          <Image src={nft.image_url} alt={nft.identifier} width={472} height={684} unoptimized className="w-40" />
          <div className="flex flex-col w-full">
            <CardHeader className="pr-2">
              <CardTitle className="text-sm">{nft.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
            </CardContent>
            <CardFooter>
              <Link href={`/assets/${contract.collection.replace("evoverses-", "")}/${nft.identifier}`} legacyBehavior>
                <Button className="w-full font-bold">
                  Details
                </Button>
              </Link>
            </CardFooter>
          </div>
        </Card>
      ))}
    </div>
  );
};
