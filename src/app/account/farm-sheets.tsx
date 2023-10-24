"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/use-toast";
import { investorContract } from "@/data/contracts";
import { bigIntJsonReviver } from "@/lib/node";
import { parseViemDetailedError } from "@/lib/viem";
import { Pool } from "@/types/core";
import { ChangeEvent, useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";

const FarmActions = [ "Deposit", "Withdraw", "Claim" ] as const;
type FarmAction = typeof FarmActions[number];

interface FarmSheetProps {
  action: FarmAction,
  poolJson: string,
  disabled?: boolean
}

export const FarmSheet = ({ action = "Deposit", poolJson, disabled }: FarmSheetProps) => {
  const pool: Pool = JSON.parse(poolJson, bigIntJsonReviver);
  const [ open, setOpen ] = useState<boolean>(false);
  const [ value, setValue ] = useState<string>("");

  const onOpenChange = (open: boolean) => {
    setOpen(open);

  };

  const onValueChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setValue(value);
  };

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetTrigger asChild>
        <Button className="w-full font-bold" disabled={disabled}>{action}</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader className="sm:text-center">
          <SheetTitle>{action} {action === "Claim" ? "Rewards" : "Liquidity"}</SheetTitle>
          {action === "Claim" && (
            <SheetDescription>
              If you claim now, you will receive:
              <br />
              ~{(
              Number(pool.earned) / 1e18
            ).toLocaleString()} EVO
            </SheetDescription>
          )}
          {action === "Deposit" && (
            <SheetDescription>
              EvoVerses currently has deposit fees minimized. Once fee reflection features are released, this is
              subject to change.
              <Separator className="my-2" />
              Deposit fee: {Number(pool.depFee) / 100}%
            </SheetDescription>
          )}
          {action === "Withdraw" && (
            <SheetDescription>
              EvoVerses utilizes LP withdrawal fees as a disincentive for short term farming and selling.
              <Separator className="my-2" />
              Current fee: {Number(pool.withdrawFee) / 100}%
              {pool.nextWithdrawFee > 0 && (
                <>
                  <br />
                  Next fee: {pool.nextWithdrawFee}% (in {Math.floor(pool.nextSecondsRemaining / 60 / 60)} hours)
                </>
              )}
            </SheetDescription>
          )}
        </SheetHeader>
        {action === "Claim" && (
          <div className="grid w-full max-w-sm items-center gap-1.5 py-2 mx-auto"></div>
        )}
        {action === "Deposit" && (
          <div className="grid w-full max-w-sm items-center gap-1.5 py-4 mx-auto">
            <Label htmlFor="amount">
              {pool.t0Symbol} / {pool.t1Symbol}
            </Label>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="number" id="amount" placeholder="0" value={value} onChange={onValueChange} />
              <Button onClick={() => setValue(formatEther(pool.remainBalance))}>Max</Button>
            </div>
            <Label> Balance: {formatEther(pool.remainBalance)}</Label>
          </div>
        )}
        {action === "Withdraw" && (
          <div className="grid w-full max-w-sm items-center gap-1.5 py-4 mx-auto">
            <Label htmlFor="amount">
              {pool.t0Symbol} / {pool.t1Symbol}
            </Label>
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="number" id="amount" placeholder="0" value={value} onChange={onValueChange} />
              <Button onClick={() => setValue(formatEther(pool.balance))}>Max</Button>
            </div>
            <Label> Balance: {formatEther(pool.balance)}</Label>
          </div>
        )}
        <SheetFooter className="sm:justify-center sm:flex-col sm:max-w-lg sm:mx-auto">
          {action === "Claim" && (
            <ClaimButton
              poolId={pool.pid}
              enabled={pool.earned > 0}
              open={action === "Claim" && open}
              close={() => setOpen(false)}
            />
          )}
          {action === "Deposit" && (
            <DepositButton
              poolId={pool.pid}
              value={value}
              max={pool.remainBalance}
              open={action === "Deposit" && open}
              close={() => setOpen(false)}
            />
          )}
          {action === "Withdraw" && (
            <WithdrawButton
              poolId={pool.pid}
              value={value}
              max={pool.balance}
              open={action === "Withdraw" && open}
              close={() => setOpen(false)}
            />
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};


interface ClaimButtonProps {
  poolId: bigint,
  enabled?: boolean,
  open?: boolean,
  close: () => void,
}

const ClaimButton = ({ poolId, enabled, open, close }: ClaimButtonProps) => {
  const { config } = usePrepareContractWrite({
    ...investorContract,
    functionName: "claimReward",
    args: [ poolId ],
    chainId: 43_114,
    enabled,
  });

  const { data, error, isError, write, reset } = useContractWrite(config);

  const { data: tx } = useWaitForTransaction({ hash: data?.hash, chainId: 43_114, confirmations: 1 });

  useEffect(() => {
    if (!open) {
      reset();
    }
    if (isError) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: parseViemDetailedError(error)?.details || "There was a problem with your request.",
      });
      reset();
    }
    if (tx) {
      if (tx.status === "success") {
        toast({ title: "Success!", description: "Claim completed successfully" });
        close();
        reset();
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: parseViemDetailedError(error)?.details || "There was a problem with your request.",
        });
        reset();
      }
    }
  }, [ open, isError, error, tx ]);

  return (
    <Button onClick={write} disabled={isError}>Claim</Button>
  );
};

interface DepositButtonProps {
  poolId: bigint,
  max: bigint,
  value: string,
  open?: boolean,
  close: () => void,
}

const DepositButton = ({ poolId, max, value, open, close }: DepositButtonProps) => {
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;
  const { config } = usePrepareContractWrite({
    ...investorContract,
    functionName: "deposit",
    args: [ poolId, valueBigInt ],
    chainId: 43_114,
    enabled: validAmount,
  });

  const { data, isError, error, write, reset } = useContractWrite(config);

  const { data: tx } = useWaitForTransaction({ hash: data?.hash, chainId: 43_114, confirmations: 1 });

  useEffect(() => {
    if (!open) {
      reset();
    }
    if (isError) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: parseViemDetailedError(error)?.details || "There was a problem with your request.",
      });
      reset();
    }
    if (tx) {
      if (tx.status === "success") {
        toast({ title: "Success!", description: "Deposit completed successfully" });
        close();
        reset();
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: parseViemDetailedError(error)?.details || "There was a problem with your request.",
        });
        reset();

      }
    }
  }, [ open, isError, error, tx ]);

  return (
    <Button onClick={write} disabled={isError || !validAmount}>Deposit</Button>
  );
};

interface WithdrawButtonProps {
  poolId: bigint,
  max: bigint,
  value: string,
  open?: boolean,
  close: () => void,
}

const WithdrawButton = ({ poolId, max, value, open, close }: WithdrawButtonProps) => {
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;
  const { config } = usePrepareContractWrite({
    ...investorContract,
    functionName: "withdraw",
    args: [ poolId, valueBigInt ],
    chainId: 43_114,
    enabled: validAmount,
  });

  const { data, error, isError, write, reset } = useContractWrite(config);

  const { data: tx } = useWaitForTransaction({ hash: data?.hash, chainId: 43_114, confirmations: 1 });

  useEffect(() => {
    if (!open) {
      reset();
    }
    if (isError) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: parseViemDetailedError(error)?.details || "There was a problem with your request.",
      });
      reset();
    }
    if (tx) {
      if (tx.status === "success") {
        toast({ title: "Success!", description: "Withdrawal completed successfully" });
        close();
        reset();
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: parseViemDetailedError(error)?.details || "There was a problem with your request.",
        });
        reset();
      }
    }
  }, [ open, isError, error, tx ]);

  return (
    <Button onClick={write} disabled={isError || !validAmount}>Withdraw</Button>
  );
};
