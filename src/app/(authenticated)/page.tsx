import PardonOurDustAlert from "@/app/(authenticated)/temp-alert";
import Logo from "@/app/icon.png";
import { Button } from "@/components/ui/button";
import { DiscordLogoIcon, GitHubLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import Link from "next/link";
import { SiOpensea } from "react-icons/si";

const Landing = () => {
  const links = [
    { name: "Discord", icon: DiscordLogoIcon, href: "https://evoverses.com/discord" },
    { name: "Twitter", icon: TwitterLogoIcon, href: "https://evoverses.com/twitter" },
    { name: "GitHub", icon: GitHubLogoIcon, href: "https://evoverses.com/github" },
  ];
  return (
    <main className="flex min-h-screen flex-col items-center justify-around p-24 pb-4 px-4 sm:px-24">
      <PardonOurDustAlert />
      <div className="flex flex-col text-center items-center">
        <Image
          src={Logo}
          alt="EvoVerses"
          className="w-[128px] h-[128px] sm:h-[256px] sm:w-[256px]"
          width={256}
          height={256}
        />
        <h1 className="pb-2">EvoVerses</h1>
        <h4>A 3D monster battling game bringing Web2 and Web3 together in one platform.</h4>
      </div>
      <Button variant="outline" size="lg" asChild>
        <Link href="https://opensea.com/collection/evoverses-evo" target="_blank">
          <SiOpensea className="h-5 w-5 mr-2 text-[#2081e2]" /> Buy on OpenSea
        </Link>
      </Button>
      <div className="flex space-x-4">
        {links.map(({ name, icon: Icon, href }, key) => (
          <Button key={key} variant="outline" asChild>
            <Link href={href} target="_blank">
              <Icon className="h-4 w-4 mr-2" /> {name}
            </Link>
          </Button>
        ))}
      </div>
    </main>
  );
};

export default Landing;
