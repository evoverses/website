"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SmartDrawer,
  SmartDrawerContent,
  SmartDrawerDescription,
  SmartDrawerFooter,
  SmartDrawerHeader,
  SmartDrawerTitle,
  SmartDrawerTrigger,
} from "@/components/ui/smart-drawer";
import { evoContract } from "@/data/contracts";
import { ERC20TokenBalance } from "@/lib/glacier/types";
import { parseViemDetailedError } from "@/lib/viem";
import { UploadIcon } from "@radix-ui/react-icons";
import { Address } from "abitype";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { formatEther, parseEther } from "viem";
import { useSimulateContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

type DepositEvoSmartDrawerProps = {
  balance: ERC20TokenBalance;
  managedWallet: Address;
}
export const DepositEvoSmartDrawer = ({ balance, managedWallet }: DepositEvoSmartDrawerProps) => {
  const [ open, setOpen ] = useState(false);
  const [ value, setValue ] = useState<string>("");

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
        <Button variant="success" className="w-full">
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
            <Button onClick={() => setValue(formatEther(BigInt(balance.balance)))}>Max</Button>
          </div>
          <Label> Balance: {formatEther(BigInt(balance.balance))}</Label>
        </div>
        <SmartDrawerFooter>
          <DepositButton
            managedWallet={managedWallet}
            max={BigInt(balance.balance)}
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
  const { isSuccess: isSimulateSuccess } = useSimulateContract({
    ...evoContract,
    functionName: "transfer",
    args: [ managedWallet, valueBigInt ],
    chainId: 43_114,
    query: {
      enabled: validAmount,
    },
  });

  // noinspection DuplicatedCode
  const { data, isError, error, writeContract, reset } = useWriteContract();

  const { data: tx } = useWaitForTransactionReceipt({ hash: data, chainId: 43_114, confirmations: 1 });

  useEffect(() => {
    if (!open) {
      reset();
    }
    if (isError) {
      toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
      reset();
    }
    if (tx) {
      if (tx.status === "success") {
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
  }, [ open, isError, error, tx ]);

  return (
    <Button
      onClick={() => writeContract({
        ...evoContract,
        functionName: "transfer",
        args: [ managedWallet, valueBigInt ],
        chainId: 43_114,
      })}
      disabled={isError || !validAmount || !isSimulateSuccess}
    >
      Deposit
    </Button>
  );
};
