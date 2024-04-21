'use client';
import { Button } from "@/components/ui/button";
import { useWeb3Modal } from "@web3modal/wagmi/react";
import { ComponentProps } from "react";
import { FaCheck, FaSpinner } from "react-icons/fa";
import { useAccount, useSwitchChain } from "wagmi";

type ChainButtonProps = ComponentProps<typeof Button> & { loading?: boolean, success?: boolean };
const ChainButton = ({ loading, success, children, ...props }: ChainButtonProps) => {
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
    <Button {...props}>
      {loading ? <FaSpinner className="animate-spin h-5 w-5 mr-2" /> : null}
      {success && <FaCheck className="h-5 w-5 mr-2" />}
      {children}
    </Button>
  )
}
ChainButton.displayName = "ChainButton";

export {
  ChainButton
}
