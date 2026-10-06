"use client";
import { useProMode } from "@/components/providers/pro-mode-provider";
import { localWalletPreview, walletConnectionAvailable } from "@/lib/thirdweb/preview";
import { useConnectedWallets } from "@/hooks/use-connected-wallets";
import {
  accountAbstraction,
  appMetadata,
  chains,
  client,
  socialWallets,
  wallets,
} from "@/lib/thirdweb/config";
import { chainConnectionOptions } from "@/lib/thirdweb/chain-connection";
import { toast } from "@workspace/ui/components/sonner";
import { auth } from "@/lib/thirdweb/siwe";
import { Button, Slot } from "@workspace/ui/components/button";
import type { ComponentProps } from "react";
import { darkTheme, useConnectModal } from "thirdweb/react";

const ConnectButton = ({
  className,
  disabled,
  onClick,
  wallets: walletsType = "social",
  hideConnected,
  asChild,
  ...props
}: ComponentProps<typeof Button> & { wallets?: "social" | "chain" | "all", hideConnected?: boolean }) => {
  const { proMode } = useProMode();
  const { connect, isConnecting } = useConnectModal();
  const account = useConnectedWallets();
  if (account.length > 0 && hideConnected) {
    return null;
  }
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={className}
      disabled={!proMode || (walletsType === "chain" ? !walletConnectionAvailable : localWalletPreview) || isConnecting || disabled}
      onClick={async e => {
        if (!proMode || (walletsType === "chain" ? !walletConnectionAvailable : localWalletPreview)) { e.preventDefault(); return; }
        onClick?.(e);

        try {
        return await connect(walletsType === "chain" ? chainConnectionOptions() : {
          client,
          chains,
          wallets: walletsType === "all" ? wallets : socialWallets,
          theme: darkTheme({
            colors: {
              modalBg: "var(--background)",
            },
          }),
          accountAbstraction,
          appMetadata,
          showThirdwebBranding: false,
          size: "compact",
          titleIcon: "/icon.png",
          termsOfServiceUrl: "/terms",
          privacyPolicyUrl: "/privacy",
          auth,
        });
        } catch { toast.error("Could not connect that wallet. Please try again."); }
      }}
      {...props}
    />
  );
};
ConnectButton.displayName = "ConnectButton";

export { ConnectButton };
