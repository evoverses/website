'use client';
import { Button } from "@/components/ui/button";
import { chain } from "@/data/contracts";
import { client } from "@/thirdweb.config";
import { ComponentProps } from "react";
import { FaCheck, FaSpinner } from "react-icons/fa";
import {
  useActiveWalletChain,
  useActiveWalletConnectionStatus,
  useConnectModal,
  useSwitchActiveWalletChain,
} from "thirdweb/react";

type ChainButtonProps = ComponentProps<typeof Button> & { loading?: boolean, success?: boolean };
const ChainButton = ({ loading, success, children, ...props }: ChainButtonProps) => {
  const status = useActiveWalletConnectionStatus();
  const activeChain = useActiveWalletChain();
  const switchChain = useSwitchActiveWalletChain();
  const { connect } = useConnectModal();

  if (status !== "connected") {
    return <Button {...props} onClick={() => connect({ chain, client })}>Connect</Button>;
  }
  if (activeChain?.id !== chain.id) {
    return <Button {...props} onClick={() => switchChain(chain)}>Switch Network</Button>;
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
