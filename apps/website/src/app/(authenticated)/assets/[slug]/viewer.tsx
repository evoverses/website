import { LimitSelect } from "@/app/(authenticated)/assets/[slug]/limit-select";
import { SortOption, SortOrder } from "@/app/(authenticated)/profile/assets/viewer-components";
import { evoNftContract } from "@/data/contracts";
import { getCollectionItems } from "@/lib/evoverses/metadata";
import { getShimmer } from "@/lib/evoverses/svgs";
import { cn } from "@/lib/utils";
import { Slug } from "@/types/core";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Icons } from "@workspace/ui/components/icons";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination";
import { Skeleton } from "@workspace/ui/components/skeleton";
import type { Address } from "abitype";
import Image from "next/image";
import Link from "next/link";
import { SiOpensea } from "react-icons/si";

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
  owner?: Address;
}

export const Viewer = async ({ slug, limit, offset, sort, order, owner }: ViewerProps) => {
  const data = await getCollectionItems(slug, limit, offset, owner);
  const totalPages = Math.ceil(data.total / limit);
  const currentPage = Math.ceil(offset / limit) + 1;

  //if (sort === "id") {
  //  order === "asc"
  //    ? nfts.sort((a, b) => Number(a.tokenId) - Number(b.tokenId))
  //    : nfts.sort((a, b) => Number(b.tokenId) - Number(a.tokenId));
  //} else if (sort === "species") {
  //  order === "asc"
  //    ? nfts.sort((a, b) => a.species.localeCompare(b.species))
  //    : nfts.sort((a, b) => b.species.localeCompare(a.species));
  //} else if (sort === "rarity") {
//
  //} else if (sort === "level") {
//
  //} else if (sort === "gender") {
//
  //} else if (sort === "stats") {
//
  //}

  return (
    <div className="flex flex-col">
      <div className="flex max-h-fit space-x-2 justify-end pb-4">
        <div>
          <Pagination className={cn({ hidden: totalPages === 0 })}>
            <PaginationContent>
              <PaginationPrevious
                disabled={offset === 0}
                href={{ query: { limit: limit, offset: offset - limit } }}
                prefetch={false}
              />
              {currentPage > 2 && (
                <>
                  <PaginationLink href={{ query: { limit: limit, offset: 0 } }} prefetch={false}>1</PaginationLink>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                </>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(i => currentPage === 1 ? i < 4 : currentPage === totalPages ? i > totalPages - 2 : i
                  >= currentPage
                  - 1
                  && i
                  <= currentPage
                  + 1)
                .map(page => (
                  <PaginationLink
                    key={page}
                    isActive={page === currentPage}
                    href={{ query: { limit: limit, offset: page * limit - limit } }}
                    prefetch={false}
                  >
                    {page}
                  </PaginationLink>
                ))}
              {totalPages > 5 && currentPage < totalPages - 1 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationLink
                    href={{ query: { limit: limit, offset: totalPages * limit - limit } }}
                    prefetch={false}
                  >
                    {totalPages}
                  </PaginationLink>
                </>
              )}
              <PaginationNext
                disabled={currentPage === totalPages}
                href={{ query: { limit: limit, offset: offset + limit } }}
                prefetch={false}
              />
            </PaginationContent>
          </Pagination>
        </div>
        <LimitSelect limit={limit} />
      </div>
      <div className="flex gap-2 flex-wrap justify-around w-full">
        {data.items.map(nft => (
          <Card key={nft.tokenId + limit + offset} className="flex flex-row w-[350px]">
            <Image
              key={nft.tokenId + limit + offset}
              src={`/api/images/evo/${nft.tokenId}`}
              alt={`${nft.species} #${nft.tokenId}`}
              width={512}
              height={725}
              className="w-40 min-w-[160px]"
              placeholder={getShimmer(512, 725)}
            />
            <div className="flex flex-col w-full">
              <CardHeader className="pr-2">
                <CardTitle className="text-sm">{nft.species} #{nft.tokenId.toString()}</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                {owner ? (
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
                  href={`/assets/${slug}/${nft.tokenId.toString()}`}
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
