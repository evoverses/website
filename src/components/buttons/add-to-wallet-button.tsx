"use client";

import { Address } from "abitype";
import { FaWallet } from "react-icons/fa";
import { toast } from "sonner";
import { watchAsset } from "viem/actions";
import { useAccount, useWalletClient } from "wagmi";

type AddToWalletButtonProps = {
  address: Address;
  decimals?: number;
  symbol: string;
  image?: string;
  className?: string;
}

const AddToWalletButton = ({ address, symbol, decimals = 18, image, className }: AddToWalletButtonProps) => {
  const { isConnected } = useAccount();
  const { data: client } = useWalletClient();

  if (!isConnected) {
    return null;
  }

  const onClick = async () => {
    if (!client) {
      return;
    }
    const watchAssetPromise = watchAsset(client, {
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
