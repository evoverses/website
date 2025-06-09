"use client";
import { Confetti } from "@/components/confetti";
import { EvoImage } from "@/components/images/evo-image";
import { evoContract, marketplaceContract } from "@/data/contracts";
import { useChain } from "@/hooks/use-chain";
import { useEvoPrice } from "@/hooks/use-token-price";
import { toAssetFullName } from "@/lib/evo/utils";
import type { SquidAsset } from "@/lib/squid/types";
import { shortenAddress } from "@/utils/strings";
import { toAccountUrl, toBlockExplorerTxUrl } from "@/utils/url";
import { Badge } from "@workspace/ui/components/badge";
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
import { AlertCircleIcon } from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode, useCallback, useState } from "react";
import { allowance, approve } from "thirdweb/extensions/erc20";
import { buyFromListing } from "thirdweb/extensions/marketplace";
import {
  TransactionButton,
  useActiveAccount,
  useSendAndConfirmTransaction,
  WalletIcon,
  WalletName,
  WalletProvider,
} from "thirdweb/react";
import { formatEther } from "viem";

const BuyNowDrawer = ({ asset, children }: {
  asset: SquidAsset,
  children?: ReactNode
}) => {
  const listing = asset.listings[0];
  const [ success, setSuccess ] = useState<boolean>(false);
  const account = useActiveAccount();
  const { switchChainIfNeeded } = useChain();
  const { mutateAsync, data: txHash } = useSendAndConfirmTransaction();

  const currencyPrice = useEvoPrice();

  const prepareTransaction = useCallback(async () => {
    if (!account) {
      throw new Error("No account detected");
    }

    if (!listing) {
      throw new Error("No listing detected");
    }

    await switchChainIfNeeded(asset.chainId);

    const allowanceWei = await allowance({
      contract: evoContract,
      owner: account.address,
      spender: marketplaceContract.address,
    });

    if (BigInt(listing.pricePerToken) > allowanceWei) {
      await mutateAsync(approve({
        contract: evoContract,
        spender: marketplaceContract.address,
        amountWei: BigInt(listing.pricePerToken),
      }));
    }

    return buyFromListing({
      contract: marketplaceContract,
      listingId: BigInt(listing.listingId),
      quantity: 1n,
      recipient: account.address,
    });
  }, [ account, asset, switchChainIfNeeded, listing, mutateAsync ]);

  const handleOnOpenChange = async (open: boolean) => {
    if (success && !open) {
      window.location.reload();
    }
    if (!open) {
      setSuccess(false);
    }
    if (open) {
      setTimeout(() => {
        const button = document.getElementById("buy-now-drawer-tx-button") as HTMLButtonElement;
        if (button) {
          button.click();
        }
      }, 500);
    }
  };

  if (!listing) {
    return null;
  }
  return (
    <Fragment>
      {success && <Confetti />}
      <Drawer onOpenChange={handleOnOpenChange}>
        <DrawerTrigger asChild>
          {children}
        </DrawerTrigger>
        <DrawerContent className="flex flex-col items-center pb-6" disableThumb>
          {success ? (
            <div className="flex flex-col gap-6 items-center px-6">
              <div className="relative size-45 aspect-card sm:size-90 bg-secondary rounded-xl overflow-hidden">
                <EvoImage asset={asset} />
              </div>
              <h2 className="font-semibold text-xl sm:text-4xl text-center">Congrats! You got it!</h2>
              <div className="flex gap-4">
                <Button variant="secondary" asChild>
                  <Link href={toBlockExplorerTxUrl(txHash?.transactionHash, { chainId: asset.chainId })}>
                    View Receipt
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href={toAccountUrl(account?.address)}>
                    View on Profile
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <Fragment>
              <DrawerHeader className="max-w-6xl w-full">
                <DrawerTitle>Checkout</DrawerTitle>
              </DrawerHeader>
              <DrawerFooter className="w-full max-w-6xl md:flex-row pt-2 items-stretch gap-2 md:gap-10">
                <div className="flex flex-col gap-3 flex-1">
                  <span className="text-xs uppercase text-muted-foreground">Items</span>
                  <div className="flex gap-3">
                    <div className="relative size-12 aspect-card bg-secondary rounded-md">
                      <EvoImage asset={asset} />
                    </div>
                    <div className="flex flex-col justify-center gap-2 text-sm font-semibold">
                      <span>{toAssetFullName(asset)}</span>
                      <span>Evo</span>
                    </div>
                    <div className="flex flex-col justify-center gap-2 text-right font-semibold font-mono text-sm pl-4 ml-auto">
                      <span>{formatEther(BigInt(listing.pricePerToken))} EVO</span>
                      <span>-</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span>Total</span>
                    <div className="flex flex-col justify-center gap-2 text-right font-semibold font-mono text-sm">
                      <span>{formatEther(BigInt(listing.pricePerToken))} EVO</span>
                      <span>-</span>
                    </div>
                  </div>
                </div>
                <div className="w-px bg-border" />
                <div className="flex flex-col gap-6 flex-1">
                  <span className="text-xs uppercase text-muted-foreground">Payment</span>
                  <div className="bg-secondary/50 p-4 flex gap-4 items-center rounded-md text-sm">
                    <WalletProvider id="io.metamask">
                      <WalletIcon className="size-6 rounded-md" />
                      <WalletName />
                      <span>{shortenAddress(account?.address || "")}</span>
                    </WalletProvider>
                  </div>
                  <Button variant="secondary" className="w-fit">Change Payment Method</Button>
                  <Separator />
                  <div className="flex gap-4 items-center text-sm font-semibold">
                    <div className="relative size-6 aspect-card bg-secondary rounded-md">
                      <EvoImage asset={asset} />
                    </div>
                    <span>Buy Item</span>
                    <Badge className="bg-green-800 text-green-400 ml-auto">
                      <AlertCircleIcon className="size-4" />
                      <span>Confirm In Wallet</span>
                    </Badge>
                  </div>
                </div>
              </DrawerFooter>
              <Button asChild id="buy-now-drawer-tx-button" className="hidden">
                <TransactionButton
                  unstyled
                  transaction={() => prepareTransaction()}
                  onError={e => toast.error(e.message)}
                  onTransactionConfirmed={() => {
                    setSuccess(true);
                  }}
                >
                  Retry
                </TransactionButton>
              </Button>
            </Fragment>
          )}
        </DrawerContent>
      </Drawer>
    </Fragment>
  );
};
BuyNowDrawer.displayName = "BuyNowDrawer";
export { BuyNowDrawer };
