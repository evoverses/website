import { Icons } from "@/components/ui/icons";
import { SiOpensea } from "react-icons/si";

export const marketplaces = [
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
];
