"use client";

import { cn } from "@/lib/utils";
import { logout } from "@/lib/thirdweb/auth";
import { shortenAddress } from "@/utils/strings";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  CheckIcon,
  ChevronDownIcon,
  CircleUserIcon,
  LogOutIcon,
  PlusIcon,
  UserCircleIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";
import { ComponentProps } from "react";
import { useActiveAccount, useConnectedWallets, useSetActiveWallet, WalletProvider } from "thirdweb/react";
import type { Wallet } from "thirdweb/wallets";
import { Address } from "viem";
import { ConnectButton } from "./connect-button";

const AccountButton = ({ className, ...props }: ComponentProps<typeof Button>) => {
  const account = useActiveAccount();
  const wallets = useConnectedWallets();

  const { profile } = { profile: { username: undefined, avatar: undefined } };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn("group/account-button flex items-center", className)} {...props}>
          <Avatar className="size-5 rounded-full">
            <AvatarImage src={profile.avatar} alt="avatar" />
            <AvatarFallback>
              <UserCircleIcon className="size-5 group-data-[state=open]/account-button:rotate-180" />
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:flex">{profile.username ?? account?.address?.slice(2, 8)}</span>
          <ChevronDownIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background">
        {wallets.map((wallet, i) => (
          <AccountWalletButton key={`${wallet.id}-${i}`} wallet={wallet} activeAddress={account?.address as Address} />
        ))}
        <ConnectButton asChild>
          <DropdownMenuItem className="px-3 py-0 gap-3 font-medium h-12 cursor-pointer">
            <PlusIcon className="size-6 text-foreground" />
            <span className="text-sm">Connect Wallet</span>
          </DropdownMenuItem>
        </ConnectButton>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-3 py-0 gap-3 font-medium h-12 cursor-pointer" asChild>
          <Link href="#">
            <CircleUserIcon className="size-6 text-foreground" />
            <span className="text-sm">Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-3 py-0 gap-3 font-medium h-12 cursor-pointer" onClick={() => logout()}>
          <LogOutIcon className="size-6 text-destructive-contrast" />
          <span className="text-sm text-destructive-contrast">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

  );
};
AccountButton.displayName = "AccountButton";

const AccountWalletButton = ({
  wallet,
  className,
  activeAddress,
  ...props
}: ComponentProps<typeof DropdownMenuItem> & { wallet: Wallet, activeAddress?: Address }) => {
  const account = wallet.getAccount();
  const setActiveWallet = useSetActiveWallet();
  const { profile } = { profile: { username: undefined, avatar: undefined } };
  return (
    <DropdownMenuItem
      className={cn(
        "px-3 py-0 gap-3 text-base font-medium h-12 justify-between cursor-pointer",
        { "pointer-events-none": activeAddress === account?.address },
        className,
      )}
      onClick={() => setActiveWallet(wallet)}
      {...props}
    >
      <div className="flex items-center gap-3">
        <WalletProvider id={wallet.id}>
          <div className="relative">
            <Avatar className="size-6 rounded-full">
              <AvatarImage src={profile.avatar} alt="avatar" />
              <AvatarFallback>
                <UserCircleIcon className="size-5 group-data-[state=open]/account-button:rotate-180" />
              </AvatarFallback>
              <WalletIcon />
            </Avatar>
            <WalletIcon
              className="absolute size-3 bottom-0 right-0 rounded-full"
            />
          </div>
        </WalletProvider>
        <span className="text-sm">{profile.username ?? shortenAddress(account?.address || "", {})}</span>
      </div>
      <CheckIcon className={cn("size-4", { "opacity-0": activeAddress !== account?.address })} />
    </DropdownMenuItem>
  );
};
AccountWalletButton.displayName = "AccountWalletButton";
export { AccountButton };
