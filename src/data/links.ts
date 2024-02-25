import { Icons } from "@/components/ui/icons";
import { evoContract } from "@/data/contracts";
import { RadixUIIcon } from "@/types/core";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { IconType } from "react-icons";
import { FaDiscord } from "react-icons/fa";
import { SiOpensea } from "react-icons/si";

type LinkData = {
  name: string,
  icon: IconType | RadixUIIcon,
  href: string,
  className?: string,
  buttonClassName?: string,
}

export const marketplaces: LinkData[] = [
  {
    name: "Hyperspace",
    icon: Icons.hyperspace,
    href: "https://avax.hyperspace.xyz/collection/avax/evoverses",
    className: "text-brand-hyperspace",
    buttonClassName: "bg-brand-hyperspace hover:bg-brand-hyperspace/80",
  },
  {
    name: "JoePegs",
    icon: Icons.joePegs,
    href: "https://joepegs.com/collections/avalanche/0x4151b8afa10653d304fdac9a781afccd45ec164c",
    className: "text-brand-joepegs",
    buttonClassName: "bg-brand-joepegs hover:bg-brand-joepegs/80",

  },
  {
    name: "OpenSea",
    icon: SiOpensea,
    href: "https://opensea.io/collection/evoverses-evo",
    className: "text-brand-opensea",
    buttonClassName: "bg-brand-opensea hover:bg-brand-opensea/80",
  },
] as const;

export const socialMedia: LinkData[] = [
  {
    name: "Discord",
    icon: FaDiscord,
    href: "https://evoverses.com/discord",
    className: "text-brand-discord",
    buttonClassName: "bg-brand-discord hover:bg-brand-discord/80",
  },
  {
    name: "Twitter",
    icon: Icons.x,
    href: "https://evoverses.com/twitter",
    className: "text-white",
    buttonClassName: "bg-white hover:bg-white/80",
  },
  {
    name: "GitHub",
    icon: GitHubLogoIcon,
    href: "https://evoverses.com/github",
    className: "text-white",
    buttonClassName: "bg-white hover:bg-white/80",
  },
] as const;

export const exchanges: LinkData[] = [
  {
    name: "Trader Joe",
    icon: Icons.joePegs,
    href: `https://traderjoexyz.com/avalanche/trade?outputCurrency=${evoContract.address}`,
    className: "text-brand-discord",
    buttonClassName: "bg-brand-discord hover:bg-brand-discord/80",
  },
] as const;
