import Logo from "@/app/icon.png";
import { AccountButton } from "@/components/app-navbar/account-button";
import NavItems, { ModeButton } from "@/components/app-navbar/nav-items";
import { ConnectButton } from "@/components/buttons/connect-button";
import type { IAccountCookie } from "@/types/cookies";
import { Button } from "@workspace/ui/components/button";
import { WalletCardsIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export type NavItem = {
  name: string;
  href: string;
  description: string;
  comingSoon?: boolean;
  authRequired?: boolean;
}

export const navigation: NavItem[] = [
  { name: "Play Now", href: "#", description: "Download EvoVerses and jump right in!", comingSoon: true },
  // { name: "Explore", href: "/assets", description: "Explore all EvoVerses assets" },
  { name: "Profile", href: "/profile", description: "Manage your EvoVerses account and assets", authRequired: true },
  {
    name: "About",
    href: "https://docs.evoverses.com/general/meet-the-team",
    description: "The team, vision, and history",
    comingSoon: true,
  },
  { name: "Docs", href: "https://docs.evoverses.com", description: "Everything you need to know about EvoVerses" },
  { name: "Liquidity", href: "/liquidity", description: "Quick wallet-only access to liquidity management" },
  {
    name: "Marketplace",
    href: "/marketplace",
    description: "Buy and sell Evos",
  },
];

const Navbar = ({ accountCookie }: { accountCookie: IAccountCookie }) => {
  return (
    <div className="sticky isolate inset-x-0 top-0 z-20 border-b bg-background">
      <div className="flex h-16 items-center px-4">
        <Link href="/">
          <Image src={Logo} alt="EvoVerses" className="size-12" />
        </Link>
        <nav className="items-center ml-2 sm:space-x-4 sm:mx-6 lg:space-x-6">
          <NavItems navItems={navigation} isConnected={accountCookie.loggedIn} />
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          {accountCookie.loggedIn ? (
            <AccountButton />
          ) : (
            <ConnectButton asChild>
              <Button variant="default">
                <WalletCardsIcon className="size-5 hidden md:inline-flex" />
                <span>Sign In</span>
              </Button>
            </ConnectButton>
          )}
          <ModeButton />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
