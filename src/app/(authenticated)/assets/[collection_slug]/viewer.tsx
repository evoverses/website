import { LimitSelect } from "@/app/(authenticated)/assets/[collection_slug]/limit-select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { getCollectionItems } from "@/lib/evoverses/metadata";
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

interface ViewerProps {
  contract: Contract,
  limit: number,
  offset: number,
  collection: "evo" | "egg",
}

export const Viewer = async ({ contract, limit, offset, collection }: ViewerProps) => {
  const data = await getCollectionItems(collection, limit, offset);
  const totalPages = Math.ceil(data.total / limit);
  const currentPage = Math.ceil(offset / limit) + 1;
  return (
    <div className="flex flex-col">
      <div className="flex max-h-fit space-x-2 justify-end pb-4">
        <div>
          <Pagination>
            <PaginationContent>
              <PaginationPrevious disabled={offset === 0} href={{ query: { limit: limit, offset: offset - limit } }} />
              {currentPage > 2 && (
                <>
                  <PaginationLink href={{ query: { limit: limit, offset: 0 } }}>1</PaginationLink>
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
                  >
                    {page}
                  </PaginationLink>
                ))}
              {currentPage < totalPages - 1 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationLink href={{ query: { limit: limit, offset: totalPages * limit - limit } }}>
                    {totalPages}
                  </PaginationLink>
                </>
              )}
              <PaginationNext
                disabled={currentPage === totalPages}
                href={{ query: { limit: limit, offset: offset + limit } }}
              />
            </PaginationContent>
          </Pagination>
        </div>
        <LimitSelect limit={limit} />
      </div>
      <div className="flex gap-2 flex-wrap justify-around w-full">
        {data.items.map(nft => (
          <Card key={nft.tokenId} className="flex flex-row w-[350px]">
            <Image
              src={`http${process.env.NODE_ENV === "development"
                ? "://localhost:3000"
                : "s://evoverses.com"}/api/images/evo/${nft.tokenId}`}
              alt={`${nft.species} #${nft.tokenId}`}
              width={512}
              height={725}
              unoptimized
              className="w-40 min-w-[160px]"
              // placeholder={getShimmer(512, 725)}
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
