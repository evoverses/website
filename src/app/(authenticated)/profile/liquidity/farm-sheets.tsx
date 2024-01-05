"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { investorContract } from "@/data/contracts";
import { bigIntJsonReviver } from "@/lib/node";
import { parseViemDetailedError } from "@/lib/viem";
import { Pool } from "@/types/core";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import {
  SmartDrawer,
  SmartDrawerContent,
  SmartDrawerDescription,
  SmartDrawerFooter,
  SmartDrawerHeader,
  SmartDrawerTitle,
  SmartDrawerTrigger
} from "@/components/ui/smart-drawer";
import { ChainButton } from "@/components/ui/chain-button";
import { Address } from "abitype";
import { LpTokenABI } from "@/assets/abi/lp-token";

const FarmActions = ["Deposit", "Withdraw", "Claim"] as const;
type FarmAction = typeof FarmActions[number];

interface FarmSheetProps {
  action: FarmAction,
  poolJson: string,
  disabled?: boolean
}

export const FarmSheet = ({action = "Deposit", poolJson, disabled}: FarmSheetProps) => {
  const pool: Pool = JSON.parse(poolJson, bigIntJsonReviver);
  const [open, setOpen] = useState<boolean>(false);
  const [value, setValue] = useState<string>("");

  const onOpenChange = (open: boolean) => {
    setOpen(open);

  };

  const onValueChange = ({target: {value}}: ChangeEvent<HTMLInputElement>) => {
    setValue(value);
  };

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
              <br/>
              ~{(
              Number(pool.earned) / 1e18
            ).toLocaleString()} EVO
            </SmartDrawerDescription>
          )}
          {action === "Deposit" && (
            <SmartDrawerDescription>
              EvoVerses currently has deposit fees minimized. Once fee reflection features are released, this is
              subject to change.
              <Separator className="my-2"/>
              Deposit fee: {Number(pool.depFee) / 100}%
            </SmartDrawerDescription>
          )}
          {action === "Withdraw" && (
            <SmartDrawerDescription>
              EvoVerses utilizes LP withdrawal fees as a disincentive for short term farming and selling.
              <Separator className="my-2"/>
              Current fee: {Number(pool.withdrawFee) / 100}%
              {pool.nextWithdrawFee > 0 && (
                <>
                  <br/>
                  Next fee: {pool.nextWithdrawFee}% (in {Math.floor(pool.nextSecondsRemaining / 60 / 60)} hours)
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
              <Input type="number" id="amount" placeholder="0" value={value} onChange={onValueChange}/>
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
              <Input type="number" id="amount" placeholder="0" value={value} onChange={onValueChange}/>
              <Button onClick={() => setValue(formatEther(pool.balance))}>Max</Button>
            </div>
            <Label> Balance: {formatEther(pool.balance)}</Label>
          </div>
        )}
        <SmartDrawerFooter className="sm:justify-center sm:flex-col sm:max-w-lg sm:mx-auto">
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
              lpToken={pool.token}
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
        </SmartDrawerFooter>
      </SmartDrawerContent>
    </SmartDrawer>
  );
};


interface ClaimButtonProps {
  poolId: bigint,
  enabled?: boolean,
  open?: boolean,
  close: () => void,
}

const ClaimButton = ({poolId, enabled, open, close}: ClaimButtonProps) => {
  const router = useRouter();
  const {config} = usePrepareContractWrite({
    ...investorContract,
    functionName: "claimReward",
    args: [poolId],
    chainId: 43_114,
    enabled,
  });

  const {data, error, isError, write, reset} = useContractWrite(config);

  const {data: tx} = useWaitForTransaction({hash: data?.hash, chainId: 43_114, confirmations: 1});

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
        toast({title: "Success!", description: "Claim completed successfully"});
        close();
        reset();
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: parseViemDetailedError(error)?.details || "There was a problem with your request.",
        });
        reset();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isError, error, tx]);

  return (
    <ChainButton onClick={write} disabled={isError}>Claim</ChainButton>
  );
};

interface DepositButtonProps {
  poolId: bigint,
  max: bigint,
  value: string,
  lpToken: string,
  open?: boolean,
  close: () => void,
}

const DepositButton = ({poolId, max, value, lpToken, open, close}: DepositButtonProps) => {
  const router = useRouter();
  const { address } = useAccount();
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;

  const { data: allowance = 0n, refetch } = useContractRead({
    address: lpToken as Address,
    abi: LpTokenABI,
    functionName: "allowance",
    args: [address || "0x", investorContract.address],
    chainId: 43_114,
    enabled: validAmount,
  })

  const hasAllowance = allowance >= BigInt(1_000_000_000 * 1e18);

  const { config: approveConfig } = usePrepareContractWrite({
    address: lpToken as Address,
    abi: LpTokenABI,
    functionName: "approve",
    args: [investorContract.address, BigInt(100_000_000_000 * 1e18)],
    chainId: 43_114,
    enabled: !hasAllowance
  })

  const { data: approveTx, write: approveWrite } = useContractWrite(approveConfig);
  const { data: approveResult } = useWaitForTransaction({ hash: approveTx?.hash, chainId: 43_114, confirmations: 1  })

  const {error: prepareError, config} = usePrepareContractWrite({
    ...investorContract,
    functionName: "deposit",
    args: [poolId, valueBigInt],
    chainId: 43_114,
    enabled: validAmount && hasAllowance,
  });

  const {data, isError, error, write, reset} = useContractWrite(config);

  const {data: tx} = useWaitForTransaction({hash: data?.hash, chainId: 43_114, confirmations: 1});

  const onClick = () => {
    if (approveWrite) {
      return approveWrite();
    }
    if (write) {
      return write();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: error ? `${error}` : prepareError ? `${prepareError}` : validAmount ? "Unknown Error" : "Invalid amount"
      })
    }
  }

  useEffect(() => {
    if (!open) {
      reset();
    }
    if (!hasAllowance && approveResult?.status === "success") {
      refetch()
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
        toast({title: "Success!", description: "Deposit completed successfully"});
        close();
        reset();
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: parseViemDetailedError(error)?.details || "There was a problem with your request.",
        });
        reset();

      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isError, error, tx, approveResult, hasAllowance]);

  return (
    <ChainButton onClick={onClick} disabled={isError || !validAmount}>
      {hasAllowance ? "Deposit" : "Approve"}
    </ChainButton>
  );
};

interface WithdrawButtonProps {
  poolId: bigint,
  max: bigint,
  value: string,
  open?: boolean,
  close: () => void,
}

const WithdrawButton = ({poolId, max, value, open, close}: WithdrawButtonProps) => {
  const router = useRouter();
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;

  const {config} = usePrepareContractWrite({
    ...investorContract,
    functionName: "withdraw",
    args: [poolId, valueBigInt],
    chainId: 43_114,
    enabled: validAmount,
  });

  const {data, error, isError, write, reset} = useContractWrite(config);

  const {data: tx} = useWaitForTransaction({hash: data?.hash, chainId: 43_114, confirmations: 1});

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
        toast({title: "Success!", description: "Withdrawal completed successfully"});
        close();
        reset();
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: parseViemDetailedError(error)?.details || "There was a problem with your request.",
        });
        reset();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isError, error, tx]);

  return (
    <ChainButton onClick={write} disabled={isError || !validAmount}>Withdraw</ChainButton>
  );
};
