"use client";

import { evoContract } from "@/data/contracts";
import { chain, client } from "@/lib/thirdweb/config";
import { parseViemDetailedError } from "@/lib/viem";
import { UploadIcon } from "@radix-ui/react-icons";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  SmartDrawer,
  SmartDrawerContent,
  SmartDrawerDescription,
  SmartDrawerFooter,
  SmartDrawerHeader,
  SmartDrawerTitle,
  SmartDrawerTrigger,
} from "@workspace/ui/components/smart-drawer";
import { toast } from "@workspace/ui/components/sonner";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { Address } from "thirdweb";
import { transfer } from "thirdweb/extensions/erc20";
import { useActiveAccount, useSendTransaction, useWaitForReceipt, useWalletBalance } from "thirdweb/react";
import { formatEther, parseEther } from "viem";

export const DepositEvoSmartDrawer = ({
  managedWallet,
  className,
}: {
  managedWallet: Address;
  className?: string;
}) => {
  const [ open, setOpen ] = useState(false);
  const [ value, setValue ] = useState<string>("");
  const account = useActiveAccount();
  const {
    data: evoBalance = { value: 0n, displayValue: "0", symbol: "EVO" },
    isLoading: isEvoBalanceLoading,
    isFetching: isEvoBalanceFetching,
  } = useWalletBalance({
    client,
    chain,
    address: account?.address,
    tokenAddress: evoContract.address,
  }, { enabled: !!account?.address });

  const onValueChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setValue(value);
  };

  const onOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setValue("");
    }
  };

  return (
    <SmartDrawer open={open} onOpenChange={onOpenChange}>
      <SmartDrawerTrigger asChild>
        <Button variant="success" className={className}>
          <UploadIcon />
        </Button>
      </SmartDrawerTrigger>
      <SmartDrawerContent>
        <SmartDrawerHeader>
          <SmartDrawerTitle>Deposit to Game Wallet</SmartDrawerTitle>
          <SmartDrawerDescription>This action cannot be undone.</SmartDrawerDescription>
        </SmartDrawerHeader>
        <div className="grid w-full max-w-sm items-center gap-1.5 py-4 mx-auto">
          <Label htmlFor="amount">
            EVO
          </Label>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input type="number" id="amount" placeholder="0" value={value} onChange={onValueChange} />
            <Button onClick={() => setValue(formatEther(BigInt(evoBalance.value)))}>Max</Button>
          </div>
          <Label> Balance: {formatEther(BigInt(evoBalance.value))}</Label>
        </div>
        <SmartDrawerFooter>
          <DepositButton
            managedWallet={managedWallet}
            max={BigInt(evoBalance.value)}
            value={value}
            close={() => setOpen(false)}
          />
        </SmartDrawerFooter>
      </SmartDrawerContent>
    </SmartDrawer>
  );
};

interface DepositButtonProps {
  managedWallet: Address,
  max: bigint,
  value: string,
  open?: boolean,
  close: () => void,
}

const DepositButton = ({ managedWallet, max, value, open, close }: DepositButtonProps) => {
  // noinspection DuplicatedCode
  const router = useRouter();
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;

  const {
    data: { transactionHash } = { transactionHash: "" as Address },
    error,
    isError,
    mutate: writeContract,
    isPending,
    reset,
  } = useSendTransaction();

  const { isSuccess, isPending: isLoading } = useWaitForReceipt({
    client,
    transactionHash,
    chain,
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
    if (isError) {
      toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
      reset();
    }
    if (!isPending && !isLoading) {
      if (isSuccess) {
        toast.success("Deposit completed successfully");
        close();
        reset();
        router.refresh();
      } else {
        toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
        reset();

      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ open, isError, error, transactionHash ]);

  return (
    <Button
      onClick={() => writeContract(transfer({ contract: evoContract, to: managedWallet, amountWei: valueBigInt }))}
      disabled={isError || !validAmount}
    >
      Deposit
    </Button>
  );
};
