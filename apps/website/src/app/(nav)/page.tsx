import Logo from "@/assets/images/logo-text.png";
import { YouTubeVideo } from "@/components/youtube-video";
import { marketplaces } from "@/data/links";
import { cn } from "@/lib/utils";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { Button } from "@workspace/ui/components/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@workspace/ui/components/carousel";
import { Icons } from "@workspace/ui/components/icons";
import Image from "next/image";
import Link from "next/link";

const links = [
  { name: "Discord", icon: DiscordLogoIcon, href: "https://evoverses.com/discord" },
  { name: "Twitter", icon: Icons.x, href: "https://evoverses.com/twitter" },
  { name: "GitHub", icon: GitHubLogoIcon, href: "https://evoverses.com/github" },
];

const Landing = () => {

  return (
    <main className="flex flex-grow flex-col items-center justify-around p-4 pt-0 sm:px-24">
      <div className="flex flex-col text-center items-center">
        <Image
          src={Logo}
          alt="EvoVerses"
          className="w-[256px] h-[256px] sm:h-[256px] sm:w-[256px]"
          width={3840}
          height={3840}
        />
        <h4>A 3D monster battling game bringing Web2 and Web3 together in one platform.</h4>
      </div>
      <Carousel className="w-full max-w-xs sm:max-w-md md:max-w-xl lg:max-w-3xl xl:max-w-5xl">
        <CarouselContent>
          {[ "Evj1u4CFQqo", "gvIWDC_o6NA", "zKbV2S8t318" ].map(k => (
            <CarouselItem key={k}>
              <YouTubeVideo
                videoId={k}
                className="w-[320px] h-[180px] sm:w-[464px] sm:h-[261px] md:w-[592px] md:h-[333px] lg:w-[784px] lg:h-[441px] xl:w-[1040px] xl:h-[585px]"
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="max-sm:-left-0" />
        <CarouselNext className="max-sm:-right-0" />
      </Carousel>
      <div className="flex flex-col gap-4 md:items-center xl:w-full xl:flex-row xl:justify-between xl:max-w-5xl">
        <div className="flex justify-between md:gap-4">
          {marketplaces.map(({ name, icon: Icon, href, className }, key) => (
            <Button key={key} variant="outline" size="lg" className="flex px-2 md:px-4 lg:px-8" asChild>
              <Link href={href} referrerPolicy="no-referrer" target="_blank" prefetch={false}>
                <Icon className={cn("size-5 mr-2", className)} />
                <div>
                  <span className="hidden md:inline-flex">Buy on&nbsp;</span>
                  {name}
                </div>
              </Link>
            </Button>
          ))}
        </div>
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
