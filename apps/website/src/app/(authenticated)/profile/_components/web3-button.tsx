"use client";
import { updateUserReadOnlyDataAction } from "@/app/(authenticated)/profile/_components/actions";
import { ChainButton } from "@/components/buttons/chain-button";
import { typedData } from "@/data/viem/signature";
import { getCsrfToken } from "@/lib/auth";
import { UserReadOnlyData } from "@/lib/playfab/helpers";
import { cn } from "@/lib/utils";
import { IAccountCookie } from "@/types/cookies";
import { Button } from "@workspace/ui/components/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { toast } from "sonner";
import { Address } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { recoverTypedDataAddress, verifyTypedData } from "viem";

type LinkWalletButtonProps = {
  playFabId: string;
  accountCookie: IAccountCookie
  readOnlyData: UserReadOnlyData;
  className?: string
}

export const LinkWalletButton = ({ playFabId, accountCookie, className, readOnlyData }: LinkWalletButtonProps) => {
  const router = useRouter();
  const account = useActiveAccount();
  const [ mounted, setMounted ] = useState(false);
  const isConnected = readOnlyData.wallets.connected.includes(account?.address as Address);
  useEffect(() => {
    setMounted(true);
  }, []);

  const onClick = async () => {
    if (!account) {
      return window.alert("Wallet not connected");
    }
    const nonce = await getCsrfToken();
    if (!nonce) {
      return window.alert("Nonce not found");
    }
    try {
      const signature = await account.signTypedData({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: {
          from: { wallet: account.address, nonce },
          contents: typedData.contents,
        },
      });

      const wallet = await recoverTypedDataAddress({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: {
          from: { wallet: account.address, nonce },
          contents: typedData.contents,
        },
        signature,
      });

      const valid = await verifyTypedData({
        address: account.address,
        domain: typedData.domain,
        types: typedData.types,
        primaryType: typedData.primaryType,
        message: { from: { wallet, nonce }, contents: typedData.contents },
        signature: signature,
      });
      if (!valid) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error("Invalid signature");
      }
      const newReadOnlyData = {
        ...readOnlyData,
        wallets: {
          ...readOnlyData.wallets,
          connected: [ ...readOnlyData.wallets.connected.filter(a => a !== account.address) as Address[],
            account.address as Address ],
        },
      };
      await updateUserReadOnlyDataAction(playFabId, newReadOnlyData);
      router.refresh();

    } catch (error) {
      toast.error(`${error}`);
    }
  };

  return mounted ? (
    <ChainButton
      type="button"
      className={cn(className)}
      onClick={onClick}
      disabled={!readOnlyData.wallets.managed || isConnected}
    >
      {accountCookie.connected
        ? readOnlyData.wallets.managed
          ? isConnected
            ? "Linked"
            : "Link"
          : "No Smart Account"
        : "Wallet Not Connected"}
    </ChainButton>
  ) : (
    <Button disabled className={cn(className)}>
      <AiOutlineLoading />
    </Button>
  );
};
