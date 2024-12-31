import { LpTokenABI } from "@/assets/abi/lp-token";
import { ChainButton } from "@/components/ui/chain-button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DeadBeef } from "@/data/constants";
import { chain, evoContract, investorContract, xEvoContract } from "@/data/contracts";
import { parseViemDetailedError } from "@/lib/viem";
import { client } from "@/thirdweb.config";
import { deposit, withdraw } from "@/thirdweb/43114/0x693e07bf86367adf8051926f66321fa9e8ebffb4";
import {
  claimReward,
  deposit as investorDeposit,
  withdraw as investorWithdraw,
} from "@/thirdweb/43114/0xd782cf9f04e24cae4953679ebf45ba34509f105c";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type Address, getContract } from "thirdweb";
import { allowance as getAllowance, approve } from "thirdweb/extensions/erc20";
import { useActiveAccount, useReadContract, useSendTransaction, useWaitForReceipt } from "thirdweb/react";
import { maxUint256, parseEther } from "viem";

interface FarmClaimButtonProps {
  poolId: bigint,
  disabled?: boolean,
  open?: boolean,
  close: () => void,
}

const FarmClaimButton = ({ poolId, open, close, disabled }: FarmClaimButtonProps) => {
  const router = useRouter();

  const {
    data: { transactionHash } = { transactionHash: "" as Address },
    error,
    isError,
    mutate: writeContract,
    isPending,
    reset,
  } = useSendTransaction();

  const { isSuccess, isPending: isLoading } = useWaitForReceipt({
    client,
    transactionHash,
    chain,
  });

  const isWaiting = !!transactionHash && isLoading;

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
      onClick={() => writeContract(claimReward({ contract: investorContract, pid: poolId }))}
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
  const { address = DeadBeef } = useActiveAccount() ?? {};
  const valueBigInt = parseEther(value || "0.0");
  const [ approveUnlimited, setApproveUnlimited ] = useState(false);
  const validAmount = valueBigInt > 0 && valueBigInt <= max;
  const contract = getContract({ client, abi: LpTokenABI, address: lpToken, chain });
  const { data: allowance = 0n, refetch } = useReadContract(getAllowance, {
    contract,
    owner: address,
    spender: investorContract.address,
  });

  const isAllowed = allowance > 0n && allowance >= valueBigInt;

  const {
    data: { transactionHash } = { transactionHash: "" as Address },
    error,
    isError,
    mutate: writeContract,
    isPending,
    reset,
  } = useSendTransaction();

  const { isSuccess, isPending: isLoading } = useWaitForReceipt({
    client,
    transactionHash,
    chain,
  });

  const isWaiting = !!transactionHash && isLoading;

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
          onClick={() => writeContract(approve({
            contract: contract,
            spender: investorContract.address,
            amountWei: approveUnlimited ? maxUint256 : valueBigInt,
          }))}
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
      onClick={() => writeContract(investorDeposit({ contract: investorContract, pid: poolId, amount: valueBigInt }))}
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

  const {
    data: { transactionHash } = { transactionHash: "" as Address },
    error,
    isError,
    mutate: writeContract,
    isPending,
    reset,
  } = useSendTransaction();

  const { isSuccess, isPending: isLoading } = useWaitForReceipt({
    client,
    transactionHash,
    chain,
  });

  const isWaiting = !!transactionHash && isLoading;

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
      onClick={() => writeContract(investorWithdraw({ contract: investorContract, pid: poolId, amount: valueBigInt }))}
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
  const { address } = useActiveAccount() ?? {};
  const [ approveUnlimited, setApproveUnlimited ] = useState(false);

  const { data: allowance = 0n, refetch } = useReadContract(getAllowance, {
    contract: evoContract,
    owner: address!,
    spender: xEvoContract.address,
  });

  const isAllowed = allowance > 0n && allowance >= valueBigInt;

  const {
    data: { transactionHash } = { transactionHash: "" as Address },
    error,
    isError,
    mutate: writeContract,
    isPending,
    reset,
  } = useSendTransaction();

  const { isSuccess, isPending: isLoading } = useWaitForReceipt({
    client,
    transactionHash,
    chain,
  });

  const isWaiting = !!transactionHash && isLoading;

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
          onClick={() => writeContract(approve({
            contract: evoContract,
            spender: xEvoContract.address,
            amountWei: valueBigInt,
          }))}
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
      onClick={() => writeContract(deposit({ contract: xEvoContract, amount: valueBigInt }))}
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

  const {
    data: { transactionHash } = { transactionHash: "" as Address },
    error,
    isError,
    mutate: writeContract,
    isPending,
    reset,
  } = useSendTransaction();

  const { isSuccess, isPending: isLoading } = useWaitForReceipt({
    client,
    transactionHash,
    chain,
  });

  const isWaiting = !!transactionHash && isLoading;

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
      onClick={() => writeContract(withdraw({ contract: xEvoContract, amount: valueBigInt }))}
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
