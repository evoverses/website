import {
  evoContractAddress,
  evoNftContractAddress,
  usdcContractAddress,
  usdtContractAddress,
  wavaxContractAddress,
} from "@/data/addresses";
import { chain, client } from "@/lib/thirdweb/config";
import { getContract } from "thirdweb";

export const investorContract = getContract({
  address: "0xD782Cf9F04E24CAe4953679EBF45ba34509F105C",
  client,
  chain,
});

export const evoContract = getContract({
  address: evoContractAddress,
  client,
  chain,
});
export const xEvoContract = getContract({
  address: "0x693E07bf86367adF8051926F66321fa9E8eBfFb4",
  client,
  chain,
});
export const cEvoContract = getContract({
  address: "0x7B5501109c2605834F7A4153A75850DB7521c37E",
  client,
  chain,
});

export const evoNftContract = getContract({
  address: evoNftContractAddress,
  client,
  chain,
});

export const marketplaceContract = getContract({
  address: "0x888BEB2C914657B1eA2cCC91555C5800eecdD4c0",
  client,
  chain,
});

export const usdcContract = getContract({
  address: usdcContractAddress,
  client,
  chain,
});

export const usdtContract = getContract({
  address: usdtContractAddress,
  client,
  chain,
});

export const wavaxContract = getContract({
  address: wavaxContractAddress,
  client,
  chain,
});
