import { AccountNavigation } from "@/app/profile/_components/navigation";
import { isLoggedIn } from "@/lib/thirdweb/auth";
import { Separator } from "@workspace/ui/components/separator";
import { unauthorized } from "next/navigation";
import { PropsWithChildren } from "react";

const navigation = [
  {
    title: "Account",
    href: "/profile",
  },
  {
    title: "Liquidity",
    href: "/profile/liquidity",
  },
  {
    title: "Assets",
    href: "/profile/assets",
  },
  //{
  //  title: "Notifications",
  //  href: "/profile/notifications",
  //},
  //{
  //  title: "Display",
  //  href: "/profile/display",
  //},
];

const Layout = async ({ children }: PropsWithChildren) => {
  const loggedIn = await isLoggedIn();
  if (!loggedIn) {
    unauthorized();
  }
  return (
    <div className="flex flex-col flex-grow space-y-6 px-4 sm:px-10 pt-6">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight border-b-0">Profile</h2>
        <p className="text-muted-foreground">
          Manage your evoverses account, assets and settings.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 lg:flex-grow">
        <aside className="lg:w-1/5">
          <AccountNavigation items={navigation} />
        </aside>
        <div className="flex-1 overflow-y-scroll">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
