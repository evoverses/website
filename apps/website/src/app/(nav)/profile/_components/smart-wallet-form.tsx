"use client";
import { DepositEvoSmartDrawer } from "@/app/(nav)/profile/_components/smart-wallet-drawers";
import { WalletButton } from "@/components/buttons/wallet-button";
import { evoContract } from "@/data/contracts";
import type { ERC20TokenBalance } from "@/lib/glacier/types";
import { chain, client } from "@/lib/thirdweb/config";
import { CheckIcon, DownloadIcon, HomeIcon } from "@radix-ui/react-icons";
import { IconProps } from "@radix-ui/react-icons/dist/types";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Icons } from "@workspace/ui/components/icons";
import { ForwardRefExoticComponent, type ReactNode, RefAttributes, useEffect, useMemo } from "react";
import type { Address } from "thirdweb";
import { balanceOf } from "thirdweb/extensions/erc20";
import {
  AccountBalance,
  AccountProvider,
  useActiveWallet,
  useConnect,
  useConnectedWallets,
  useReadContract,
  useSetActiveWallet,
} from "thirdweb/react";
import { formatEther } from "viem";

type AccountCardProps = {
  title: string;
  description: ReactNode;
  icon: ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;
  children?: any;
}

const AccountCard = ({ title, description, icon: Icon, children }: AccountCardProps) => {
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
        <CardFooter className="flex space-x-2">
          {children}
        </CardFooter>
      )}
    </Card>
  );
};

const SmartWalletForm = () => {
  const wallet = useActiveWallet();
  const wallets = useConnectedWallets();
  const address = useMemo(() => {
    const smart = wallets.find(w => w.id === "smart");
    if (smart) {
      return smart.getAccount()?.address as Address;
    }
    return undefined;
  }, [ wallets ]);
  const setActiveWallet = useSetActiveWallet();
  const { connect } = useConnect({
    client,
    accountAbstraction: { chain, sponsorGas: false },
  });
  useEffect(() => {
    if (!wallet) {
      return;
    }
    if (wallets.some(w => w.id === "smart")) {
      return;
    }
    const priorWallet = wallet;
    connect(priorWallet).then(a => {
      setActiveWallet(priorWallet).then();
    });
  }, [ wallet, wallets, setActiveWallet, connect ]);

  const { data: balance = 0n } = useReadContract(
    balanceOf,
    { contract: evoContract, address: address!, queryOptions: { enabled: !!address } },
  );
  if (!address) {
    return null;
  }
  return (
    <>
      <WalletButton />
      <AccountProvider address={address} client={client}>
        <div className="flex flex-wrap gap-4">
          <AccountCard title="Account Status" description="Healthy" icon={CheckIcon} />
          <AccountCard
            title="Smart Wallet"
            description={`${address.slice(0, 4)}...${address.slice(-6)}`}
            icon={HomeIcon}
          />
          <AccountCard
            title="Gas Balance"
            description={<AccountBalance chain={chain} />}
            icon={Icons.currency_dollar as any}
          />
          <AccountCard
            title="EVO Balance"
            description={<AccountBalance chain={chain} tokenAddress={evoContract.address} />}
            icon={Icons.currency_dollar as any}
          >
            <DepositEvoSmartDrawer
              managedWallet={address}
              balance={{ balance: formatEther(balance) } as ERC20TokenBalance}
            />
            <Button variant="destructive" className="w-full">
              <DownloadIcon />
            </Button>
          </AccountCard>
        </div>
      </AccountProvider>
    </>
  );
};

export default SmartWalletForm;
