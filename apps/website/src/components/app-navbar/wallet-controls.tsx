"use client";
import { useChainWallet } from "@/hooks/use-chain-wallet";
import { chainConnectionOptions } from "@/lib/thirdweb/chain-connection";
import { walletConnectionAvailable } from "@/lib/thirdweb/preview";
import { DropdownMenuItem, DropdownMenuSeparator } from "@workspace/ui/components/dropdown-menu";
import { toast } from "@workspace/ui/components/sonner";
import { Check, LogOut, WalletCards } from "lucide-react";
import { useConnectModal, useDisconnect, useSetActiveWallet } from "thirdweb/react";

export function WalletControls() {
  const { wallet, account, wallets } = useChainWallet();
  const { connect, isConnecting } = useConnectModal();
  const { disconnect } = useDisconnect();
  const setActive = useSetActiveWallet();
  async function connectWallet() {
    try { await connect(chainConnectionOptions()); }
    catch { toast.error("Could not connect that wallet. Please try again."); }
  }
  return <>
    {wallets.map((item, index) => <DropdownMenuItem key={item.id + index} disabled={item === wallet} onClick={() => void setActive(item).catch(() => toast.error("Could not switch wallets."))}>
      <Check className={item === wallet ? "size-4" : "size-4 opacity-0"} />{item.getAccount()?.address.slice(0,6)}…{item.getAccount()?.address.slice(-4)}
    </DropdownMenuItem>)}
    <DropdownMenuItem disabled={!walletConnectionAvailable || isConnecting} onClick={() => void connectWallet()} title={walletConnectionAvailable ? undefined : "Set the Thirdweb public client ID to enable wallet connection"}>
      <WalletCards className="size-4" />{isConnecting ? "Connecting…" : account ? "Connect another wallet" : "Connect wallet"}
    </DropdownMenuItem>
    {wallet && <DropdownMenuItem onClick={() => disconnect(wallet)}><LogOut className="size-4" />Disconnect wallet</DropdownMenuItem>}
    <DropdownMenuSeparator />
  </>;
}
