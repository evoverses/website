"use client";
import { useProMode } from "@/components/providers/pro-mode-provider";
import { localWalletPreview } from "@/lib/thirdweb/preview";
import { appMetadata, chain, client, socialWallets, walletConnect } from "@/lib/thirdweb/config";
import { auth } from "@/lib/thirdweb/siwe";
import { useRouter, useSearchParams } from "next/navigation";
import { ConnectEmbed as ThirdwebConnectEmbed, darkTheme } from "thirdweb/react";

const ConnectEmbed = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { proMode } = useProMode();
  if (!proMode) return null;
  if (localWalletPreview) return (
    <div className="max-w-sm rounded-2xl border border-primary/30 bg-primary/10 p-6 text-center space-y-3">
      <h2 className="font-bold text-xl">Wallet features</h2>
      <p className="text-sm text-muted-foreground">Wallet sign-in is disabled in this local preview. Epic sign-in works independently.</p>
    </div>
  );
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
