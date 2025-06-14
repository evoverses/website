"use client";

import type { Address } from "abitype";
import { useMemo } from "react";
import { useConnectedWallets as useThirdwebConnectedWallets } from "thirdweb/react";

type UseConnectedWalletsOpts = {
  includeInApp?: boolean,
  includeSmart?: boolean,
}
const defaultOpts = {
  includeInApp: false,
  includeSmart: true,
};

export const useConnectedWallets = (opts: UseConnectedWalletsOpts = defaultOpts) => {

  const connectedWallets = useThirdwebConnectedWallets();
  return useMemo(() => {
    const options = { ...defaultOpts, ...opts };
    if (!connectedWallets || connectedWallets.length === 0) {
      return [];
    }
    return connectedWallets.filter(w => options.includeSmart || w.id !== "smart")
      .filter(w => options.includeInApp || w.id !== "inApp");
  }, [ connectedWallets, opts ]);
};

export const useConnectedWalletAddresses = (opts: UseConnectedWalletsOpts = defaultOpts) => {
  const wallets = useConnectedWallets(opts);
  return useMemo(() => wallets.map(w => w.getAccount()?.address as Address).filter(Boolean), [ wallets ]);
};
