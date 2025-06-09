import NavItems, { ModeButton } from "@/app/(nav)/nav-items";
import Logo from "@/app/icon.png";
import { AccountButton } from "@/components/buttons/account-button";
import { ConnectButton } from "@/components/buttons/connect-button";
import { getAccountCookie } from "@/lib/cookies/account.server";
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
  { name: "Explore", href: "/assets", description: "Explore all EvoVerses assets" },
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
    comingSoon: process.env.NODE_ENV !== "development",
  },
];

const Navbar = async () => {
  const accountCookie = await getAccountCookie();
  return (
    <div className="border-b fixed w-full bg-background z-20">
      <div className="flex h-16 items-center px-4">
        <Link href="/">
          <Image src={Logo} alt="EvoVerses" width={48} height={48} />
        </Link>
        <nav className="items-center ml-2 sm:space-x-4 sm:mx-6 lg:space-x-6">
          <NavItems navItems={navigation} isConnected={accountCookie.connected} />
        </nav>
        <div className="ml-auto flex items-center space-x-4">
          {/*<WalletButton />*/}
          {accountCookie.connected ? (
            <AccountButton />
          ) : (
            <ConnectButton asChild>
              <Button variant="ghost">
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
