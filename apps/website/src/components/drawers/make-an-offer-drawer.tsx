"use client";
import { DatePicker } from "@/components/date-picker";
import { EvoImage } from "@/components/images/evo-image";
import { evoContract, marketplaceContract } from "@/data/contracts";
import { useChain } from "@/hooks/use-chain";
import { useMarketplaceInfo } from "@/hooks/use-marketplace-info";
import { useEvoPrice } from "@/hooks/use-token-price";
import { toAssetFullName } from "@/lib/evo/utils";
import { SquidAsset } from "@/lib/squid/types";
import { client } from "@/lib/thirdweb/config";
import { formatNumberWithSuffix, formatUsd } from "@workspace/evoverses/utils/numbers";
import { EM_DASH } from "@/utils/strings";
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
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { toast } from "@workspace/ui/components/sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import { ClockIcon, LayersIcon } from "lucide-react";
import { type ChangeEvent, type ReactNode, useCallback, useRef, useState } from "react";
import { defineChain } from "thirdweb";
import { allowance, approve } from "thirdweb/extensions/erc20";
import { makeOffer } from "thirdweb/extensions/marketplace";
import { TransactionButton, useActiveAccount, useSendAndConfirmTransaction, useWalletBalance } from "thirdweb/react";
import { parseUnits } from "viem";

const MakeAnOfferDrawer = ({ asset, children }: {
  asset: SquidAsset,
  children?: ReactNode
}) => {
  const [ period, setPeriod ] = useState<string>((
    86_400 * 7
  ).toString());
  const [ customDate, setCustomDate ] = useState<Date | undefined>(undefined);
  const [ amount, setAmount ] = useState<string>("");
  const [ error, setError ] = useState<string | undefined>(undefined);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [ success, setSuccess ] = useState<boolean>(false);

  const account = useActiveAccount();
  const { chain, switchChainIfNeeded } = useChain();
  const { mutateAsync } = useSendAndConfirmTransaction();
  const { feePercent } = useMarketplaceInfo();
  const currencyPrice = useEvoPrice();
  const {
    data: balance = { value: 0n },
  } = useWalletBalance({
    address: account?.address,
    chain: defineChain(chain.id),
    client,
    tokenAddress: evoContract.address,
  });

  const prepareTransaction = useCallback(async () => {
    if (!account) {
      throw new Error("No account detected");
    }

    await switchChainIfNeeded(asset.chainId);

    const allowanceWei = await allowance({
      contract: evoContract,
      owner: account.address,
      spender: marketplaceContract.address,
    });
    const offerAmountWei = parseUnits(amount, 18);

    if (allowanceWei < offerAmountWei) {
      await mutateAsync(approve({
        contract: evoContract,
        spender: marketplaceContract.address,
        amountWei: offerAmountWei,
      }));
    }

    return makeOffer({
      contract: marketplaceContract,
      assetContractAddress: asset.address,
      tokenId: BigInt(asset.tokenId),
      currencyContractAddress: evoContract.address,
      offerExpiresAt: period === "custom" ? customDate! : new Date(Date.now() + parseInt(period) * 1000),
      totalOffer: amount,
    });

  }, [ asset, account, mutateAsync, period, amount, customDate, switchChainIfNeeded ]);

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

  const handleOnOfferAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
    const offerAmount = e.target.value || "0";
    const offerAmountWei = parseUnits(offerAmount, 18);
    const walletBalanceWei = balance.value;
    if (offerAmountWei > walletBalanceWei) {
      // const deltaWei = offerAmountWei - walletBalanceWei;
      // setError(`Offer exceeds wallet balance by ${formatNumberWithSuffix(formatUnits(deltaWei, 18))} EVO`);
      setError(undefined);
    } else if (e.target.value && Number(offerAmount) < 0.0001) {
      setError(`Offer amount must be at least 0.0001 EVO`);
    } else {
      setError(undefined);
    }
    e.target.setCustomValidity("asdf");
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
        <div className="flex flex-col gap-4 w-full max-w-6xl px-4">
          <DrawerHeader className="p-0 pt-2 flex-row justify-between items-center">
            <DrawerTitle>Create Item Offer</DrawerTitle>
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
                <TableHead className="text-right hidden md:table-cell">Top Offer</TableHead>
                <TableHead className="text-right hidden md:table-cell">Cost</TableHead>
                <TableHead className="text-right hidden md:table-cell">Offer Total</TableHead>
                <TableHead className="pr-0 text-right w-42">Offered At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className={cn("font-semibold hover:bg-transparent", { "border-b-0!": !!error })}>
                <TableCell className="pl-0">
                  <div className="flex gap-3 items-center">
                    <div className="relative size-8 aspect-card bg-secondary rounded-md overflow-hidden">
                      <EvoImage asset={asset} />
                    </div>
                    <span>{toAssetFullName(asset)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right hidden md:table-cell">{EM_DASH}</TableCell>
                <TableCell className="text-right hidden md:table-cell">{EM_DASH}</TableCell>
                <TableCell className="text-right hidden md:table-cell">{EM_DASH}</TableCell>
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
                      onChange={handleOnOfferAmountChange}
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                      EVO
                    </span>
                  </div>
                </TableCell>
              </TableRow>
              {error && (
                <TableRow className="font-semibold hover:bg-transparent text-xs text-right text-destructive">
                  <TableCell colSpan={6} className="px-0 border-b-0">{error}</TableCell>
                </TableRow>
              )}
              <TableRow className="font-semibold hover:bg-transparent">
                <TableCell className="pl-0 py-4">Total Offer Value</TableCell>
                <TableCell colSpan={4} className="hidden md:table-cell" />
                <TableCell className="flex justify-end pr-0 py-4 gap-2 items-center font-mono">
                  <span className="text-muted-foreground text-xs">
                    ({Number(amount) > 0 ? formatUsd(Number(amount) * currencyPrice) : "$0.00"})
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
                <TableCell colSpan={4} className="hidden md:table-cell" />
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
                <TableCell colSpan={4} className="hidden md:table-cell" />
                <TableCell className="flex justify-end pr-0 py-4 gap-2 items-center font-mono">
                  <span className="text-muted-foreground text-xs">
                    ({Number(amount) > 0 ? formatUsd(Number(amount) * currencyPrice * feePercent * -1) : "$0.00"})
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
                <TableCell colSpan={4} className="hidden md:table-cell" />
                <TableCell className="flex justify-end pr-0 py-4 gap-2 items-center font-mono">
                  <span className="text-muted-foreground text-xs">
                    ({Number(amount) > 0
                    ? formatUsd((
                      Number(amount) * currencyPrice
                    ) - (
                      Number(amount) * currencyPrice * feePercent
                    ))
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
          <DrawerFooter className="px-0 justify-end md:flex-row">
            {period === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <DatePicker className="w-full" onValueChange={day => handleCustomDateChange({ day })} />
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
                    toast.success(
                      (
                        <div className="flex gap-3 items-center w-fit">
                          <div className="relative size-8 bg-secondary rounded-md overflow-hidden">
                            <EvoImage asset={asset} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span>Offer Submitted!</span>
                            <span>{amount} EVO</span>
                          </div>
                        </div>
                      ));
                    setSuccess(true);
                    closeRef.current?.click();
                  }}
                >
                  Review Item Offer
                </TransactionButton>
              </Button>
              <DrawerClose ref={closeRef} className="hidden" />
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
    ;
};
MakeAnOfferDrawer.displayName = "MakeAnOfferDrawer";
export { MakeAnOfferDrawer };
