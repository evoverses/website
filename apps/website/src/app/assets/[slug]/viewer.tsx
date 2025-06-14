"use client";

import { SortOption, SortOrder } from "@/app/profile/assets/viewer-components";
import { evoNftContract } from "@/data/contracts";
import { useConnectedWallets } from "@/hooks/use-connected-wallets";
import { fetchSquidAssets } from "@/lib/evo/fetch";
import { toAssetFullName } from "@/lib/evo/utils";
import { getShimmer } from "@/lib/evoverses/svgs";
import { Slug } from "@/types/core";
import { staleTimeMinutes } from "@/utils/numbers";
import { formatNumberWithSuffix } from "@workspace/evoverses/utils/numbers";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Icons } from "@workspace/ui/components/icons";
import { Skeleton } from "@workspace/ui/components/skeleton";
import type { Address } from "abitype";
import Image from "next/image";
import Link from "next/link";
import { SiOpensea } from "react-icons/si";
import { formatEther } from "viem";

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

interface ViewerProps {
  slug: Slug;
  limit: number;
  offset: number;
  sort?: SortOption;
  order?: SortOrder;
  owners?: Address[];
}

export const Viewer = ({ slug, limit, offset, sort, order }: ViewerProps) => {
  const wallets = useConnectedWallets();
  const owners = wallets.map(w => w.getAccount()?.address as Address).filter(Boolean);
  const { data = { items: [], total: 0 } } = useQuery({
    queryKey: [ "collection-evos", slug, limit, offset, sort, order, owners ],
    queryFn: () => fetchSquidAssets({ owners }),
    placeholderData: { items: [], nextPage: null, total: 0 },
    enabled: owners && owners.length > 0,
    staleTime: staleTimeMinutes(5),
  });

  return (
    <div className="flex flex-col">
      <div className="flex gap-2 flex-wrap justify-around w-full">
        {data.items.map(nft => (
          <Card key={nft.tokenId} className="flex-row w-[350px] p-0">
            <Image
              key={nft.tokenId + limit + offset}
              src={`/api/images/evo/${nft.tokenId}`}
              alt={`${nft.metadata.species} #${nft.tokenId}`}
              width={512}
              height={725}
              className="w-40 aspect-card min-w-[160px]"
              placeholder={getShimmer(512, 725)}
            />
            <div className="flex-1 flex flex-col">
              <CardHeader className="py-2 text-center">
                <CardTitle className="text-sm">{toAssetFullName(nft)}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                {nft.listings.length > 0 && (
                  <span>Price: {formatNumberWithSuffix(
                    formatEther(BigInt(nft.listings[0]!.pricePerToken)),
                    { postfix: "EVO" },
                  )}</span>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                {owners ? (
                  <Button className="w-full font-bold" asChild>
                    <Link
                      href={`https://opensea.io/assets/avalanche/${evoNftContract.address}/${nft.tokenId}`}
                      target="_blank"
                    >
                      <SiOpensea className="w-5 h-5 mr-2" />
                      <span>Sell</span>
                    </Link>
                  </Button>
                ) : (
                  <div className="flex w-full font-bold justify-between">
                    <Link
                      href={`https://joepegs.com/item/avalanche/0x4151b8afa10653d304fdac9a781afccd45ec164c/${nft.tokenId.toString()}`}
                      prefetch={false}
                      referrerPolicy="no-referrer"
                      target="_blank"
                    >
                      <Button className="px-2 bg-[#8473fe] hover:bg-[#423980]">
                        <Icons.joePegs className="w-6 h-6" />
                      </Button>
                    </Link>
                    <Link
                      href={`https://avax.hyperspace.xyz/collection/avax/evoverses?tokenAddress=0x4151b8afa10653d304fdac9a781afccd45ec164c_${nft.tokenId.toString()}`}
                      prefetch={false}
                      referrerPolicy="no-referrer"
                      target="_blank"
                    >
                      <Button className="px-2 text-white bg-slate-700 hover:bg-slate-800 ">
                        <Icons.hyperspace className="w-6 h-6" />
                      </Button>
                    </Link>
                    <Link
                      href={`https://opensea.io/assets/avalanche/0x4151b8afa10653d304fdac9a781afccd45ec164c/${nft.tokenId.toString()}`}
                      prefetch={false}
                      referrerPolicy="no-referrer"
                      target="_blank"
                    >
                      <Button className="px-2 bg-blue-600 hover:bg-blue-700">
                        <SiOpensea className="w-6 h-6" />
                      </Button>
                    </Link>
                  </div>
                )}
                <Link
                  href={`/apps/website/src/app/collections/${slug}/${nft.tokenId.toString()}`}
                  prefetch={false}
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
    </div>
  );
};
