"use client";
import { appMetadata, client, wallets } from "@/lib/thirdweb/config";
import { auth } from "@/lib/thirdweb/siwe";
import { generatePayload, isLoggedIn, login, logout } from "@/lib/thirdweb/auth";
import { Button, Slot } from "@workspace/ui/components/button";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import type { ComponentProps, ReactNode } from "react";
import { avalanche } from "thirdweb/chains";
import { darkTheme, useActiveAccount, useConnectModal } from "thirdweb/react";

const ConnectButton = ({
  className,
  disabled,
  onClick,
  disconnectedButton,
  asChild,
  ...props
}: ComponentProps<typeof Button> & { disconnectedButton?: ReactNode }) => {
  const mobile = useIsMobile();
  const { connect, isConnecting } = useConnectModal();
  const activeAccount = useActiveAccount();

  if (!activeAccount && disconnectedButton) {
    return disconnectedButton;
  }

  // noinspection LocalVariableNamingConventionJS
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={className}
      disabled={isConnecting || disabled}
      onClick={async e => {
        onClick?.(e);
        return connect({
          client,
          chain: avalanche,
          wallets,
          theme: darkTheme({
            colors: {
              modalBg: "var(--background)",
            },
          }),
          appMetadata,
          size: mobile ? "compact" : "wide",
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
