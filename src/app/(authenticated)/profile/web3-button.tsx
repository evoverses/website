"use client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { typedData } from "@/data/viem/signature";
import { getCsrfToken } from "@/lib/auth";
import { linkWallet } from "@/lib/playfab/actions";
import { cn } from "@/lib/utils";
import { IAccountCookie } from "@/types/cookies";
import { Session } from "next-auth";
import { useEffect, useState } from "react";
import { AiOutlineLoading } from "react-icons/ai";
import { recoverTypedDataAddress, verifyTypedData } from "viem";

import { useAccount, useWalletClient } from "wagmi";

type LinkWalletButtonProps = {
  session: Session | null,
  accountCookie: IAccountCookie,
  disabled?: boolean,
  className?: string
}

export const LinkWalletButton = ({ session, disabled, accountCookie, className }: LinkWalletButtonProps) => {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [ mounted, setMounted ] = useState(false);

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
      const sessionTicket = (
        session as any
      ).playFab.SessionTicket;
      await linkWallet(address, sessionTicket);

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
      disabled={disabled}
      className={cn(className)}
      onClick={onClick}
      // disabled={!isConnected || isConnected && added}
    >
      {accountCookie.loggedIn ? disabled ? "Linked" : "Link" : "Wallet Not Connected"}
    </Button>
  ) : (
    <Button disabled className={cn(className)}>
      <AiOutlineLoading />
    </Button>
  );
};
