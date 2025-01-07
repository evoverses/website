import { chain, client } from "@/thirdweb.config";
import { getContract } from "thirdweb";

export const investorContract = getContract({
  address: "0xD782Cf9F04E24CAe4953679EBF45ba34509F105C",
  client,
  chain,
});
export const evoContract = getContract({
  address: "0x42006Ab57701251B580bDFc24778C43c9ff589A1",
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
  address: "0x4151b8afa10653d304FdAc9a781AFccd45EC164c",
  client,
  chain,
});
