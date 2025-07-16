"use client";
import { useConnectedWallets } from "@/hooks/use-connected-wallets";
import {
  accountAbstraction,
  appMetadata,
  chains,
  chainWallets,
  client,
  socialWallets,
  wallets,
} from "@/lib/thirdweb/config";
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
  const { connect, isConnecting } = useConnectModal();
  const account = useConnectedWallets();
  if (account && hideConnected) {
    return null;
  }
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={className}
      disabled={isConnecting || disabled}
      onClick={async e => {
        onClick?.(e);

        return connect({
          client,
          chains,
          wallets: walletsType === "all" ? wallets : walletsType === "chain" ? chainWallets : socialWallets,
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
      }}
      {...props}
    />
  );
};
ConnectButton.displayName = "ConnectButton";

export { ConnectButton };
