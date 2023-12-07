import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OpenSeaAPI } from "@/lib/opensea";
import { getEvos } from "@/lib/prisma/server";
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
  const evos = await getEvos();
  return (
    <div className="flex gap-2 flex-wrap justify-around  w-full">
      {evos.map(nft => (
        <Card key={nft.tokenId} className="flex flex-row w-[350px]">
          <Image
            src={`https://evoverses.com/api/images/evo/${nft.tokenId.toString()}`}
            alt={`${nft.species} #${nft.tokenId.toString()}`}
            width={472}
            height={684}
            unoptimized className="w-40"
          />
          <div className="flex flex-col w-full">
            <CardHeader className="pr-2">
              <CardTitle className="text-sm">{nft.species} #{nft.tokenId.toString()}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
            </CardContent>
            <CardFooter>
              <Link
                href={`/assets/${contract.collection.replace("evoverses-", "")}/${nft.tokenId.toString()}`}
                legacyBehavior
              >
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
