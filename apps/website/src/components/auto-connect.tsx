"use client";

import { accountAbstraction, appMetadata, client, wallets } from "@/lib/thirdweb/config";
import { useEffect } from "react";
import { useActiveWallet, useAdminWallet, useAutoConnect } from "thirdweb/react";

const AutoConnect = ({ account }: { account?: string }) => {
  const wallet = useActiveWallet();
  const adminWallet = useAdminWallet();

  const { data: autoConnected, status, error, refetch } = useAutoConnect({
    appMetadata,
    client,
    wallets,
    accountAbstraction,
    timeout: 5_000, // 5 seconds
    onConnect: (wallet) => {
      console.log(`AutoConnect::connected::${wallet.getAccount()?.address}`);
    },
    onTimeout: () => {
      console.log("AutoConnect::timeout");
    },
  });
  useEffect(() => {
    // console.log(autoConnected, status, error)
    if (!autoConnected) {
      if (status === "success" && !error && !wallet) {
        refetch();
      }
    }
  }, [ autoConnected, status, error, wallet, account, refetch ]);

  useEffect(() => {
    //console.log(wallet, adminWallet)
    if (wallet && adminWallet) {
      console.log(wallet.getAccount()?.address, adminWallet.getAccount()?.address);
    }
  }, [ wallet, adminWallet ]);

  return null;
};
AutoConnect.displayName = "AutoConnect";

export { AutoConnect };
