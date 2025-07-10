"use client";
import { DatePicker } from "@/components/date-picker";
import { EvoImage } from "@/components/images/evo-image";
import { evoContractAddress, evoNftContractAddress } from "@/data/addresses";
import { marketplaceContract } from "@/data/contracts";
import { useChain } from "@/hooks/use-chain";
import { useMarketplaceInfo } from "@/hooks/use-marketplace-info";
import { toAssetFullName } from "@/lib/evo/utils";
import { toAssetUrl, toCollectionUrl } from "@/utils/url";
import type { SquidAsset } from "@workspace/evoverses/lib/asset/types";
import { formatNumberWithSuffix } from "@workspace/evoverses/utils/numbers";
import { Button } from "@workspace/ui/components/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { toast } from "@workspace/ui/components/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import { ClockIcon, LayersIcon } from "lucide-react";
import Link from "next/link";
import { type ChangeEvent, type ReactNode, useCallback, useState } from "react";
import { updateListing } from "thirdweb/extensions/marketplace";
import { TransactionButton, useActiveAccount } from "thirdweb/react";
import { formatEther } from "viem";

const EditListingDrawer = ({ asset, children }: { asset: SquidAsset, children?: ReactNode }) => {
  const listing = asset.listings[0];
  const [ period, setPeriod ] = useState<string>("unchanged");
  const [ customDate, setCustomDate ] = useState<Date | undefined>(undefined);
  const [ amount, setAmount ] = useState<string>(listing ? formatEther(BigInt(listing.pricePerToken)) : "");
  const [ error, setError ] = useState<string | undefined>(undefined);
  const [ success, setSuccess ] = useState<boolean>(false);

  const account = useActiveAccount();
  const { switchChainIfNeeded } = useChain();
  const { feePercent } = useMarketplaceInfo();

  const prepareTransaction = useCallback(async () => {
    if (!account) {
      throw new Error("No account detected");
    }
    if (!listing) {
      throw new Error("No listing detected");
    }

    await switchChainIfNeeded(asset.chainId);

    return updateListing({
      contract: marketplaceContract,
      listingId: BigInt(listing.id),
      assetContractAddress: evoNftContractAddress,
      tokenId: BigInt(asset.tokenId),
      pricePerToken: amount,
      currencyContractAddress: evoContractAddress,
      ...(
        period === "unchanged"
          ? {}
          : { endTimestamp: period === "custom" ? customDate! : new Date(Date.now() + parseInt(period) * 1000) }
      ),
      isReservedListing: false,
    });
  }, [ account, listing, switchChainIfNeeded, asset, amount, period, customDate ]);

  const handleCustomDateChange = ({ day, hour, minute }: { day?: Date, hour?: number, minute?: number }) => {
    const d = customDate || new Date();
    if (day) {
      d.setUTCFullYear(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
    }
    if (hour) {
      d.setHours(Math.max(Math.min(hour, 23), 0));
    }
    if (minute) {
      d.setMinutes(Math.max(Math.min(minute, 59), 0));
    }
    setCustomDate(d);
  };

  const handleOnAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    if (e.target.value && Number(e.target.value) < 0.0001) {
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
            <h2 className="font-semibold text-xl sm:text-4xl">Just edited!</h2>
            <div className="flex gap-1 flex-wrap text-center items-center justify-center text-sm">
              <span>You edited</span>
              <Link href={toAssetUrl(asset)}>
                <span className="text-primary">{toAssetFullName(asset)}</span>
              </Link>
              <span>from the</span>
              <Link href={toCollectionUrl(asset)}>
                <span className="text-primary">Evos</span>
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
              <DrawerTitle>Edit Listing</DrawerTitle>
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
                  <TableHead className="text-right hidden md:table-cell whitespace-nowrap">Trait Floor</TableHead>
                  <TableHead className="text-right hidden md:table-cell whitespace-nowrap">Top Offer</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Cost</TableHead>
                  <TableHead className="text-right hidden md:table-cell w-30">Proceeds</TableHead>
                  <TableHead className="pr-0 text-right w-42">Listed As</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className={cn("font-semibold hover:bg-transparent", { "border-b-0": !!error })}>
                  <TableCell className="pl-0">
                    <div className="flex gap-3 min-w-0 items-center w-full overflow-hidden">
                      <div className="relative size-8 aspect-card bg-secondary rounded-md overflow-hidden">
                        <EvoImage asset={asset} />
                      </div>
                      <span className="truncate">{toAssetFullName(asset)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">—</TableCell>
                  <TableCell className="text-right hidden md:table-cell">—</TableCell>
                  <TableCell className="text-right hidden md:table-cell">—</TableCell>
                  <TableCell className="text-right hidden md:table-cell">—</TableCell>
                  <TableCell className="text-right hidden md:table-cell whitespace-nowrap">
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
                    <span className="text-muted-foreground text-xs">($0.00)</span>
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
                  <TableCell className="flex whitespace-nowrap justify-end pr-0 py-4 gap-2 items-center font-mono">
                    <span className="text-muted-foreground text-xs">($0.00)</span>
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
                  <TableCell className="pl-0 py-4 whitespace-nowrap">Total Est. Proceeds</TableCell>
                  <TableCell colSpan={5} className="hidden md:table-cell" />
                  <TableCell className="flex justify-end pr-0 py-4 gap-2 items-center font-mono whitespace-nowrap">
                    <span className="text-muted-foreground text-xs">($0.00)</span>
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
            <DrawerFooter className="px-0 justify-end md:flex-row">
              {period === "custom" && (
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker className="w-full" />
                  <div className="inline-flex items-center border border-input px-3 py-1.5 rounded-md w-full justify-center text-sm">
                    <ClockIcon className="size-4 mr-1" />
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      onChange={e => handleCustomDateChange({ hour: Number(e.target.value) })}
                      placeholder="00"
                      value={(
                        period === "custom" && customDate
                      ) ? customDate.getUTCHours().toString() : ""}
                      className="px-0 py-0 border-none focus-visible:border-none focus-visible:ring-0 no-spinner w-5 font-mono h-fit placeholder:text-foreground"
                    />
                    <span className="mr-1">:</span>
                    <Input
                      type="number"
                      min={0}
                      max={59}
                      onChange={e => handleCustomDateChange({ minute: Number(e.target.value) })}
                      placeholder="00"
                      value={(
                        period === "custom" && customDate
                      ) ? customDate.getUTCMinutes().toString() : ""}
                      className="px-0 py-0 border-none focus-visible:border-none focus-visible:ring-0 no-spinner w-5 font-mono h-fit placeholder:text-foreground"
                    />
                  </div>
                </div>
              )}
              <div className="gap-2 grid grid-cols-2">
                <Select value={period} onValueChange={v => setPeriod(v)}>
                  <SelectTrigger className="ww-[180px]">
                    <SelectValue placeholder="Theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unchanged">Unchanged</SelectItem>
                    {[ 86_400, 86_400 * 3, 86_400 * 7, 86_400 * 30 ].map((v, i) => (
                      <SelectItem key={v.toString()} value={v.toString()}>
                        {v / 86_400} Day{i === 0 ? "" : "s"}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                <Button asChild>
                  <TransactionButton
                    disabled={!!error || !amount}
                    unstyled
                    transaction={() => prepareTransaction()}
                    onError={e => toast.error(e.message)}
                    onTransactionConfirmed={() => {
                      setSuccess(true);
                    }}
                  >
                    Edit Listing
                  </TransactionButton>
                </Button>
              </div>
            </DrawerFooter>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};
EditListingDrawer.displayName = "EditListingDrawer";
export { EditListingDrawer };
