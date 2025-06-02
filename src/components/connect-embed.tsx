"use client";
import { appMetadata, chain, client, socialWallets, walletConnect } from "@/thirdweb.config";
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
      requireApproval={false}
      showThirdwebBranding={false}
      privacyPolicyUrl="/privacy"
      termsOfServiceUrl="/terms"
      header={{ title: "" }}
      onConnect={(wallet) => {
        router.push("/profile");
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
