"use client";
import { EvoImage } from "@/components/images/evo-image";
import { marketplaceContract } from "@/data/contracts";
import { useChain } from "@/hooks/use-chain";
import { useEvoPrice } from "@/hooks/use-token-price";
import { toAssetFullName } from "@/lib/evo/utils";
import { SquidAsset } from "@/lib/squid/types";
import { formatNumberWithSuffix, formatUsd } from "@/utils/numbers";
import { toAssetUrl } from "@/utils/url";
import { Button } from "@workspace/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer";
import { Separator } from "@workspace/ui/components/separator";
import { toast } from "@workspace/ui/components/sonner";
import Link from "next/link";
import { type ReactNode, useCallback, useState } from "react";
import { cancelListing } from "thirdweb/extensions/marketplace";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { formatEther } from "viem";

const CancelListingDrawer = ({ asset, children }: { asset: SquidAsset, children?: ReactNode }) => {
  const listing = asset.listings[0];
  const [ success, setSuccess ] = useState<boolean>(false);
  const account = useActiveAccount();
  const { switchChainIfNeeded } = useChain();
  const currencyPrice = useEvoPrice();

  const prepareTransaction = useCallback(async () => {
    if (!account) {
      throw new Error("No account detected");
    }

    if (!listing) {
      throw new Error("No listing detected");
    }

    await switchChainIfNeeded(asset.chainId);

    return cancelListing({
      contract: marketplaceContract,
      listingId: BigInt(listing.listingId),
    });
  }, [ account, asset, listing, switchChainIfNeeded ]);

  const handleOnOpenChange = (open: boolean) => {
    if (success && !open) {
      window.location.reload();
    }
  };

  return (
    <Drawer onOpenChange={handleOnOpenChange}>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="flex flex-col items-center pb-6" disableThumb>
        {success ? (
          <div className="flex flex-col gap-6 items-center px-6">
            <div className="relative size-45 aspect-card sm:size-90 bg-secondary rounded-xl overflow-hidden">
              <EvoImage asset={asset} className="grayscale" />
            </div>
            <h2 className="font-semibold text-xl sm:text-4xl text-center">Listing successfully cancelled</h2>
            <Button variant="secondary" asChild>
              <Link href={toAssetUrl(asset)}>
                View Item Page
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-6xl px-4">
            <DrawerHeader className="p-0 pt-2">
              <DrawerTitle>Cancel Listing</DrawerTitle>
            </DrawerHeader>
            <div className="flex justify-between">
              <div className="flex flex-col gap-5">
                <span className="font-mono text-sm uppercase text-muted-foreground">1 Listing</span>
                <div className="flex gap-3 items-center">
                  <div className="relative size-12 aspect-card bg-secondary rounded-md overflow-hidden">
                    <EvoImage asset={asset} />
                  </div>
                  <div className="flex flex-col justify-center gap-2">
                    <span className="text-sm font-medium">{toAssetFullName(asset)}</span>
                    <span className="text-muted-foreground">Evo</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-5">
                <span className="font-mono text-sm uppercase text-muted-foreground">Listing Price</span>
                {listing && (
                  <div className="flex flex-col justify-center gap-2 h-12 text-right font-mono text-sm">
                    <span className="font-medium">
                      {formatNumberWithSuffix(formatEther(BigInt(listing.pricePerToken)), {
                        postfix: "EVO",
                        maxDecimals: 4,
                      })}
                    </span>
                    <span className="text-muted-foreground">
                      {formatUsd(Number(formatEther(BigInt(listing.pricePerToken))) * currencyPrice)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <Separator />
            <DrawerFooter className="px-0 pt-0 justify-end md:flex-row gap-4">
              <Button asChild variant="destructive">
                <TransactionButton
                  disabled={!account}
                  unstyled
                  transaction={() => prepareTransaction()}
                  onError={e => toast.error(e.message)}
                  onTransactionConfirmed={() => {
                    setSuccess(true);
                  }}
                >
                  Cancel Listing
                </TransactionButton>
              </Button>
            </DrawerFooter>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
CancelListingDrawer.displayName = "CancelListingDrawer";
export { CancelListingDrawer };
