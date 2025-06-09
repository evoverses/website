"use client";
import { BuyNowDrawer } from "@/components/drawers/buy-now-drawer";
import { CancelListingDrawer } from "@/components/drawers/cancel-listing-drawer";
import { EditListingDrawer } from "@/components/drawers/edit-listing-drawer";
import { ListForSaleDrawer } from "@/components/drawers/list-for-sale-drawer";
import { MakeAnOfferDrawer } from "@/components/drawers/make-an-offer-drawer";
import { TransferDrawer } from "@/components/drawers/transfer-drawer";
import { useEvo } from "@/hooks/use-evo";
import { useEvoPrice } from "@/hooks/use-token-price";
import { useConnectedWalletAddresses } from "@/lib/thirdweb/hooks/use-profiles";
import { cn } from "@/lib/utils";
import { formatUsd, toDate } from "@/utils/numbers";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Fragment } from "react";
import TimeAgo from "react-timeago";
import { useActiveAccount } from "thirdweb/react";
import { formatEther, formatUnits } from "viem";

const AssetMarketplaceCard = ({ tokenId }: { tokenId: string }) => {

  const { data, isFetching, isPlaceholderData, isLoading } = useEvo(tokenId);
  const account = useActiveAccount();
  const addresses = useConnectedWalletAddresses();
  const currencyPrice = useEvoPrice();
  if (isFetching || isLoading || isPlaceholderData) {
    return (
      <div className="max-w-full">
        <div className="flex gap-2">
          <Button variant="secondary" className="pointer-events-none animate-pulse flex-1">
            Make offer
          </Button>
        </div>
      </div>
    );
  }
  if (!data) {
    throw new Error("No data");
  }

  const listing = data.listings.find(l => Date.parse(l.endAt) > Date.now());
  const isOwner = data.owner.toLowerCase() === account?.address?.toLowerCase();
  return (
    <div className="max-w-full space-y-2">
      {listing && (
        <Fragment>
          <span className="text-xs text-muted-foreground uppercase">
            {isOwner ? "Listed" : "Buy For"}
          </span>
          <div className="flex gap-2 font-mono text-3xl font-semibold items-end">
            <span>
              {Number(Number(formatUnits(BigInt(listing.pricePerToken), 18)).toFixed(0))}
            </span>
            <span>EVO</span>
            <span className="text-sm text-muted-foreground pb-1">
              ({formatUsd(Number(formatEther(BigInt(listing.pricePerToken))) * currencyPrice)})
            </span>
            <Badge variant="secondary" className="mb-1 uppercase">
              <TimeAgo
                date={toDate(listing.endAt)}
                formatter={(v, u, s) => s === "ago" ? `` : `Ending in ${v} ${u}${v === 1 ? "" : "s"}`}
              />
            </Badge>
          </div>
        </Fragment>
      )}
      <div className="flex gap-2">
        {listing ?
          isOwner ? (
            <Fragment>
              <EditListingDrawer asset={data}>
                <Button className="flex-1 cursor-pointer">Edit Listing</Button>
              </EditListingDrawer>
              <CancelListingDrawer asset={data}>
                <Button variant="secondary" className="cursor-pointer">Cancel Listing</Button>
              </CancelListingDrawer>
            </Fragment>
          ) : (
            <BuyNowDrawer asset={data}>
              <Button className="flex-1 cursor-pointer">Buy now</Button>
            </BuyNowDrawer>
          ) : isOwner && (
          <ListForSaleDrawer asset={data}>
            <Button className="flex-1 cursor-pointer">List for sale</Button>
          </ListForSaleDrawer>
        )}
        {isOwner ? (
          <TransferDrawer asset={data}>
            <Button variant="secondary" className="cursor-pointer">Send</Button>
          </TransferDrawer>
        ) : (
          <MakeAnOfferDrawer asset={data}>
            <Button variant="secondary" className={cn("cursor-pointer", { "flex-1": !listing })}>
              Make an offer
            </Button>
          </MakeAnOfferDrawer>
        )}
      </div>
    </div>

  );
};
AssetMarketplaceCard.displayName = "AssetMarketplaceCard";

export { AssetMarketplaceCard };
