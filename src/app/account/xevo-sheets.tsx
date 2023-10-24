"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/use-toast";
import { evoContract, xEvoContract } from "@/data/contracts";
import { bigIntJsonReviver } from "@/lib/node";
import { parseViemDetailedError } from "@/lib/viem";
import { ChangeEvent, useEffect, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";

const xevoActions = [ "Deposit", "Withdraw" ] as const;
type XEvoAction = typeof xevoActions[number];

interface XEvoSheetProps {
  action: XEvoAction,
  json: string,
  disabled?: boolean
}

export const XEvoSheet = ({ action = "Deposit", json, disabled }: XEvoSheetProps) => {
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
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetTrigger asChild>
        <Button className="w-full font-bold" disabled={disabled}>{action}</Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader className="sm:text-center">
          <SheetTitle>{action} {action === "Deposit" ? "EVO" : "xEVO"}</SheetTitle>
        </SheetHeader>

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
        <SheetFooter className="sm:justify-center sm:flex-col sm:max-w-lg sm:mx-auto">
          {action === "Deposit" && (
            <DepositButton
              value={value}
              max={data.evoUserBalance}
              open={action === "Deposit" && open}
              close={() => setOpen(false)}
            />
          )}
          {action === "Withdraw" && (
            <WithdrawButton
              value={value}
              max={data.xEvoUserBalance}
              open={action === "Withdraw" && open}
              close={() => setOpen(false)}
            />
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};


interface DepositButtonProps {
  max: bigint,
  value: string,
  open?: boolean,
  close: () => void,
}

const DepositButton = ({  max, value, open, close }: DepositButtonProps) => {
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;
  const { address } = useAccount();
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const { data: allowance } = useContractRead({
    ...evoContract,
    functionName: "allowance",
    args: [ address || "0x0", xEvoContract.address ],
    enabled: !!address,
    watch: !isAllowed,
  })


  const { config: approveConfig } = usePrepareContractWrite({
    ...evoContract,
    functionName: "approve",
    args: [ xEvoContract.address, parseEther("500000000") ],
    chainId: 43_114,
    enabled: !isAllowed,
  });

  const { data: approveData, write: approveWrite } = useContractWrite(approveConfig);

  const { data: approveTx } = useWaitForTransaction({ hash: approveData?.hash, chainId: 43_114, confirmations: 1 });

  const { config } = usePrepareContractWrite({
    ...xEvoContract,
    functionName: "deposit",
    args: [ valueBigInt ],
    chainId: 43_114,
    enabled: validAmount && isAllowed,
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
    const a = allowance ?? 0n;
    if (!isAllowed && a >= parseEther("100000000.0")) {
      setIsAllowed(true);
    }
  }, [ open, isError, error, tx, allowance, isAllowed, approveTx ]);

  if (!isAllowed) {
    return (
      <Button onClick={approveWrite} >Approve</Button>
    )
  }
  return (
    <Button onClick={write} disabled={isError || !validAmount}>Deposit</Button>
  );
};

interface WithdrawButtonProps {
  max: bigint,
  value: string,
  open?: boolean,
  close: () => void,
}

const WithdrawButton = ({ max, value, open, close }: WithdrawButtonProps) => {
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;
  const { config } = usePrepareContractWrite({
    ...xEvoContract,
    functionName: "withdraw",
    args: [ valueBigInt ],
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
