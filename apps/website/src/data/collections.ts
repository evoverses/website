import type { Collection } from "@/lib/collection/types";
import EvoCollectionAvatar from "@/assets/collections/evos/avatar.png";
import EvoCollectionBanner from "@/assets/collections/evos/banner.png";
import TrainerCollectionAvatar from "@/assets/collections/trainers/avatar.png";

export const collections: Collection[] = [
  {
    name: "Evos",
    slug: "evo",
    description: "Evos are powerful 3D monsters that roam the world with unique abilities and are prone to fights!",
    images: {
      avatar: EvoCollectionAvatar,
      banner: EvoCollectionBanner,
    },
    features: {},
    marketplaces: {
      opensea: "https://opensea.io/collection/evoverses-evo",
      joepegs: "https://joepegs.com/collections/avalanche/0x4151b8afa10653d304fdac9a781afccd45ec164c",
    },
    contracts: [
      { chainId: "43114", address: "0x4151b8afa10653d304FdAc9a781AFccd45EC164c" },
    ],
    fees: [],
  },
  {
    name: "Trainers",
    slug: "trainers",
    description: "The most powerful beings in the universe, able to catch, train, and battle with Evos! Available soon...",
    images: {
      avatar: TrainerCollectionAvatar,
      banner: EvoCollectionBanner,
    },
    features: {
      comingSoon: true,
    },
    marketplaces: {},
    contracts: [],
    fees: [],
  },
];
