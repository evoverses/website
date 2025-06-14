import { EvoImage } from "@/components/images/evo-image";
import { useConnectedWalletAddresses } from "@/hooks/use-connected-wallets";
import { getActiveListing, getLastSale, toAssetFullName } from "@/lib/evo/utils";
import { SquidAsset } from "@/lib/squid/types";
import { useBoundedStore } from "@/store";
import { formatNumberWithSuffix } from "@workspace/evoverses/utils/numbers";
import { toAssetUrl } from "@/utils/url";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardFooter } from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { cn, cva } from "@workspace/ui/lib/utils";
import Link from "next/link";
import { type ComponentProps, type RefObject, useEffect, useState } from "react";
import { formatEther } from "viem";
import { BuyNowDrawer } from "../drawers/buy-now-drawer";
import { EditListingDrawer } from "../drawers/edit-listing-drawer";
import { ListForSaleDrawer } from "../drawers/list-for-sale-drawer";
import { MakeAnOfferDrawer } from "../drawers/make-an-offer-drawer";

const gridVariants = cva(
  "group/grid grid w-full grid-flow-row-dense gap-3 relative",
  {
    variants: {
      variant: {
        grid: " grid-cols-[repeat(auto-fill,minmax(177px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(172px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(178px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(186px,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(218px,1fr))]",
        "compact-grid": "grid-cols-[repeat(auto-fill,minmax(115px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(112px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(125px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(139px,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(148px,1fr))]",
        mosaic: "grid-cols-[repeat(auto-fill,minmax(177px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(172px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(178px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(186px,1fr))] 2xl:grid-cols-[repeat(auto-fill,minmax(218px,1fr))]",
      },
    },
    defaultVariants: {
      variant: "grid",
    },
  },
);
export const GridView = ({
  className,
  items,
  isLoading,
  isFetchingNextPage,
  bottomRef,
  showCollectionName,
  ...props
}: Omit<ComponentProps<"div">, "children"> & {
  items: SquidAsset[]
  isLoading?: boolean
  bottomRef?: RefObject<HTMLDivElement | null>
  isFetchingNextPage?: boolean;
  showCollectionName?: boolean;
}) => {
  const variant = useBoundedStore.use.layout();
  const owners = useConnectedWalletAddresses();
  const [ mounted, setMounted ] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (variant !== "grid" && variant !== "compact-grid" && variant !== "mosaic") {
    return null;
  }

  return (
    <div
      data-variant={variant || "grid"}
      className={gridVariants({ variant, className })}
      suppressHydrationWarning
      {...props}
    >
      {(
        isLoading || items.length === 0
      )
        ? Array.from({ length: 10 }).map((_, i) => (
          <GridViewSkeleton key={`skeleton-${i}`} noAnimate={!isLoading && items.length === 0} />
        ))
        : items.map((item, i) => {
          const isOwner = owners.map(o => o.toLowerCase()).includes(item.owner.toLowerCase());
          const soulbound = false;
          const disabled = false;
          const listing = getActiveListing(item);
          const lastSale = getLastSale(item);
          return (
            <div
              key={`${item.chainId}-${item.address}-${item.tokenId}-${i}`}
              className="group/asset relative rounded-xl overflow-hidden"
            >
              <Link
                href={toAssetUrl(item)}
                className="flex h-full flex-col"
              >
                <Card className="overflow-hidden p-0 gap-0 animate-y-fast group-hover/asset:animate-grow">
                  <div className="aspect-card relative">
                    <EvoImage asset={item} />
                  </div>
                  <CardContent
                    className={cn(
                      "flex flex-col justify-center gap-1 h-12 p-0 px-3",
                      { "hidden": variant === "mosaic" },
                    )}
                  >
                    <div className="flex items-center justify-between text-sm font-semibold break-all min-w-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="truncate">{toAssetFullName(item)}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span className="truncate">{toAssetFullName(item)}</span>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {showCollectionName && (
                      <div className="text-xs truncate">
                        Evos
                      </div>
                    )}
                  </CardContent>
                  <CardFooter
                    className={cn(
                      "flex flex-col items-start justify-center gap-1 px-3 h-12 pb-3.5",
                      { "hidden": variant === "mosaic" },
                    )}
                  >
                    {soulbound
                      ? (
                        <span className="text-sm text-muted-foreground">Soulbound</span>
                      )
                      : disabled
                        ? (
                          <span className="text-sm text-muted-foreground">Disabled</span>
                        )
                        : listing
                          ? (
                            <div className="flex gap-1 font-mono text-sm">
                              <span>{formatEther(BigInt(listing.pricePerToken))}</span>
                              <span className="text-muted-foreground">EVO</span>
                            </div>
                          )
                          : (
                            <span className="text-sm text-muted-foreground">Not Listed</span>
                          )}
                    {(
                      !soulbound && !disabled && lastSale
                    ) && (
                      <div className="flex gap-1 text-xs text-muted-foreground">
                        <span>Last sale</span>
                        <span className="font-mono">
                          {formatEther(BigInt(lastSale.totalPrice))} EVO
                        </span>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              </Link>
              {(
                !soulbound && !disabled
              )
                ? isOwner
                  ? listing && owners.map(o => o.toLowerCase()).includes(listing.creator.toLowerCase())
                    ? (
                      <EditListingDrawer asset={item}>
                        <ActionButton>Edit Listing</ActionButton>
                      </EditListingDrawer>
                    )
                    : (
                      <ListForSaleDrawer asset={item}>
                        <ActionButton>List Item</ActionButton>
                      </ListForSaleDrawer>
                    )
                  : listing
                    ? (
                      <BuyNowDrawer asset={item}>
                        <ActionButton className="justify-between">
                          <span>Buy Now</span>
                          <span>
                            {formatNumberWithSuffix(formatEther(BigInt(listing.pricePerToken)), { postfix: "EVO" })}
                          </span>
                        </ActionButton>
                      </BuyNowDrawer>
                    )
                    : (
                      <MakeAnOfferDrawer asset={item}>
                        <ActionButton>Make an Offer</ActionButton>
                      </MakeAnOfferDrawer>
                    )
                : null}
            </div>
          );
        })}
      {isFetchingNextPage && Array.from({ length: 10 }).map((_, i) => (
        <GridViewSkeleton key={`skeleton-more-${i}`} />
      ))}
      {bottomRef && (
        <div ref={bottomRef} className="flex justify-center w-full" />
      )}
      <div
        className={cn(
          "absolute flex inset-0 items-center justify-center bg-gradient-to-b from-transparent to-background",
          { "hidden": items.length > 0 || isLoading || !mounted },
        )}
      >
        <span className="font-semibold text-3xl">No items found</span>
      </div>
    </div>
  );
};

const ActionButton = ({ className, ...props }: ComponentProps<typeof Button>) => (
  <Button
    className={cn(
      "flex absolute bottom-0 h-0 p-0 opacity-0 group-hover/asset:opacity-100 group-hover/asset:h-12 transition-[height] rounded-t-none rounded-b-xl duration-150 ease-linear w-full font-medium cursor-pointer group-hover/asset:animate-grow px-2",
      className,
    )}
    {...props}
  />
);

const GridViewSkeleton = ({ noAnimate }: { noAnimate?: boolean }) => {
  return (
    <Card
      data-no-animate={noAnimate ? "true" : "false"}
      className="group overflow-hidden p-0 gap-0"
      suppressHydrationWarning
    >
      <Skeleton className="aspect-[1.5015/1] group-data-[no-animate=true]:animate-none" />
      <CardContent className="flex h-12 p-0 px-3 items-center group-data-[variant=mosaic]/grid:hidden">
        <Skeleton className="w-full h-3.5 group-data-[no-animate=true]:animate-none" />
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-1 px-3 pb-3.5 group-data-[variant=mosaic]/grid:hidden">
        <Skeleton className="w-1/2 h-3.5 group-data-[no-animate=true]:animate-none" />
        <Skeleton className="w-1/4 h-3.5 group-data-[no-animate=true]:animate-none" />
      </CardFooter>
    </Card>
  );
};
