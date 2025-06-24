"use client";

import { EvoImage } from "@/components/images/evo-image";
import { evoContract } from "@/data/contracts";
import { useChain } from "@/hooks/use-chain";
import { toAssetFullName } from "@/lib/evo/utils";
import { toAssetUrl } from "@/utils/url";

import type { SquidAsset } from "@workspace/evoverses/lib/asset/types";
import { Button } from "@workspace/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer";
import { Separator } from "@workspace/ui/components/separator";
import { toast } from "@workspace/ui/components/sonner";
import Link from "next/link";
import { type ReactNode, useCallback, useRef, useState } from "react";
import { transferFrom } from "thirdweb/extensions/erc721";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { AddressOrEnsNameInput, Recipient } from "../address-or-ens-name-input";

const TransferDrawer = ({ asset, children }: { asset: SquidAsset, children?: ReactNode }) => {
  const [ recipient, setRecipient ] = useState<Recipient | null>(null);
  const [ success, setSuccess ] = useState<boolean>(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  const account = useActiveAccount();
  const { switchChainIfNeeded } = useChain();

  const prepareTransaction = useCallback(async () => {
    if (!account) {
      throw new Error("No account detected");
    }
    if (!recipient?.address) {
      throw new Error("No recipient detected");
    }

    await switchChainIfNeeded(asset.chainId);

    return transferFrom({
      contract: evoContract,
      from: asset.owner,
      to: recipient.address,
      tokenId: BigInt(asset.tokenId),
    });

  }, [ account, recipient, asset, switchChainIfNeeded ]);

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
            <div className="relative size-45 sm:size-90 bg-secondary rounded-xl overflow-hidden">
              <EvoImage asset={asset} />
            </div>
            <h2 className="font-semibold text-xl sm:text-4xl text-center">Item successfully transferred!</h2>
            <Button variant="secondary" asChild>
              <Link href={toAssetUrl(asset)}>
                View Item Page
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-6xl px-4">
            <DrawerHeader className="p-0 pt-2">
              <DrawerTitle>Transfer Item</DrawerTitle>
            </DrawerHeader>
            <div className="flex gap-4 justify-center">
              <AddressOrEnsNameInput
                recipient={recipient}
                onRecipientSet={setRecipient}
                className="w-full max-w-128"
              />
            </div>
            <Separator />
            <DrawerFooter className="px-0 pt-0 justify-end md:flex-row md:justify-between gap-4">
              <div className="flex gap-3 items-center">
                <div className="relative size-8 bg-secondary rounded-md overflow-hidden">
                  <EvoImage asset={asset} />
                </div>
                <span>{toAssetFullName(asset)}</span>
              </div>
              <Button asChild>
                <TransactionButton
                  disabled={!recipient || !account}
                  unstyled
                  transaction={() => prepareTransaction()}
                  onError={e => toast.error(e.message)}
                  onTransactionConfirmed={() => {
                    setSuccess(true);
                  }}
                >
                  Review Transfer
                </TransactionButton>
              </Button>
              <DrawerClose ref={closeRef} className="hidden" />
            </DrawerFooter>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
TransferDrawer.displayName = "TransferDrawer";
export { TransferDrawer };
