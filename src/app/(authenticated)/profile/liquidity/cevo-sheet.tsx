"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { cEvoContract } from "@/data/contracts";
import { parseViemDetailedError } from "@/lib/viem";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";

interface ClaimButtonProps {
  disabled?: boolean;
}

export const ClaimCEvoButton = ({ disabled }: ClaimButtonProps) => {
  const router = useRouter();
  const { address } = useAccount();

  const { config } = usePrepareContractWrite({
    ...cEvoContract,
    functionName: "claimPending",
    chainId: 43_114,
    enabled: !disabled && !!address,
  });

  const { data, isError, error, write, reset } = useContractWrite(config);

  const { data: tx } = useWaitForTransaction({ hash: data?.hash, chainId: 43_114, confirmations: 1 });

  useEffect(() => {

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

  }, [ isError, error, tx ]);

  return (
    <Button className="w-full font-bold" onClick={write} disabled={isError || disabled || !address}>Claim</Button>
  );
};
