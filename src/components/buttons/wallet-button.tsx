"use client";

import EvoTokenImage from "@/assets/images/evo-token.png";
import { Button } from "@/components/ui/button";
import { DeadBeef } from "@/data/constants";
import { evoContract } from "@/data/contracts";
import { cn } from "@/lib/utils";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import Image from "next/image";
import { type ComponentProps, useEffect, useState } from "react";
import { FaSpinner, FaWallet } from "react-icons/fa";
import { formatEther } from "viem";
import { useAccount, useEnsName, useReadContract } from "wagmi";

const WalletButton = ({ className, ...props }: ComponentProps<typeof Button>) => {
  const { address = DeadBeef, status } = useAccount();
  const { open } = useWeb3Modal();
  const [ rendered, setRendered ] = useState(false);
  const shortAddress = address === DeadBeef ? "" : address.slice(0, 4) + "..." + address.slice(-4);
  useEffect(() => {
    setRendered(true);
    return () => {
      setRendered(false);
    };
  }, []);

  const { data: balance = 0n } = useReadContract({
    ...evoContract,
    functionName: "balanceOf",
    chainId: 43_114,
    args: [ address ],
    query: {
      enabled: status === "connected",
    },
  });

  const { data: dnsName } = useEnsName({
    address,
    chainId: 43_114,
    scopeKey: "ens",
    query: {
      enabled: status === "connected" && address !== DeadBeef,
    },
  });
  if (!rendered) {
    return (
      <Button className={cn("font-extrabold", className)} disabled {...props} >
        <FaSpinner className="w-5 h-5 animate-spin mr-2" />
        Loading
      </Button>
    );
  }
  switch (status) {
    case "connected": {
      return (
        <Button
          className={cn("font-extrabold flex gap-2", className)}
          onClick={() => open({ view: "Account" })}
          {...props}
        >
          <div className="flex gap-2 items-center">
            <Image src={EvoTokenImage} alt="EVO Token" className="w-5 h-5" />
            <span>{Number(formatEther(balance)).toLocaleString()}</span>
          </div>
          <span>|</span>
          <div className="flex gap-2 items-center group">
            <FaWallet className="w-5 h-5" />
            <span className="group-hover:hidden w-20">{dnsName || shortAddress}</span>
            <span className="hidden group-hover:block w-20">{shortAddress}</span>
          </div>
        </Button>
      );
    }
  }
  return (
    <Button
      className={cn("font-extrabold", className)}
      onClick={() => open({ view: "Connect" })}
      {...props}
    >
      Connect Wallet
    </Button>
  );
};
WalletButton.displayName = "WalletButton";

export { WalletButton };
