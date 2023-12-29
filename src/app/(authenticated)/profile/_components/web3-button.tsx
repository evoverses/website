"use client";
import { updateUserReadOnlyDataAction } from "@/app/(authenticated)/profile/_components/actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { typedData } from "@/data/viem/signature";
import { getCsrfToken } from "@/lib/auth";
import { UserReadOnlyData } from "@/lib/playfab/helpers";
import { cn } from "@/lib/utils";
import { IAccountCookie } from "@/types/cookies";
import { Address } from "abitype";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { recoverTypedDataAddress, verifyTypedData } from "viem";

import { useAccount, useWalletClient } from "wagmi";

type LinkWalletButtonProps = {
  playFabId: string;
  accountCookie: IAccountCookie
  readOnlyData: UserReadOnlyData;
  className?: string
}

export const LinkWalletButton = ({ playFabId, accountCookie, className, readOnlyData }: LinkWalletButtonProps) => {
  const router = useRouter();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [ mounted, setMounted ] = useState(false);
  const isConnected = readOnlyData.wallets.connected.includes(address as Address);
  useEffect(() => {
    setMounted(true);
  }, []);

  const onClick = async () => {
    if (!walletClient || !address) {
      return window.alert("Wallet not connected");
    }
    const nonce = await getCsrfToken();
    if (!nonce) {
      return window.alert("Nonce not found");
    }
    try {
      const signature = await walletClient.signTypedData({
        account: walletClient.account,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: {
          from: { wallet: address!, nonce },
          contents: typedData.contents,
        },
      });

      const wallet = await recoverTypedDataAddress({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: {
          from: { wallet: address, nonce },
          contents: typedData.contents,
        },
        signature,
      });

      const valid = await verifyTypedData({
        address,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: { from: { wallet, nonce }, contents: typedData.contents },
        signature: signature,
      });
      if (!valid) {
        throw new Error("Invalid signature");
      }
      const newReadOnlyData = {
        ...readOnlyData,
        wallets: {
          ...readOnlyData.wallets,
          connected: [ ...readOnlyData.wallets.connected.filter(a => a !== address), address ],
        },
      };
      await updateUserReadOnlyDataAction(playFabId, newReadOnlyData);
      router.refresh();

    } catch (error) {
      toast({
        title: "Error",
        description: `${error}`,
        variant: "destructive",
      });
    }
  };

  return mounted ? (
    <Button
      type="button"
      className={cn(className)}
      onClick={onClick}
      disabled={!readOnlyData.wallets.managed || isConnected}
    >
      {accountCookie.loggedIn
        ? readOnlyData.wallets.managed
          ? isConnected
            ? "Linked"
            : "Link"
          : "No Smart Account"
        : "Wallet Not Connected"}
    </Button>
  ) : (
    <Button disabled className={cn(className)}>
      <AiOutlineLoading />
    </Button>
  );
};
