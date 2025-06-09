"use client";
import { DeadBeef } from "@/data/constants";
import { cEvoContract, evoContract, investorContract, xEvoContract } from "@/data/contracts";
import { parseViemDetailedError } from "@/lib/viem";
import { chain, client } from "@/lib/thirdweb/config";
import { deposit, withdraw } from "@/lib/thirdweb/extensions/0x693e07bf86367adf8051926f66321fa9e8ebffb4";
import { claimPending } from "@/lib/thirdweb/extensions/0x7b5501109c2605834f7a4153a75850db7521c37e";
import {
  claimReward,
  deposit as investorDeposit,
  withdraw as investorWithdraw,
} from "@/lib/thirdweb/extensions/0xd782cf9f04e24cae4953679ebf45ba34509f105c";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "@workspace/ui/components/sonner";
import { type Address, getContract } from "thirdweb";
import type { ThirdwebContract } from "thirdweb/contract";
import { allowance as getAllowance, approve } from "thirdweb/extensions/erc20";
import { TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import { maxUint256, parseEther } from "viem";

interface FarmClaimButtonProps {
  poolId: bigint;
  disabled?: boolean;
}

const FarmClaimButton = ({ poolId, disabled }: FarmClaimButtonProps) => {
  const router = useRouter();

  return (
    <Button asChild={true}>
      <TransactionButton
        transaction={() => claimReward({ contract: investorContract, pid: poolId })}
        unstyled
        disabled={disabled}
        onTransactionSent={txResult => {
          toast.loading("Claiming...", { id: txResult.transactionHash, duration: Infinity });
        }}
        onTransactionConfirmed={txReceipt => {
          toast.dismiss(txReceipt.transactionHash);
          toast.success("Claim completed successfully");
          router.refresh();
        }}
        onError={error => {
          toast.dismiss();
          toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
        }}
      >
        Claim
      </TransactionButton>
    </Button>
  );
};

interface DepositButtonProps {
  poolId: bigint,
  max: bigint,
  value: string,
  lpToken: string,
  disabled?: boolean
}

const FarmDepositButton = ({ poolId, max, value, lpToken, disabled }: DepositButtonProps) => {
  const router = useRouter();
  const { address = DeadBeef } = useActiveAccount() ?? {};
  const valueBigInt = parseEther(value || "0.0");
  const [ approveUnlimited, setApproveUnlimited ] = useState(false);
  const validAmount = valueBigInt > 0 && valueBigInt <= max;
  const contract = getContract({ client, address: lpToken, chain });
  const { data: allowance = 0n, refetch } = useReadContract(getAllowance, {
    contract,
    owner: address,
    spender: investorContract.address,
  });

  const isAllowed = allowance > 0n && allowance >= valueBigInt;

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
        <Button asChild={true}>
          <TransactionButton
            transaction={() => approve({
              contract: contract,
              spender: investorContract.address,
              amountWei: approveUnlimited ? maxUint256 : valueBigInt,
            })}
            unstyled
            disabled={disabled || approveUnlimited ? false : !validAmount}
            onTransactionSent={txResult => {
              toast.loading("Approving...", { id: txResult.transactionHash, duration: Infinity });
            }}
            onTransactionConfirmed={txReceipt => {
              toast.dismiss(txReceipt.transactionHash);
              toast.success("Approval completed successfully");
              void refetch();
              router.refresh();
            }}
            onError={error => {
              toast.dismiss();
              toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
            }}
          >
            Approve
          </TransactionButton>
        </Button>
      </>
    );
  }

  return (
    <Button asChild={true}>
      <TransactionButton
        transaction={() => investorDeposit({ contract: investorContract, pid: poolId, amount: valueBigInt })}
        unstyled
        disabled={disabled || !validAmount}
        onTransactionSent={txResult => {
          toast.loading("Depositing...", { id: txResult.transactionHash, duration: Infinity });
        }}
        onTransactionConfirmed={txReceipt => {
          toast.dismiss(txReceipt.transactionHash);
          toast.success("Deposit completed successfully");
          void refetch();
          router.refresh();
        }}
        onError={error => {
          toast.dismiss();
          toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
        }}
      >
        Deposit
      </TransactionButton>
    </Button>
  );
};

interface FarmWithdrawButtonProps {
  poolId: bigint,
  max: bigint,
  value: string,
  disabled?: boolean
}

const FarmWithdrawButton = ({ poolId, max, value, disabled }: FarmWithdrawButtonProps) => {
  const router = useRouter();
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;

  return (
    <Button asChild={true}>
      <TransactionButton
        transaction={() => investorWithdraw({ contract: investorContract, pid: poolId, amount: valueBigInt })}
        unstyled
        disabled={disabled || !validAmount}
        onTransactionSent={txResult => {
          toast.loading("Withdrawing...", { id: txResult.transactionHash, duration: Infinity });
        }}
        onTransactionConfirmed={txReceipt => {
          toast.dismiss(txReceipt.transactionHash);
          toast.success("Withdrawal completed successfully");
          router.refresh();
        }}
        onError={error => {
          toast.dismiss();
          toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
        }}
      >
        Withdraw
      </TransactionButton>
    </Button>
  );
};

interface BankDepositButtonProps {
  max: bigint;
  value: string;
}

const BankDepositButton = ({ max, value = "0.0" }: BankDepositButtonProps) => {
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
        <Button asChild={true}>
          <TransactionButton
            transaction={() => approve({
              contract: evoContract,
              spender: xEvoContract.address,
              amountWei: valueBigInt,
            })}
            unstyled
            disabled={!validAmount}
            onTransactionSent={txResult => {
              toast.loading("Approving...", { id: txResult.transactionHash, duration: Infinity });
            }}
            onTransactionConfirmed={txReceipt => {
              toast.dismiss(txReceipt.transactionHash);
              toast.success("Approval completed successfully");
              void refetch();
              router.refresh();
            }}
            onError={error => {
              toast.dismiss();
              toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
            }}
          >
            Approve
          </TransactionButton>
        </Button>
      </>
    );
  }
  return (
    <Button asChild={true}>
      <TransactionButton
        transaction={() => deposit({ contract: xEvoContract, amount: valueBigInt })}
        unstyled
        disabled={!validAmount}
        onTransactionSent={txResult => {
          toast.loading("Depositing...", { id: txResult.transactionHash, duration: Infinity });
        }}
        onTransactionConfirmed={txReceipt => {
          toast.dismiss(txReceipt.transactionHash);
          toast.success("Deposit completed successfully");
          void refetch();
          router.refresh();
        }}
        onError={error => {
          toast.dismiss();
          toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
        }}
      >
        Deposit
      </TransactionButton>
    </Button>
  );
};

interface BankWithdrawButtonProps {
  max: bigint;
  value: string;
}

const BankWithdrawButton = ({ max, value }: BankWithdrawButtonProps) => {
  const router = useRouter();
  const valueBigInt = parseEther(value || "0.0");
  const validAmount = valueBigInt > 0 && valueBigInt <= max;

  return (
    <Button asChild={true}>
      <TransactionButton
        transaction={() => withdraw({ contract: xEvoContract, amount: valueBigInt })}
        unstyled
        disabled={!validAmount}
        onTransactionSent={txResult => {
          toast.loading("Withdrawing...", { id: txResult.transactionHash, duration: Infinity });
        }}
        onTransactionConfirmed={txReceipt => {
          toast.dismiss(txReceipt.transactionHash);
          toast.success("Withdrawal completed successfully");
          router.refresh();
        }}
        onError={error => {
          toast.dismiss();
          toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
        }}
      >
        Withdraw
      </TransactionButton>
    </Button>
  );
};

interface ClaimButtonProps {
  disabled?: boolean;
}

const ClaimCEvoButton = ({ disabled }: ClaimButtonProps) => {
  const router = useRouter();

  return (
    <Button asChild={true} className="w-full font-bold">
      <TransactionButton
        transaction={() => claimPending({ contract: cEvoContract })}
        unstyled
        disabled={disabled}
        onTransactionSent={txResult => {
          toast.loading("Claiming...", { id: txResult.transactionHash, duration: Infinity });
        }}
        onTransactionConfirmed={txReceipt => {
          toast.dismiss(txReceipt.transactionHash);
          toast.success("Claim completed successfully");
          router.refresh();
        }}
        onError={error => {
          toast.dismiss();
          toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
        }}
      >
        Claim
      </TransactionButton>
    </Button>
  );
};

type RevokeApprovalButtonProps = {
  contract: ThirdwebContract<any, Address>;
  spender: Address;
  disabled?: boolean;
}

const RevokeApprovalButton = ({ contract, spender, disabled }: RevokeApprovalButtonProps) => {
  const router = useRouter();

  return (
    <Button asChild={true} className="font-bold">
      <TransactionButton
        transaction={() => approve({ contract, spender, amountWei: 0n })}
        unstyled
        disabled={disabled}
        onTransactionSent={txResult => {
          toast.loading("Revoking...", { id: txResult.transactionHash, duration: Infinity });
        }}
        onTransactionConfirmed={txReceipt => {
          toast.dismiss(txReceipt.transactionHash);
          toast.success("Revoke completed successfully");
          router.refresh();
        }}
        onError={error => {
          toast.dismiss();
          toast.error(parseViemDetailedError(error)?.details || "There was a problem with your request.");
        }}
      >
        Revoke
      </TransactionButton>
    </Button>
  );
};

export {
  FarmClaimButton,
  FarmDepositButton,
  FarmWithdrawButton,
  BankDepositButton,
  BankWithdrawButton,
  ClaimCEvoButton,
  RevokeApprovalButton,
};
