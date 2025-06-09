import { client } from "@/lib/thirdweb/config";
import { useQuery } from "@tanstack/react-query";
import { useActiveAccount, useConnectedWallets } from "thirdweb/react";
import { getProfiles, type Profile, type Wallet } from "thirdweb/wallets";

const useProfiles = () => {
  const account = useActiveAccount();
  const { data: profiles, refetch } = useQuery({
    queryKey: [
      account?.address,
    ],
    queryFn: () => getProfiles({ client }),
    enabled: !!account,
    initialData: [] as Profile[],
  });

  return { profiles, refetch };
};
export { useProfiles };

export const useSmartWallet = () => {
  const wallets = useConnectedWallets();
  return wallets.find(w => w.id === "smart") as Wallet<"smart">;
};

export const useSmartWalletAdmin = () => {
  const wallet = useSmartWallet();
  return wallet?.getAdminAccount?.()?.address;
};

export const useConnectedSiweWallets = () => {
  const wallets = useConnectedWallets();
  return wallets.filter(w => w.id !== "smart" && w.id !== "inApp");
};

export const useConnectedWalletAddresses = () => {
  const wallets = useConnectedWallets();
  const smartWallets = useSmartWallet();
  console.log("Wallets:", wallets, "\nSmart Wallets:", smartWallets);
  return wallets;
};
