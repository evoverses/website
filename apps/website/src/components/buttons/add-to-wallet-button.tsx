"use client";

import { FaWallet } from "react-icons/fa";
import { toast } from "sonner";
import { Address } from "thirdweb";
import { useActiveAccount, useActiveWalletConnectionStatus } from "thirdweb/react";

type AddToWalletButtonProps = {
  address: Address;
  decimals?: number;
  symbol: string;
  image?: string;
  className?: string;
}

const AddToWalletButton = ({ address, symbol, decimals = 18, image, className }: AddToWalletButtonProps) => {
  const status = useActiveWalletConnectionStatus();
  const account = useActiveAccount();

  if (status !== "connected") {
    return null;
  }

  const onClick = async () => {
    if (!account?.watchAsset) {
      return;
    }
    const watchAssetPromise = account.watchAsset({
      type: "ERC20",
      options: { address, symbol, decimals, image },
    });
    toast.promise(watchAssetPromise, {
      loading: "Adding to wallet...",
      success: `${symbol} Added to wallet`,
      error: "Failed to add to wallet",
    });
  };

  return (
    <button onClick={onClick} className={className}>
      <FaWallet className="w-6 h-6" />
    </button>
  );
};

export { AddToWalletButton };
