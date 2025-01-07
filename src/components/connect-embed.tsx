"use client";
import { accountAbstraction, appMetadata, chain, client, socialWallets, walletConnect } from "@/thirdweb.config";
import { auth } from "@/thirdweb/siwe";
import { useRouter, useSearchParams } from "next/navigation";
import { ConnectEmbed as ThirdwebConnectEmbed, darkTheme } from "thirdweb/react";

const ConnectEmbed = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  return (
    <ThirdwebConnectEmbed
      client={client}
      chain={chain}
      wallets={socialWallets}
      auth={auth}
      appMetadata={appMetadata}
      walletConnect={walletConnect}
      requireApproval={true}
      showThirdwebBranding={false}
      privacyPolicyUrl="/privacy"
      termsOfServiceUrl="/terms"
      accountAbstraction={accountAbstraction}
      header={{ title: "" }}
      onConnect={() => {
        router.push(searchParams.get("redirect") || searchParams.get("redirectUrl") || "/profile");
      }}
      theme={darkTheme({
        colors: {
          modalBg: "#0c0a09",
          borderColor: "#0c0a09",
        },
      })}
    />
  );
};
ConnectEmbed.displayName = "ConnectEmbed";
export { ConnectEmbed };
