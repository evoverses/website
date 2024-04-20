"use client";

import {
  BankDepositButton,
  BankWithdrawButton,
  FarmClaimButton,
  FarmDepositButton,
  FarmWithdrawButton,
} from "@/app/(authenticated)/profile/liquidity/buttons";
import { Button } from "@/components/ui/button";
import { ChainButton } from "@/components/ui/chain-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  SmartDrawer,
  SmartDrawerContent,
  SmartDrawerDescription,
  SmartDrawerFooter,
  SmartDrawerHeader,
  SmartDrawerTitle,
  SmartDrawerTrigger,
} from "@/components/ui/smart-drawer";
import { cEvoContract } from "@/data/contracts";
import { bigIntJsonReviver } from "@/lib/node";
import { parseViemDetailedError } from "@/lib/viem";
import { Pool } from "@/types/core";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { formatEther } from "viem";
import { useAccount, useSimulateContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

interface ClaimButtonProps {
  disabled?: boolean;
}

export const ClaimCEvoButton = ({ disabled }: ClaimButtonProps) => {
  const router = useRouter();
  const { address } = useAccount();

  const { isSuccess: isSimulateSuccess } = useSimulateContract({
    ...cEvoContract,
    functionName: "claimPending",
    chainId: 43_114,
    query: {
      enabled: !disabled && !!address,
    },
  });

  const { data, isError, error, writeContract, reset } = useWriteContract();

  const { data: tx } = useWaitForTransactionReceipt({ hash: data, chainId: 43_114, confirmations: 1 });

  useEffect(() => {

    if (isError) {
      toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
      reset();
    }
    if (tx) {
      if (tx.status === "success") {
        toast.success("Claim completed successfully");
        reset();
        router.refresh();
      } else {
        toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
        reset();

      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ isError, error, tx ]);

  return (
    <ChainButton
      className="w-full font-bold"
      onClick={() => writeContract({
        ...cEvoContract,
        functionName: "claimPending",
        chainId: 43_114,
      })}
      disabled={isError || disabled || !isSimulateSuccess}
    >
      Claim
    </ChainButton>
  );
};

const FarmActions = [ "Deposit", "Withdraw", "Claim" ] as const;
type FarmAction = typeof FarmActions[number];

interface FarmSheetProps {
  action: FarmAction,
  poolJson: string,
  disabled?: boolean
}

const FarmSmartDrawer = ({ action = "Deposit", poolJson, disabled }: FarmSheetProps) => {
  const pool: Pool = JSON.parse(poolJson, bigIntJsonReviver);
  const [ open, setOpen ] = useState<boolean>(false);
  const [ value, setValue ] = useState<string>("");

  const onOpenChange = (open: boolean) => {
    setOpen(open);

  };

  const onValueChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setValue(value);
  };

  const nextFeeHours = pool.nextSecondsRemaining / 60 / 60;
  return (
    <SmartDrawer onOpenChange={onOpenChange} open={open}>
      <SmartDrawerTrigger asChild>
        <ChainButton className="w-full font-bold" disabled={disabled}>{action}</ChainButton>
      </SmartDrawerTrigger>
      <SmartDrawerContent>
        <SmartDrawerHeader className="sm:text-center">
          <SmartDrawerTitle>{action} {action === "Claim" ? "Rewards" : "Liquidity"}</SmartDrawerTitle>
          {action === "Claim" && (
            <SmartDrawerDescription>
              If you claim now, you will receive:
              <br />
              ~{(
              Number(pool.earned) / 1e18
            ).toLocaleString()} EVO
            </SmartDrawerDescription>
          )}
          {action === "Deposit" && (
            <SmartDrawerDescription>
              EvoVerses currently has deposit fees minimized. Once fee reflection features are released, this is
              subject to change.
              <Separator className="my-2" />
              Deposit fee: {Number(pool.depFee) / 100}%
            </SmartDrawerDescription>
          )}
          {action === "Withdraw" && (
            <SmartDrawerDescription>
              EvoVerses utilizes LP withdrawal fees as a disincentive for short term farming and selling.
              <Separator className="my-2" />
              Current fee: {pool.withdrawFee}%
              {pool.nextWithdrawFee > 0 && (
                <>
                  <br />
                  Next fee: {pool.nextWithdrawFee}% (in {nextFeeHours > 1
                  ? Math.floor(nextFeeHours) + " hours"
                  : Math.floor(nextFeeHours * 60) + " Minutes"})
                </>
              )}
            </SmartDrawerDescription>
          )}
        </SmartDrawerHeader>
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
        <SmartDrawerFooter className="sm:justify-center sm:flex-col sm:max-w-lg sm:mx-auto">
          {action === "Claim" && (
            <FarmClaimButton
              poolId={pool.pid}
              enabled={pool.earned > 0}
              open={action === "Claim" && open}
              close={() => setOpen(false)}
            />
          )}
          {action === "Deposit" && (
            <FarmDepositButton
              poolId={pool.pid}
              value={value}
              max={pool.remainBalance}
              lpToken={pool.token}
              open={action === "Deposit" && open}
              close={() => setOpen(false)}
            />
          )}
          {action === "Withdraw" && (
            <FarmWithdrawButton
              poolId={pool.pid}
              value={value}
              max={pool.balance}
              open={action === "Withdraw" && open}
              close={() => setOpen(false)}
            />
          )}
        </SmartDrawerFooter>
      </SmartDrawerContent>
    </SmartDrawer>
  );
};

const xevoActions = [ "Deposit", "Withdraw" ] as const;
type XEvoAction = typeof xevoActions[number];

interface XEvoSheetProps {
  action: XEvoAction,
  json: string,
  disabled?: boolean
}

const BankSmartDrawer = ({ action = "Deposit", json, disabled }: XEvoSheetProps) => {
  const data = JSON.parse(json, bigIntJsonReviver);
  const [ open, setOpen ] = useState<boolean>(false);
  const [ value, setValue ] = useState<string>("");

  const onOpenChange = (open: boolean) => {
    setOpen(open);

  };

  const onValueChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setValue(value);
  };

  return (
    <SmartDrawer onOpenChange={onOpenChange} open={open}>
      <SmartDrawerTrigger asChild>
        <ChainButton className="w-full font-bold" disabled={disabled}>{action}</ChainButton>
      </SmartDrawerTrigger>
      <SmartDrawerContent>
        <SmartDrawerHeader className="sm:text-center">
          <SmartDrawerTitle>{action} {action === "Deposit" ? "EVO" : "xEVO"}</SmartDrawerTitle>
        </SmartDrawerHeader>
        {action === "Deposit" && (
          <div className="grid w-full max-w-sm items-center gap-1.5 py-4 mx-auto">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="number" id="amount" placeholder="0" value={value} onChange={onValueChange} />
              <Button onClick={() => setValue(formatEther(data.evoUserBalance))}>Max</Button>
            </div>
            <Label> Balance: {formatEther(data.evoUserBalance)}</Label>
          </div>
        )}
        {action === "Withdraw" && (
          <div className="grid w-full max-w-sm items-center gap-1.5 py-4 mx-auto">
            <div className="flex w-full max-w-sm items-center space-x-2">
              <Input type="number" id="amount" placeholder="0" value={value} onChange={onValueChange} />
              <Button onClick={() => setValue(formatEther(data.xEvoUserBalance))}>Max</Button>
            </div>
            <Label> Balance: {formatEther(data.xEvoUserBalance)}</Label>
          </div>
        )}
        <SmartDrawerFooter className="gap-4 sm:justify-center sm:flex-col sm:max-w-lg sm:mx-auto sm:space-x-0">
          {action === "Deposit" && (
            <BankDepositButton
              value={value}
              max={data.evoUserBalance}
              open={action === "Deposit" && open}
              close={() => setOpen(false)}
            />
          )}
          {action === "Withdraw" && (
            <BankWithdrawButton
              value={value}
              max={data.xEvoUserBalance}
              open={action === "Withdraw" && open}
              close={() => setOpen(false)}
            />
          )}
        </SmartDrawerFooter>
      </SmartDrawerContent>
    </SmartDrawer>
  );
};

export { BankSmartDrawer, FarmSmartDrawer };
