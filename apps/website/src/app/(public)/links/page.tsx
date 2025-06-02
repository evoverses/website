import Logo from "@/assets/images/logo-text.png";
import { exchanges, marketplaces, socialMedia } from "@/data/links";
import { cn } from "@/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Links",
};

const LinksPage = () => {

  return (
    <main className="flex flex-grow flex-col items-center justify-around p-4 pt-0">
      <div className="flex flex-col text-center items-center">
        <Image
          src={Logo}
          alt="EvoVerses"
          className="w-[128px] h-[128px] sm:h-[256px] sm:w-[256px]"
          width={3840}
          height={3840}
        />
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 text-center">
          <h4>Buy EVO Tokens</h4>
          {exchanges.map(({ name, icon: Icon, href, className }, key) => (
            <Button key={key} variant="outline" size="xl" asChild>
              <Link href={href} referrerPolicy="no-referrer" target="_blank" prefetch={false}>
                <Icon className={cn("h-5 w-5 mr-2", className)} />
                <span className="hidden md:inline-flex">Buy on&nbsp;</span>
                {name}
              </Link>
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-center">
          <h4>Social Media</h4>
          {socialMedia.map(({ name, icon: Icon, href, className }, key) => (
            <Button key={key} variant="outline" size="xl" asChild>
              <Link href={href} referrerPolicy="no-referrer" target="_blank" prefetch={false}>
                <Icon className={cn("h-5 w-5 mr-2", className)} />
                {name}
              </Link>
            </Button>
          ))}
        </div>
        <div className="flex flex-col gap-2 text-center">
          <h4>Evo Marketplaces</h4>
          {marketplaces.map(({ name, icon: Icon, href, className }, key) => (
            <Button key={key} variant="outline" size="xl" asChild>
              <Link href={href} referrerPolicy="no-referrer" target="_blank" prefetch={false}>
                <Icon className={cn("h-5 w-5 mr-2", className)} />
                <span className="hidden md:inline-flex">Buy on&nbsp;</span>
                {name}
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </main>
  );
};
LinksPage.displayName = "LinksPage";

export default LinksPage;
