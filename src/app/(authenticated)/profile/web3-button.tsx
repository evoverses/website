"use client";
import { Button } from "@/components/ui/button";
import { typedData } from "@/data/viem/signature";
import { getCsrfToken } from "@/lib/auth";
import { linkWallet } from "@/lib/playfab/actions";
import { cn } from "@/lib/utils";
import { IAccountCookie } from "@/types/cookies";
import { Session } from "next-auth";
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
      window.alert(error);
    }
  };

  return (
    <Button
      type="button"
      disabled={disabled}
      className={cn(className)}
      onClick={onClick}
      // disabled={!isConnected || isConnected && added}
    >
      {accountCookie.loggedIn ? disabled ? "Linked" : "Link" : "Wallet Not Connected"}
    </Button>
  );
};
