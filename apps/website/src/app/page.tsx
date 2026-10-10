import { ProOnly } from "@/components/providers/pro-mode-provider";
import { PortalIntro } from "@/components/landing/portal-intro";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { Button } from "@workspace/ui/components/button";
import { Icons } from "@workspace/ui/components/icons";
import { ShoppingCartIcon } from "lucide-react";
import Link from "next/link";

const links = [
  { name: "Discord", icon: DiscordLogoIcon, href: "https://evoverses.com/discord" },
  { name: "Twitter", icon: Icons.x, href: "https://evoverses.com/twitter" },
  { name: "GitHub", icon: GitHubLogoIcon, href: "https://evoverses.com/github" },
];

const Landing = () => {

  return (
    <main className="flex min-h-[95cqh] flex-col items-center justify-center gap-10 p-4 py-10 sm:px-12">
      <div className="flex w-full flex-col items-center gap-6 text-center">
        <PortalIntro />
        <h1 className="max-w-2xl text-lg font-semibold leading-relaxed sm:text-xl">A 3D monster battling game bringing Web2 and Web3 together in one platform.</h1>
      </div>
      <div className="flex flex-col gap-4 md:items-center xl:w-full xl:flex-row xl:justify-between xl:max-w-5xl">
        <ProOnly><Button variant="outline" size="lg" className="flex px-2 md:px-4 lg:px-8" asChild>
          <Link href="/marketplace/evos" referrerPolicy="no-referrer" prefetch={false}>
            <ShoppingCartIcon />
            <span className="hidden md:inline-flex">Buy Evos</span>
          </Link>
        </Button></ProOnly>
        <div className="flex space-x-4">
          {links.map(({ name, icon: Icon, href }, key) => (
            <Button key={key} variant="outline" className="flex" asChild>
              <Link href={href} target="_blank" prefetch={false}>
                <Icon className="size-4 mr-2" /> {name}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </main>
  );
};

export default Landing;
