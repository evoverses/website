import type { Player } from "@/lib/player/auth-core";
import { ProModeButton } from "@/components/pro-mode";
import Logo from "@/app/icon.png";
import { AccountButton } from "@/components/app-navbar/account-button";
import NavItems, { ModeButton } from "@/components/app-navbar/nav-items";
import { CurrencyBalances } from "./currency-balances";
import type { IAccountCookie } from "@/types/cookies";
import Image from "next/image";
import Link from "next/link";

export type NavItem = {
  name: string;
  href: string;
  description: string;
  comingSoon?: boolean;
  authRequired?: boolean;
  proOnly?: boolean;
}

export const navigation: NavItem[] = [
  { name: "Play Now", href: "#", description: "Download EvoVerses and jump right in!", comingSoon: true },
  // { name: "Explore", href: "/assets", description: "Explore all EvoVerses assets" },
  { name: "Profile", href: "/profile", description: "Manage your EvoVerses account and assets", authRequired: true },
  {
    name: "Marketplace",
    href: "/marketplace",
    description: "Buy and sell Evos",
    proOnly: true,
  },
  { name: "Nursery", href: "/nursery", description: "Breed Evos with Bertha and hatch eggs with Hermann", proOnly: true },
  { name: "Store", href: "/store", description: "Top up your in-game Evoros" },
];

const Navbar = ({ accountCookie, player, evoros }: { accountCookie: IAccountCookie; player?: Player; evoros?: number }) => {
  return (
    <div className="sticky isolate inset-x-0 top-0 z-20 border-b bg-background">
      <div className="flex min-h-16 flex-wrap items-center gap-y-2 px-2 py-2 sm:px-4 sm:py-0">
        <Link href="/" className="shrink-0">
          <Image src={Logo} alt="EvoVerses" className="size-8 sm:size-12" />
        </Link>
        <nav className="items-center ml-2 sm:space-x-4 sm:mx-6 lg:space-x-6">
          <NavItems navItems={navigation} isConnected={!!player || accountCookie.loggedIn} />
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-1 sm:gap-2 max-sm:w-full max-sm:ml-0 max-sm:justify-between">
          <CurrencyBalances playerId={player?.id} evoros={evoros} />
          <AccountButton player={player} walletLoggedIn={accountCookie.loggedIn} />
          <ModeButton />
          <ProModeButton />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
