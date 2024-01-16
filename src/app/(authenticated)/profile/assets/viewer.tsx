import { SortOption, SortOrder } from "@/app/(authenticated)/profile/assets/viewer-components";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getShimmer } from "@/lib/evoverses/svgs";
import { OpenSeaAPI } from "@/lib/opensea";
import Image from "next/image";
import Link from "next/link";
import { SiOpensea } from "react-icons/si";
import NFT = OpenSeaAPI.NFTs.NFT;

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

type ViewerProps = {
  nfts: NFT[]
  sort: SortOption
  order: SortOrder
}

export const Viewer = async ({ nfts, sort, order }: ViewerProps) => {
  if (sort === "id") {
    order === "asc"
      ? nfts.sort((a, b) => Number(a.identifier) - Number(b.identifier))
      : nfts.sort((a, b) => Number(b.identifier) - Number(a.identifier));
  } else if (sort === "species") {
    order === "asc"
      ? nfts.sort((a, b) => a.name.localeCompare(b.name))
      : nfts.sort((a, b) => b.name.localeCompare(a.name));
  } else if (sort === "rarity") {

  } else if (sort === "level") {

  } else if (sort === "gender") {

  } else if (sort === "stats") {

  }
  return (
    <div className="flex gap-2 flex-wrap justify-around  w-full">
      {nfts.map(nft => (
        <Card key={nft.identifier} className="flex flex-row w-[350px]">
          <Image
            src={process.env.NODE_ENV === "development" ? nft.image_url.replace(
              "https://evoverses.com",
              "http://localhost:3000",
            ) : nft.image_url}
            alt={nft.identifier}
            width={512}
            height={725}
            unoptimized
            className="w-40 min-w-[160px]"
            placeholder={getShimmer(512, 725)}
          />
          <div className="flex flex-col w-full">
            <CardHeader className="pr-2">
              <CardTitle className="text-sm">{nft.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button className="w-full font-bold" asChild>
                <Link href={`https://opensea.io/assets/avalanche/${nft.contract}/${nft.identifier}`} target="_blank">
                  <SiOpensea className="w-5 h-5 mr-2" />
                  <span>Sell</span>
                </Link>
              </Button>
              <Link
                href={`/assets/${nft.collection.replace("evoverses-", "")}/${nft.identifier}`}
                legacyBehavior
                prefetch={false}
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
