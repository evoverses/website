"use client";

import {
  BankDepositButton,
  BankWithdrawButton,
  FarmClaimButton,
  FarmDepositButton,
  FarmWithdrawButton,
  RevokeApprovalButton,
} from "@/app/(authenticated)/profile/liquidity/buttons";
import { bigIntJsonReviver } from "@/lib/node";
import { cn } from "@/lib/utils";
import { chain, client } from "@/thirdweb.config";
import { Pool } from "@/types/core";
import { Button } from "@workspace/ui/components/button";
import { ChainButton } from "@workspace/ui/components/chain-button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import {
  SmartDrawer,
  SmartDrawerContent,
  SmartDrawerDescription,
  SmartDrawerFooter,
  SmartDrawerHeader,
  SmartDrawerTitle,
  SmartDrawerTrigger,
} from "@workspace/ui/components/smart-drawer";
import { ChangeEvent, useState } from "react";
import { TbCloudCancel } from "react-icons/tb";
import type { Address } from "thirdweb";
import type { ThirdwebContract } from "thirdweb/contract";
import { allowance } from "thirdweb/extensions/erc20";
import { TokenName, TokenProvider, TokenSymbol, useActiveAccount, useReadContract } from "thirdweb/react";
import { formatEther, maxUint256 } from "viem";

const FarmActions = [ "Deposit", "Withdraw", "Claim" ] as const;
type FarmAction = typeof FarmActions[number];

interface FarmSheetProps {
  action: FarmAction,
  poolJson: string,
  disabled?: boolean
}

const FarmSmartDrawer = ({ action = "Deposit", poolJson, disabled }: FarmSheetProps) => {
  const pool: Pool = JSON.parse(poolJson, bigIntJsonReviver);
  const [ value, setValue ] = useState<string>("");

  const onValueChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setValue(value);
  };

  const nextFeeHours = pool.nextSecondsRemaining / 60 / 60;
  return (
    <SmartDrawer>
      <SmartDrawerTrigger asChild>
        <ChainButton className="w-full font-bold">{action}</ChainButton>
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
        <SmartDrawerFooter className="gap-4 sm:justify-center sm:flex-col sm:max-w-lg sm:mx-auto sm:space-x-0">
          {action === "Claim" && (
            <FarmClaimButton
              poolId={pool.pid}
              disabled={pool.earned === 0n || disabled}
            />
          )}
          {action === "Deposit" && (
            <FarmDepositButton
              poolId={pool.pid}
              value={value}
              max={pool.remainBalance}
              lpToken={pool.token}
              disabled={disabled}
            />
          )}
          {action === "Withdraw" && (
            <FarmWithdrawButton
              poolId={pool.pid}
              value={value}
              max={pool.balance}
              disabled={disabled}
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
  const [ value, setValue ] = useState<string>("");

  const onValueChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    setValue(value);
  };

  return (
    <SmartDrawer>
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
            />
          )}
          {action === "Withdraw" && (
            <BankWithdrawButton
              value={value}
              max={data.xEvoUserBalance}
            />
          )}
        </SmartDrawerFooter>
      </SmartDrawerContent>
    </SmartDrawer>
  );
};

type RevokeSmartDrawerProps = {
  contract: ThirdwebContract<any, Address>;
  spender: Address;
  className?: string;
}

const RevokeSmartDrawer = ({ contract, spender, className }: RevokeSmartDrawerProps) => {
  const { address } = useActiveAccount() ?? {};

  const { data = 0n } = useReadContract(allowance, {
    contract,
    spender,
    owner: address!,
  });

  const currentAllowance = data === maxUint256 ? "unlimited" : Number(formatEther(data)).toLocaleString();

  return (
    <SmartDrawer>
      <SmartDrawerTrigger className={cn({ hidden: data === 0n }, className)}>
        <TbCloudCancel className="w-6 h-6" />
      </SmartDrawerTrigger>
      <SmartDrawerContent>
        <SmartDrawerHeader className="sm:text-center">
          <SmartDrawerTitle>Revoke Allowance</SmartDrawerTitle>
        </SmartDrawerHeader>
        <TokenProvider address={contract.address} client={client} chain={chain}>
          <span className="px-4 text-center">
            Revoking allowance will set your <TokenSymbol /> allowance from {currentAllowance} to 0 for
            the <TokenName /> contract. Are you sure?
          </span>
        </TokenProvider>
        <SmartDrawerFooter className="gap-4 sm:justify-center sm:flex-col sm:max-w-lg sm:mx-auto sm:space-x-0">
          <RevokeApprovalButton contract={contract} spender={spender} />
        </SmartDrawerFooter>
      </SmartDrawerContent>
    </SmartDrawer>
  );
};
export { BankSmartDrawer, FarmSmartDrawer, RevokeSmartDrawer };
