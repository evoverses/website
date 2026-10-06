"use client";
import type { Player } from "@/lib/player/auth-core";
import { ProOnly } from "@/components/providers/pro-mode-provider";
import { WalletControls } from "./wallet-controls";
import { logout } from "@/lib/thirdweb/auth";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu";
import { ChevronDownIcon, CircleUserIcon, LogOutIcon, UserCircleIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

export function AccountButton({ className, player, walletLoggedIn, ...props }: ComponentProps<typeof Button> & { player?: Player; walletLoggedIn?: boolean }) {
  const signedIn = Boolean(player || walletLoggedIn);
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button aria-label="Your account" variant="ghost" className={cn("group/account-button flex items-center", className)} {...props}>
        <Avatar className="size-5 rounded-full"><AvatarFallback><UserCircleIcon className="size-5" /></AvatarFallback></Avatar>
        {!signedIn && <span className="hidden sm:inline">Sign In</span>}<ChevronDownIcon className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="bg-background">
      {player && <p className="px-3 py-2 font-bold">{player.displayName}</p>}
      <ProOnly><WalletControls /></ProOnly>
      <DropdownMenuItem className="px-3 py-0 gap-3 font-medium h-12 cursor-pointer hover:bg-foreground/10" asChild>
        <Link href={signedIn ? "/profile" : "/signin"}><CircleUserIcon className="size-6 text-primary" /><span className="text-sm">{signedIn ? "Profile" : "Sign in with Epic"}</span></Link>
      </DropdownMenuItem>
      {signedIn && <DropdownMenuSeparator />}
      {player && <form action="/api/player/auth/logout" method="post">
        <button type="submit" className="flex h-12 w-full items-center gap-3 px-3 text-sm font-medium text-destructive hover:bg-foreground/10"><LogOutIcon className="size-6" />Sign out</button>
      </form>}
      {walletLoggedIn && <ProOnly><DropdownMenuItem className="px-3 py-0 gap-3 font-medium h-12 cursor-pointer hover:bg-foreground/10" onClick={() => void logout()}>
        <LogOutIcon className="size-6 text-destructive" /><span className="text-sm">Sign out of wallet</span>
      </DropdownMenuItem></ProOnly>}
    </DropdownMenuContent>
  </DropdownMenu>;
}
