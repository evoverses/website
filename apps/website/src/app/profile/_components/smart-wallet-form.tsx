"use client";

import { DepositEvoSmartDrawer } from "@/app/profile/_components/smart-wallet-drawers";
import { evoContract } from "@/data/contracts";
import { chain, client } from "@/lib/thirdweb/config";
import { useSmartWallet } from "@/lib/thirdweb/hooks/use-profiles";
import { shortenAddress } from "@/utils/strings";
import { CheckIcon, DownloadIcon, HomeIcon } from "@radix-ui/react-icons";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Icons } from "@workspace/ui/components/icons";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { type PropsWithChildren, type ReactNode } from "react";
import { useIsAutoConnecting, useWalletBalance } from "thirdweb/react";
import { Address } from "viem";

type AccountCardProps = {
  title: string;
  description: ReactNode;
  icon: typeof Icons.currency_dollar | typeof CheckIcon;
}

const AccountCard = ({ title, description, icon: Icon, children }: PropsWithChildren<AccountCardProps>) => {
  return (
    <Card className="flex flex-col w-full sm:max-w-[220px]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-2xl font-bold">{description}</div>
      </CardContent>
      {children && (
        <CardFooter className="flex gap-2">
          {children}
        </CardFooter>
      )}
    </Card>
  );
};

const SmartWalletForm = () => {
  const isAutoConnecting = useIsAutoConnecting();
  const smartWallet = useSmartWallet();
  const address = smartWallet?.getAccount()?.address as Address;

  const {
    data: evoBalance = { value: 0n, displayValue: "0", symbol: "EVO" },
    isLoading: isEvoBalanceLoading,
    isFetching: isEvoBalanceFetching,
  } = useWalletBalance({
    client,
    chain,
    address: address!,
    tokenAddress: evoContract.address,
  }, { enabled: !!address });

  const {
    data: avaxBalance = { value: 0n, displayValue: "0", symbol: "AVAX" },
    isLoading: isAvaxBalanceLoading,
    isFetching: isAvaxBalanceFetching,
  } = useWalletBalance({
    client,
    chain,
    address: address!,
  }, { enabled: !!address });

  return (
    <div className="flex flex-wrap gap-4">
      <AccountCard
        title="Account Status"
        description={(
          isAutoConnecting || !address
        ) ? <Skeleton className="h-6 w-1/2" /> : "Healthy"}
        icon={CheckIcon}
      />
      <AccountCard
        title="Game Wallet"
        description={(
          isAutoConnecting || !address
        ) ? <Skeleton className="h-6 w-1/2" /> : shortenAddress(address)}
        icon={HomeIcon}
      />
      <AccountCard
        title="Gas Balance"
        description={isAutoConnecting || isAvaxBalanceLoading || isAvaxBalanceFetching
          ? <Skeleton className="h-6 w-1/2" />
          : <span>{avaxBalance.displayValue} {avaxBalance.symbol}</span>
        }
        icon={Icons.currency_dollar}
      />
      <AccountCard
        title="EVO Balance"
        description={isAutoConnecting || isEvoBalanceLoading || isEvoBalanceFetching
          ? <Skeleton className="h-6 w-1/2" />
          : <span>{evoBalance.displayValue} {evoBalance.symbol}</span>
        }
        icon={Icons.currency_dollar}
      >
        <DepositEvoSmartDrawer
          managedWallet={address}
          className="flex-1"
        />
        <Button variant="destructive" className="flex-1">
          <DownloadIcon />
        </Button>
      </AccountCard>
    </div>
  );
};

export default SmartWalletForm;
