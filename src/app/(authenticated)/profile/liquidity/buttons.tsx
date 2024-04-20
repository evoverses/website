import { LpTokenABI } from "@/assets/abi/lp-token";
import { ChainButton } from "@/components/ui/chain-button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { evoContract, investorContract, xEvoContract } from "@/data/contracts";
import { parseViemDetailedError } from "@/lib/viem";
import { Address } from "abitype";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { maxUint256, parseEther } from "viem";
import {
  useAccount,
  useReadContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

interface FarmClaimButtonProps {
  poolId: bigint,
  enabled?: boolean,
  open?: boolean,
  close: () => void,
}

const FarmClaimButton = ({ poolId, enabled, open, close }: FarmClaimButtonProps) => {
  const router = useRouter();
  const { isSuccess } = useSimulateContract({
    ...investorContract,
    functionName: "claimReward",
    args: [ poolId ],
    chainId: 43_114,
    query: {
      enabled,
    },
  });

  const { data, error, isError, writeContract, reset } = useWriteContract();

  const { data: tx } = useWaitForTransactionReceipt({ hash: data, chainId: 43_114, confirmations: 1 });

  useEffect(() => {
    if (!open) {
      reset();
    }
    if (isError) {
      toast.error("There was a problem with your request.");
      reset();
    }
    if (tx) {
      if (tx.status === "success") {
        toast.success("Claim completed successfully");
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
    <ChainButton
      onClick={() => writeContract({
        ...investorContract,
        functionName: "claimReward",
        args: [ poolId ],
        chainId: 43_114,
      })}
      disabled={!isSuccess}
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
}

const FarmDepositButton = ({ poolId, max, value, lpToken, open, close }: DepositButtonProps) => {
  const router = useRouter();
  const { address } = useAccount();
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;

  const { data: allowance, refetch } = useReadContract({
    address: lpToken as Address,
    abi: LpTokenABI,
    functionName: "allowance",
    args: [ address || "0x", investorContract.address ],
    chainId: 43_114,
    query: {
      enabled: validAmount,
    },
  });

  const hasAllowance = (
    allowance || 0n
  ) >= BigInt(1_000_000_000 * 1e18);

  const { isSuccess: isApproveSimulateSuccess } = useSimulateContract({
    address: lpToken as Address,
    abi: LpTokenABI,
    functionName: "approve",
    args: [ investorContract.address, BigInt(100_000_000_000 * 1e18) ],
    chainId: 43_114,
    query: {
      enabled: !hasAllowance,
    },
  });

  const { data: approveHash, writeContract: writeApprove } = useWriteContract();
  const { data: approveResult } = useWaitForTransactionReceipt({
    hash: approveHash,
    chainId: 43_114,
    confirmations: 1,
  });

  const { error: prepareError, isSuccess: isDepositSimulateSuccess } = useSimulateContract({
    ...investorContract,
    functionName: "deposit",
    args: [ poolId, valueBigInt ],
    chainId: 43_114,
    query: {
      enabled: validAmount && hasAllowance,
    },
  });

  const { data: depositHash, isError, error, writeContract: writeDeposit, reset } = useWriteContract();

  const { data: tx } = useWaitForTransactionReceipt({
    hash: depositHash,
    chainId: 43_114,
    confirmations: 1,
  });

  const onClick = () => {
    if (!hasAllowance && isApproveSimulateSuccess) {
      return writeApprove({
        address: lpToken as Address,
        abi: LpTokenABI,
        functionName: "approve",
        args: [ investorContract.address, BigInt(100_000_000_000 * 1e18) ],
        chainId: 43_114,
      });
    }
    if (hasAllowance && isDepositSimulateSuccess) {
      return writeDeposit({
        ...investorContract,
        functionName: "deposit",
        args: [ poolId, valueBigInt ],
        chainId: 43_114,
      });
    } else {
      toast.error(error
        ? `${error}`
        : prepareError
          ? `${prepareError}`
          : validAmount
            ? "Unknown Error"
            : "Invalid amount");
    }
  };

  useEffect(() => {
    if (!open) {
      reset();
    }
    if (!hasAllowance && approveResult?.status === "success") {
      refetch();
    }
    // noinspection DuplicatedCode
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
  }, [ open, isError, error, tx, approveResult, hasAllowance ]);

  return (
    <ChainButton onClick={onClick} disabled={isError || !validAmount}>
      {hasAllowance ? "Deposit" : "Approve"}
    </ChainButton>
  );
};

interface FarmWithdrawButtonProps {
  poolId: bigint,
  max: bigint,
  value: string,
  open?: boolean,
  close: () => void,
}

const FarmWithdrawButton = ({ poolId, max, value, open, close }: FarmWithdrawButtonProps) => {
  const router = useRouter();
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;

  const { isSuccess: isWithdrawSimulateSuccess } = useSimulateContract({
    ...investorContract,
    functionName: "withdraw",
    args: [ poolId, valueBigInt ],
    chainId: 43_114,
    query: {
      enabled: validAmount,
    },
  });

  // noinspection DuplicatedCode
  const { data, error, isError, writeContract, reset } = useWriteContract();

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
        toast.success("Withdrawal completed successfully");
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
    <ChainButton
      onClick={() => writeContract({
        ...investorContract,
        functionName: "withdraw",
        args: [ poolId, valueBigInt ],
        chainId: 43_114,
      })}
      disabled={isError || !validAmount || !isWithdrawSimulateSuccess}
    >Withdraw
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
    args: [ address || "0x0", xEvoContract.address ],
    query: {
      enabled: !!address,
    },
  });

  const isAllowed = allowance >= valueBigInt;

  const { isSuccess: isApproveSimulateSuccess } = useSimulateContract({
    ...evoContract,
    functionName: "approve",
    args: [ xEvoContract.address, approveUnlimited ? maxUint256 : valueBigInt ],
    chainId: 43_114,
    query: {
      enabled: !isAllowed,
    },
  });

  const { data: approveHash, writeContract: writeApprove } = useWriteContract();

  const { data: approveTx } = useWaitForTransactionReceipt({
    hash: approveHash,
    chainId: 43_114,
    confirmations: 1,
  });

  const { isSuccess: isDepositSimulateSuccess } = useSimulateContract({
    ...xEvoContract,
    functionName: "deposit",
    args: [ valueBigInt ],
    chainId: 43_114,
    query: {
      enabled: validAmount && isAllowed && isApproveSimulateSuccess,
    },
  });

  const { data: depositHash, isError, error, writeContract: writeDeposit, reset } = useWriteContract();

  const { data: tx } = useWaitForTransactionReceipt({ hash: depositHash, chainId: 43_114, confirmations: 1 });

  useEffect(() => {
    // noinspection DuplicatedCode
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

    if (approveTx) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ open, isError, error, tx, allowance, isAllowed, approveTx ]);

  if (!isAllowed) {
    return (
      <>
        <div className="flex items-center gap-2 max-sm:mx-auto">
          <Switch
            id="unlimited-approval"
            checked={approveUnlimited}
            onCheckedChange={() => setApproveUnlimited(!approveUnlimited)}
          />
          <Label htmlFor="airplane-mode">Unlimited Approval</Label>
        </div>
        <ChainButton
          onClick={() => writeApprove({
            ...evoContract,
            functionName: "approve",
            args: [ xEvoContract.address, approveUnlimited ? maxUint256 : valueBigInt ],
            chainId: 43_114,
          })}
        >
          Approve
        </ChainButton>
      </>
    );
  }
  return (
    <ChainButton
      onClick={() => writeDeposit({
        ...xEvoContract,
        functionName: "deposit",
        args: [ valueBigInt ],
        chainId: 43_114,
      })}
      disabled={isError || !validAmount || !isDepositSimulateSuccess}
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
  const { isSuccess } = useSimulateContract({
    ...xEvoContract,
    functionName: "withdraw",
    args: [ valueBigInt ],
    chainId: 43_114,
    query: {
      enabled: validAmount,
    },
  });

  // noinspection DuplicatedCode
  const { data, error, isError, writeContract, reset } = useWriteContract();

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
        toast.success("Withdrawal completed successfully");
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
    <ChainButton
      onClick={() => writeContract({
        ...xEvoContract,
        functionName: "withdraw",
        args: [ valueBigInt ],
        chainId: 43_114,
      })}
      disabled={isError || !validAmount || !isSuccess}
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
