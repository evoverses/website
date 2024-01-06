import { LpTokenABI } from "@/assets/abi/lp-token";
import { ChainButton } from "@/components/ui/chain-button";
import { evoContract, investorContract, xEvoContract } from "@/data/contracts";
import { parseViemDetailedError } from "@/lib/viem";
import { Address } from "abitype";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { parseEther } from "viem";
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";

interface FarmClaimButtonProps {
  poolId: bigint,
  enabled?: boolean,
  open?: boolean,
  close: () => void,
}

const FarmClaimButton = ({ poolId, enabled, open, close }: FarmClaimButtonProps) => {
  const router = useRouter();
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

const FarmDepositButton = ({ poolId, max, value, lpToken, open, close }: DepositButtonProps) => {
  const router = useRouter();
  const { address } = useAccount();
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;

  const { data: allowance, refetch } = useContractRead({
    address: lpToken as Address,
    abi: LpTokenABI,
    functionName: "allowance",
    args: [ address || "0x", investorContract.address ],
    chainId: 43_114,
    enabled: validAmount,
  });

  const hasAllowance = (
    allowance || 0n
  ) >= BigInt(1_000_000_000 * 1e18);

  const { config: approveConfig } = usePrepareContractWrite({
    address: lpToken as Address,
    abi: LpTokenABI,
    functionName: "approve",
    args: [ investorContract.address, BigInt(100_000_000_000 * 1e18) ],
    chainId: 43_114,
    enabled: !hasAllowance,
  });

  const { data: approveTx, write: approveWrite } = useContractWrite(approveConfig);
  const { data: approveResult } = useWaitForTransaction({ hash: approveTx?.hash, chainId: 43_114, confirmations: 1 });

  const { error: prepareError, config } = usePrepareContractWrite({
    ...investorContract,
    functionName: "deposit",
    args: [ poolId, valueBigInt ],
    chainId: 43_114,
    enabled: validAmount && hasAllowance,
  });

  const { data, isError, error, write, reset } = useContractWrite(config);

  const { data: tx } = useWaitForTransaction({ hash: data?.hash, chainId: 43_114, confirmations: 1 });

  const onClick = () => {
    if (!hasAllowance && approveWrite) {
      return approveWrite();
    }
    if (write) {
      return write();
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
    <ChainButton onClick={write} disabled={isError || !validAmount}>Withdraw</ChainButton>
  );
};

interface BankDepositButtonProps {
  max: bigint,
  value: string,
  open?: boolean,
  close: () => void,
}

const BankDepositButton = ({ max, value, open, close }: BankDepositButtonProps) => {
  const router = useRouter();
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;
  const { address } = useAccount();

  const { data: allowance, refetch } = useContractRead({
    ...evoContract,
    functionName: "allowance",
    args: [ address || "0x0", xEvoContract.address ],
    enabled: !!address,
  });

  const isAllowed = BigInt(allowance || 0) >= parseEther("100000000");

  const { config: approveConfig } = usePrepareContractWrite({
    ...evoContract,
    functionName: "approve",
    args: [ xEvoContract.address, parseEther("500000000") ],
    chainId: 43_114,
    enabled: !isAllowed,
  });

  const { data: approveData, write: approveWrite } = useContractWrite(approveConfig);

  const { data: approveTx } = useWaitForTransaction({
    hash: approveData?.hash,
    chainId: 43_114,
    confirmations: 1,
  });

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
      <ChainButton onClick={approveWrite}>Approve</ChainButton>
    );
  }
  return (
    <ChainButton onClick={write} disabled={isError || !validAmount}>Deposit</ChainButton>
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
    <ChainButton onClick={write} disabled={isError || !validAmount}>Withdraw</ChainButton>
  );
};

export {
  FarmClaimButton,
  FarmDepositButton,
  FarmWithdrawButton,
  BankDepositButton,
  BankWithdrawButton,
};
