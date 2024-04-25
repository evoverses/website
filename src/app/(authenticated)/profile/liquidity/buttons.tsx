import { LpTokenABI } from "@/assets/abi/lp-token";
import { ChainButton } from "@/components/ui/chain-button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DeadBeef } from "@/data/constants";
import { evoContract, investorContract, xEvoContract } from "@/data/contracts";
import { parseViemDetailedError } from "@/lib/viem";
import { Address } from "abitype";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { maxUint256, parseEther } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

interface FarmClaimButtonProps {
  poolId: bigint,
  disabled?: boolean,
  open?: boolean,
  close: () => void,
}

const FarmClaimButton = ({ poolId, open, close, disabled }: FarmClaimButtonProps) => {
  const router = useRouter();

  const { data: hash, error, isError, writeContract, isPending, reset } = useWriteContract();

  const { isSuccess, isPending: isLoading } = useWaitForTransactionReceipt({
    hash,
    chainId: 43_114,
    confirmations: 1,
  });

  const isWaiting = !!hash && isLoading;

  useEffect(() => {
    if (!open) {
      reset();
    }
    if (isError) {
      toast.error("There was a problem with your request.");
      reset();
    }
    if (isSuccess) {
      toast.success("Claim completed successfully");
      close();
      reset();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ open, isError, error, isSuccess, reset ]);

  // noinspection OverlyComplexBooleanExpressionJS
  return (
    <ChainButton
      onClick={() => writeContract({
        ...investorContract,
        functionName: "claimReward",
        args: [ poolId ],
        chainId: 43_114,
      })}
      disabled={isPending || isWaiting || isSuccess || disabled}
      loading={isPending || isWaiting}
      success={isSuccess}
    >
      Claim
    </ChainButton>
  );
};

interface DepositButtonProps {
  poolId: bigint,
  max: bigint,
  value: string,
  lpToken: string,
  open?: boolean,
  close: () => void,
  disabled?: boolean
}

const FarmDepositButton = ({ poolId, max, value, lpToken, open, close, disabled }: DepositButtonProps) => {
  const router = useRouter();
  const { address = DeadBeef } = useAccount();
  const valueBigInt = parseEther(value || "0.0");
  const [ approveUnlimited, setApproveUnlimited ] = useState(false);
  const validAmount = valueBigInt > 0 && valueBigInt <= max;

  const { data: allowance = 0n, refetch } = useReadContract({
    address: lpToken as Address,
    abi: LpTokenABI,
    functionName: "allowance",
    args: [ address, investorContract.address ],
    chainId: 43_114,
    query: {
      enabled: validAmount,
    },
  });

  const isAllowed = allowance > 0n && allowance >= valueBigInt;

  const { data: hash, isError, error, writeContract, isPending, reset } = useWriteContract();

  const { isSuccess, isPending: isLoading } = useWaitForTransactionReceipt({
    hash,
    chainId: 43_114,
    confirmations: 1,
  });

  const isWaiting = !!hash && isLoading;

  useEffect(() => {
    if (!open) {
      reset();
    }
    if (!isAllowed && isSuccess) {
      toast.success("Approval completed successfully");
      refetch();
      reset();
      return;
    }
    // noinspection DuplicatedCode
    if (isError) {
      toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
      reset();
    }
    if (isAllowed && isSuccess) {
      toast.success("Deposit completed successfully");
      reset();
      router.refresh();
    }
    if (max === 0n) {
      close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ open, isError, error, isSuccess, isAllowed, reset, refetch, max ]);

  if (!isAllowed) {
    // noinspection OverlyComplexBooleanExpressionJS
    return (
      <>
        <div className="flex items-center gap-2 max-sm:mx-auto">
          <Switch
            id="unlimited-approval"
            checked={approveUnlimited}
            onCheckedChange={() => setApproveUnlimited(!approveUnlimited)}
          />
          <Label htmlFor="unlimited-approval">Unlimited Approval</Label>
        </div>
        <ChainButton
          onClick={() => writeContract({
            address: lpToken as Address,
            abi: LpTokenABI,
            functionName: "approve",
            args: [ investorContract.address, approveUnlimited ? maxUint256 : valueBigInt ],
            chainId: 43_114,
          })}
          disabled={disabled || isPending || isWaiting || approveUnlimited ? false : !validAmount}
          loading={isPending || isWaiting}
          success={isSuccess}
        >
          Approve
        </ChainButton>
      </>
    );
  }

  return (
    <ChainButton
      onClick={() => writeContract({
        ...investorContract,
        functionName: "deposit",
        args: [ poolId, valueBigInt ],
        chainId: 43_114,
      })}
      disabled={isPending || isWaiting || !validAmount}
      loading={isPending || isWaiting}
      success={isSuccess}
    >
      Deposit
    </ChainButton>
  );
};

interface FarmWithdrawButtonProps {
  poolId: bigint,
  max: bigint,
  value: string,
  open?: boolean,
  close: () => void,
  disabled?: boolean
}

const FarmWithdrawButton = ({ poolId, max, value, open, close, disabled }: FarmWithdrawButtonProps) => {
  const router = useRouter();
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;

  const { data: hash, error, isError, isPending, writeContract, reset } = useWriteContract();

  const { isSuccess, isPending: isLoading } = useWaitForTransactionReceipt({
    hash,
    chainId: 43_114,
    confirmations: 1,
  });
  const isWaiting = !!hash && isLoading;

  useEffect(() => {
    if (!open) {
      reset();
    }
    if (isError) {
      toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
      reset();
    }
    if (isSuccess) {
      toast.success("Withdrawal completed successfully");
      close();
      reset();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ open, isError, error, isSuccess, reset ]);

  // noinspection OverlyComplexBooleanExpressionJS
  return (
    <ChainButton
      onClick={() => writeContract({
        ...investorContract,
        functionName: "withdraw",
        args: [ poolId, valueBigInt ],
        chainId: 43_114,
      })}
      disabled={!validAmount || isPending || isWaiting || disabled}
      loading={isPending || isWaiting}
      success={isSuccess}
    >
      Withdraw
    </ChainButton>
  );
};

interface BankDepositButtonProps {
  max: bigint,
  value: string,
  open?: boolean,
  close: () => void,
}

const BankDepositButton = ({ max, value = "0.0", open, close }: BankDepositButtonProps) => {
  const router = useRouter();
  const valueBigInt = parseEther(value);
  const validAmount = valueBigInt > 0 && valueBigInt <= max;
  const { address } = useAccount();
  const [ approveUnlimited, setApproveUnlimited ] = useState(false);

  const { data: allowance = 0n, refetch } = useReadContract({
    ...evoContract,
    functionName: "allowance",
    args: [ address!, xEvoContract.address ],
    query: {
      enabled: !!address,
    },
  });

  const isAllowed = allowance > 0n && allowance >= valueBigInt;

  const { data: hash, isError, error, writeContract, isPending, reset } = useWriteContract();
  const { isPending: isLoading, isSuccess } = useWaitForTransactionReceipt({
    hash,
    chainId: 43_114,
    confirmations: 1,
  });

  const isWaiting = !!hash && isLoading;

  useEffect(() => {
    // noinspection DuplicatedCode
    if (!open) {
      reset();
    }
    if (isError) {
      toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
      reset();
    }
    if (isSuccess) {
      if (!isAllowed) {
        toast.success("Approval completed successfully");
        refetch();
        reset();
      } else {
        toast.success("Deposit completed successfully");
        reset();
        close();
        router.refresh();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ open, isError, error, allowance, isAllowed, isSuccess, refetch, reset ]);

  if (!isAllowed) {
    return (
      <>
        <div className="flex items-center gap-2 max-sm:mx-auto">
          <Switch
            id="unlimited-approval"
            checked={approveUnlimited}
            onCheckedChange={() => setApproveUnlimited(!approveUnlimited)}
          />
          <Label htmlFor="unlimited-approval">Unlimited Approval</Label>
        </div>
        <ChainButton
          onClick={() => writeContract({
            ...evoContract,
            functionName: "approve",
            args: [ xEvoContract.address, approveUnlimited ? maxUint256 : valueBigInt ],
            chainId: 43_114,
          })}
          disabled={isPending || isSuccess || isWaiting}
          success={isSuccess}
          loading={isWaiting || isPending}
        >
          Approve
        </ChainButton>
      </>
    );
  }
  return (
    <ChainButton
      onClick={() => writeContract({
        ...xEvoContract,
        functionName: "deposit",
        args: [ valueBigInt ],
        chainId: 43_114,
      })}
      disabled={isPending || !validAmount || isSuccess}
      loading={isWaiting || isPending}
      success={isSuccess}
    >
      Deposit
    </ChainButton>
  );
};

interface BankWithdrawButtonProps {
  max: bigint,
  value: string,
  open?: boolean,
  close: () => void,
}

const BankWithdrawButton = ({ max, value, open, close }: BankWithdrawButtonProps) => {
  const router = useRouter();
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;

  const { data: hash, error, isError, isPending, writeContract, reset } = useWriteContract();

  const { isSuccess, isPending: isLoading } = useWaitForTransactionReceipt({
    hash,
    chainId: 43_114,
    confirmations: 1,
  });
  const isWaiting = !!hash && isLoading;

  useEffect(() => {
    if (!open) {
      reset();
    }
    if (isError) {
      toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
      reset();
    }
    if (isSuccess) {
      toast.success("Withdrawal completed successfully");
      close();
      reset();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ open, isError, error, isSuccess, reset ]);

  return (
    <ChainButton
      onClick={() => writeContract({
        ...xEvoContract,
        functionName: "withdraw",
        args: [ valueBigInt ],
        chainId: 43_114,
      })}
      disabled={isPending || !validAmount || isWaiting}
      loading={isPending || isWaiting}
      success={isSuccess}
    >
      Withdraw
    </ChainButton>
  );
};

export {
  FarmClaimButton,
  FarmDepositButton,
  FarmWithdrawButton,
  BankDepositButton,
  BankWithdrawButton,
};
