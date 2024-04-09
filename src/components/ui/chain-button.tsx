'use client';
import { Button } from "@/components/ui/button";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { ComponentProps } from "react";
import { useAccount, useSwitchChain } from "wagmi";

const ChainButton = (props: ComponentProps<typeof Button>) => {
  const { isConnected, chain } = useAccount();
  const { open } = useWeb3Modal();

  const { switchChain } = useSwitchChain();
  if (!isConnected) {
    return <Button {...props} onClick={() => open({ view: "Connect" })}>Connect</Button>
  }
  if (chain?.id !== 43_114) {
    return <Button {...props} onClick={() => switchChain({ chainId: 43_114 })}>Switch Network</Button>;
  }

  return (
    <Button {...props} />
  )
}
ChainButton.displayName = "ChainButton";

export {
  ChainButton
}
