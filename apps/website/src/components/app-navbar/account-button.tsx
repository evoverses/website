"use client";

import { logout } from "@/lib/thirdweb/auth";
import { cn } from "@/lib/utils";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import {
  CheckIcon,
  ChevronDownIcon,
  CircleUserIcon,
  LogOutIcon,
  PlusIcon,
  UserCircleIcon,
  WalletIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ComponentProps } from "react";
import {
  useActiveAccount,
  useConnectedWallets,
  useSetActiveWallet,
  WalletIcon as ThirdwebWalletIcon,
  WalletProvider,
} from "thirdweb/react";
import type { Wallet } from "thirdweb/wallets";
import { Address } from "viem";
import { ConnectButton } from "../buttons/connect-button";
import LogoPNG from "@/app/icon.png";

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
          <ChevronDownIcon className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background">
        {wallets.sort((a) => a.id === "smart" ? 1 : 0).map((wallet, i) => (
          <AccountWalletDropdownMenuItem
            key={`${wallet.id}-${i}`}
            wallet={wallet}
            activeAddress={account?.address as Address}
          />
        ))}
        <ConnectButton wallets="chain" asChild>
          <DropdownMenuItem className="px-3 py-0 gap-3 font-medium h-12 cursor-pointer hover:bg-foreground/10">
            <PlusIcon className="size-6 text-foreground" />
            <span className="text-sm">Attach Wallet</span>
          </DropdownMenuItem>
        </ConnectButton>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-3 py-0 gap-3 font-medium h-12 cursor-pointer hover:bg-foreground/10" asChild>
          <Link href="/profile">
            <CircleUserIcon className="size-6 text-primary" />
            <span className="text-sm">Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="px-3 py-0 gap-3 font-medium h-12 cursor-pointer hover:bg-foreground/10"
          onClick={() => logout()}
        >
          <LogOutIcon className="size-6 text-destructive" />
          <span className="text-sm text-destructive-contrast">Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

  );
};
AccountButton.displayName = "AccountButton";

const AccountWalletDropdownMenuItem = ({
  wallet,
  className,
  activeAddress,
  ...props
}: ComponentProps<typeof DropdownMenuItem> & { wallet: Wallet, activeAddress?: Address }) => {
  const account = wallet.getAccount();
  const setActiveWallet = useSetActiveWallet();
  const { profile } = { profile: { username: undefined, avatar: undefined } };

  // Hide inApp wallet which is only used as a central point of auth
  if (wallet.id === "inApp") {
    return null;
  }
  return (
    <DropdownMenuItem
      className={cn(
        "px-3 py-0 gap-3 text-base font-medium h-12 justify-between cursor-pointer hover:bg-foreground/10",
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
              {wallet.id === "smart" && <AvatarImage src={profile.avatar} alt="avatar" />}
              <AvatarFallback>
                {wallet.id === "smart" ? (
                  <Image src={LogoPNG} alt="avatar" className="size-5" />
                ) : (
                  <ThirdwebWalletIcon
                    className="size-5"
                  />
                )}
              </AvatarFallback>
            </Avatar>
            {wallet.id !== "smart" && (
              <WalletIcon
                className="absolute size-3 bottom-0 right-0 rounded-full bg-secondary"
              />
            )}
          </div>
        </WalletProvider>
        {wallet.id === "smart" ? (
          <span className="text-sm">
            {profile.username ?? "Game Wallet"}
          </span>
        ) : (
          <Tooltip>
            <TooltipTrigger>
              <span className="text-sm">
                {profile.username ?? shortenAddress(account?.address || "", {})}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {account?.address}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <CheckIcon className={cn("size-4", { "opacity-0": activeAddress !== account?.address })} />
    </DropdownMenuItem>
  );
};
AccountWalletDropdownMenuItem.displayName = "AccountWalletDropdownMenuItem";
export { AccountButton };
