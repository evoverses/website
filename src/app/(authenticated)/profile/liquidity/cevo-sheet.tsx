"use client";

import { toast } from "@/components/ui/use-toast";
import { cEvoContract } from "@/data/contracts";
import { parseViemDetailedError } from "@/lib/viem";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import { ChainButton } from "@/components/ui/chain-button";

interface ClaimButtonProps {
  disabled?: boolean;
}

export const ClaimCEvoButton = ({disabled}: ClaimButtonProps) => {
  const router = useRouter();
  const {address} = useAccount();

  const {config} = usePrepareContractWrite({
    ...cEvoContract,
    functionName: "claimPending",
    chainId: 43_114,
    enabled: !disabled && !!address,
  });

  const {data, isError, error, write, reset} = useContractWrite(config);

  const {data: tx} = useWaitForTransaction({hash: data?.hash, chainId: 43_114, confirmations: 1});

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
        toast({title: "Success!", description: "Claim completed successfully"});
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
  }, [isError, error, tx]);

  return (
    <ChainButton className="w-full font-bold" onClick={write} disabled={isError || disabled}>Claim</ChainButton>
  );
};
