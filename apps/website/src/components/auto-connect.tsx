"use client";
import { appMetadata, chain, client, wallets } from "@/thirdweb.config";
import { AutoConnect as ThirdwebAutoConnect } from "thirdweb/react";

const AutoConnect = () => {
  return (
    <ThirdwebAutoConnect client={client} chain={chain} wallets={wallets} appMetadata={appMetadata} />
  );
};

export { AutoConnect };
