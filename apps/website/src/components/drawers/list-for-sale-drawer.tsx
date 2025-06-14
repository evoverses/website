"use client";
import { ConnectButton } from "@/components/buttons/connect-button";
import { EvoImage } from "@/components/images/evo-image";
import { evoContract, evoNftContract, marketplaceContract } from "@/data/contracts";
import { useChain } from "@/hooks/use-chain";
import { useMarketplaceInfo } from "@/hooks/use-marketplace-info";
import { useEvoPrice } from "@/hooks/use-token-price";
import { toAssetFullName } from "@/lib/evo/utils";
import type { SquidAsset } from "@/lib/squid/types";
import { createListing } from "@/lib/thirdweb/extensions/marketplace";
import { formatNumberWithSuffix } from "@workspace/evoverses/utils/numbers";
import { toAssetUrl, toCollectionUrl } from "@/utils/url";
import { Button } from "@workspace/ui/components/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@workspace/ui/components/drawer";
import { Input } from "@workspace/ui/components/input";
import { toast } from "@workspace/ui/components/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import { LayersIcon } from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, type ReactNode, useCallback, useState } from "react";
import { getApproved, isApprovedForAll, setApprovalForAll } from "thirdweb/extensions/erc721";
import { TransactionButton, useActiveAccount, useSendAndConfirmTransaction } from "thirdweb/react";
import { parseUnits } from "viem";
import { PeriodDrawerFooter, usePeriod } from "./period-drawer-footer";

const ListForSaleDrawer = ({ asset, children }: { asset: SquidAsset, children?: ReactNode }) => {
  const periodData = usePeriod();

  const [ amount, setAmount ] = useState<string>("");
  const [ error, setError ] = useState<string | undefined>(undefined);
  const [ success, setSuccess ] = useState<boolean>(false);
  const [ progress, setProgress ] = useState<string>();

  const account = useActiveAccount();
  const { switchChainIfNeeded } = useChain();
  const { feePercent } = useMarketplaceInfo(asset.chainId);
  const { mutateAsync } = useSendAndConfirmTransaction();

  const currencyPrice = useEvoPrice();

  const prepareTransaction = useCallback(async () => {
    if (!account) {
      throw new Error("No account detected");
    }
    setProgress("Checking active chain");
    await switchChainIfNeeded(asset.chainId);

    setProgress("Checking approval");
    const [ isApproved, approvedTokenSpender ] = await Promise.all([
      isApprovedForAll({
        contract: evoNftContract,
        operator: marketplaceContract.address,
        owner: account.address,
      }),
      getApproved({ contract: evoNftContract, tokenId: BigInt(asset.tokenId) }),
    ]);
    if (!isApproved && approvedTokenSpender.toLowerCase() !== marketplaceContract.address.toLowerCase()) {
      setProgress("Requesting approval in wallet");
      await mutateAsync(setApprovalForAll({
        contract: evoNftContract,
        operator: marketplaceContract.address,
        approved: true,
      }));
    }

    setProgress("Creating listing");
    const startTimestamp = BigInt(Math.floor(Date.now() / 1000) + 60);
    console.log("creatingListing", amount, parseUnits(amount, 18));
    return createListing({
      contract: marketplaceContract,
      params: {
        assetContract: evoNftContract.address,
        tokenId: BigInt(asset.tokenId),
        quantity: 1n,
        currency: evoContract.address,
        pricePerToken: parseUnits(amount, 18),
        startTimestamp,
        endTimestamp: periodData.period === "custom" && periodData.customDate
          ? BigInt(Math.floor(periodData.customDate.getTime() / 1000))
          : startTimestamp + BigInt(periodData.period),
        reserved: false,
      },
    });
  }, [ account, mutateAsync, asset, amount, periodData, switchChainIfNeeded, setProgress ]);

  const handleOnAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    if (e.target.value && Number(e.target.value) !== 0 && Number(e.target.value) < 1) {
      setError(`Offer amount must be at least 1 EVO`);
    } else {
      setError(undefined);
    }
  };

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
              <EvoImage asset={asset} />
            </div>
            <h2 className="font-semibold text-xl sm:text-4xl">Just listed!</h2>
            <div className="flex gap-1 flex-wrap text-center items-center justify-center text-sm">
              <span>You Listed</span>
              <Link href={toAssetUrl(asset)}>
                <span className="text-primary">{toAssetFullName(asset)}</span>
              </Link>
              <span>from the</span>
              <Link href={toCollectionUrl(asset)}>
                <span className="text-primary">Evo</span>
              </Link>
              <span>collection!</span>
            </div>
            <Button variant="secondary" asChild>
              <Link href={toAssetUrl(asset)}>
                View Item Page
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full max-w-6xl px-4">
            <DrawerHeader className="p-0 pt-2 flex-row justify-between items-center">
              <DrawerTitle>Create Listing</DrawerTitle>
            </DrawerHeader>
            <Table>
              <TableHeader>
                <TableRow className="font-mono uppercase text-xs border-b-0! hover:bg-transparent">
                  <TableHead className="pl-0">
                    <div className="flex gap-2 items-center">
                      <LayersIcon className="size-4" />
                      <span>1 Item</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right hidden md:table-cell">Floor</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Trait Floor</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Top Offer</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Cost</TableHead>
                  <TableHead className="text-right hidden md:table-cell w-30">Proceeds</TableHead>
                  <TableHead className="pr-0 text-right w-42">Listed As</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className={cn("font-semibold hover:bg-transparent", { "border-b-0": !!error })}>
                  <TableCell className="pl-0">
                    <div className="flex gap-3 items-center">
                      <div className="relative size-8 aspect-card bg-secondary rounded-md overflow-hidden">
                        <EvoImage asset={asset} />
                      </div>
                      <span>{toAssetFullName(asset)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">—</TableCell>
                  <TableCell className="text-right hidden md:table-cell">—</TableCell>
                  <TableCell className="text-right hidden md:table-cell">—</TableCell>
                  <TableCell className="text-right hidden md:table-cell">—</TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    {formatNumberWithSuffix(amount, {
                      defaultValue: "0.00",
                      genericLessThan: 0.0001,
                      minDecimals: 2,
                      maxDecimals: 4,
                      postfix: "EVO",
                    })}
                  </TableCell>
                  <TableCell className="flex justify-end pr-0">
                    <div className="relative font-mono">
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={amount}
                        className={cn("w-37.5 no-spinner pr-11.5", { "border-destructive": !!error })}
                        onChange={handleOnAmountChange}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2">
                        EVO
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
                {error && (
                  <TableRow className="font-semibold hover:bg-transparent text-xs text-right text-destructive">
                    <TableCell colSpan={7} className="px-0 border-b-0">{error}</TableCell>
                  </TableRow>
                )}
                <TableRow className="font-semibold hover:bg-transparent">
                  <TableCell className="pl-0 py-4">Total Listing Price</TableCell>
                  <TableCell colSpan={5} className="hidden md:table-cell" />
                  <TableCell className="flex justify-end pr-0 py-4 gap-2 items-center font-mono">
                    <span className="text-muted-foreground text-xs">
                      ({Number(amount) > 0 ? (
                      Number(amount) * currencyPrice
                    ).toLocaleString("en", {
                      currency: "USD",
                      style: "currency",
                    }) : "$0.00"})
                    </span>
                    <span>
                      {formatNumberWithSuffix(amount, {
                        defaultValue: "0.00",
                        genericLessThan: 0.0001,
                        minDecimals: 2,
                        maxDecimals: 4,
                        postfix: "EVO",
                      })}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow className="font-semibold text-muted-foreground border-b-0! hover:bg-transparent">
                  <TableCell className="pl-0 pt-4">Floor Difference</TableCell>
                  <TableCell colSpan={5} className="hidden md:table-cell" />
                  <TableCell className="flex justify-end pr-0 pt-4 gap-2 items-center">
                    <span className="text-xs">—</span>
                    <span className="hidden">0.00 EVO</span>
                  </TableCell>
                </TableRow>
                <TableRow className="font-semibold text-muted-foreground hover:bg-transparent">
                  <TableCell className="pl-0 py-4">
                    <span>Platform Fees</span>
                    {Number(amount) > 0 && (
                      <span className="ml-1 font-mono">
                        ({feePercent.toLocaleString("en", { style: "percent" })})
                      </span>
                    )}
                  </TableCell>
                  <TableCell colSpan={5} className="hidden md:table-cell" />
                  <TableCell className="flex justify-end pr-0 py-4 gap-2 items-center font-mono whitespace-nowrap">
                    <span className="text-muted-foreground text-xs">
                      ({Number(amount) > 0 ? (
                      Number(amount) * currencyPrice * feePercent * -1
                    ).toLocaleString("en", {
                      currency: "USD",
                      style: "currency",
                    }) : "$0.00"})
                    </span>
                    <span>
                      {formatNumberWithSuffix(Number(amount) * feePercent * -1, {
                        defaultValue: "0.00",
                        minDecimals: 2,
                        maxDecimals: 4,
                        postfix: "EVO",
                      })}
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow className="font-semibold hover:bg-transparent">
                  <TableCell className="pl-0 py-4">Total Est. Proceeds</TableCell>
                  <TableCell colSpan={5} className="hidden md:table-cell" />
                  <TableCell className="flex justify-end pr-0 py-4 gap-2 items-center font-mono">
                    <span className="text-muted-foreground text-xs">
                      ({Number(amount) > 0
                      ? (
                        (
                          Number(amount) - (
                            Number(amount) * feePercent
                          )
                        ) * currencyPrice
                      ).toLocaleString("en", {
                        currency: "USD",
                        style: "currency",
                      })
                      : "$0.00"})
                    </span>
                    <span>
                      {formatNumberWithSuffix(Number(amount) - (
                        Number(amount) * feePercent
                      ), {
                        defaultValue: "0.00",
                        genericLessThan: 0.0001,
                        minDecimals: 2,
                        maxDecimals: 4,
                        postfix: "EVO",
                      })}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <PeriodDrawerFooter data={periodData} progress={progress}>
              {account ? (
                <TransactionButton
                  disabled={!!error || !amount || Number(amount) < 0.0001}
                  unstyled
                  transaction={() => prepareTransaction()}
                  onError={e => {
                    console.log(e);
                    toast.error(e.message);
                    setProgress(undefined);
                  }}
                  onTransactionConfirmed={() => {
                    setSuccess(true);
                  }}
                >
                  Create Listing
                </TransactionButton>
              ) : (
                <ConnectButton>
                  Create Listing
                </ConnectButton>
              )}
            </PeriodDrawerFooter>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
ListForSaleDrawer.displayName = "ListForSaleDrawer";

export { ListForSaleDrawer };
