'use client';
import { Button } from "@/components/ui/button";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { ComponentProps } from "react";
import { useAccount, useNetwork, useSwitchNetwork } from "wagmi";

const ChainButton = (props: ComponentProps<typeof Button>) => {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const { open } = useWeb3Modal();

  const { switchNetwork } = useSwitchNetwork({ chainId: 43_114 });
  if (!isConnected) {
    return <Button {...props} onClick={() => open({ view: "Connect" })}>Connect</Button>
  }
  if (chain?.id !== 43_114) {
    return <Button {...props} onClick={() => switchNetwork?.()}>Switch Network</Button>
  }

  return (
    <Button {...props} />
  )
}
ChainButton.displayName = "ChainButton";

export {
  ChainButton
}
