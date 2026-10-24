import { avalanche, avalancheFuji } from "viem/chains";
import { isAddress, zeroAddress, type Address } from "viem";

export const mainnetNurseryDependencies = {
  authority: "0x204fc7955F816352afDe77D84e4e8719D2C28A0A",
  token: "0x42006Ab57701251B580bDFc24778C43c9ff589A1",
  nft: "0x4151b8afa10653d304FdAc9a781AFccd45EC164c",
  wrapper: "0x62Fb87c10A917580cA99AB9a86E213Eb98aa820C",
} as const;
export const chainlinkFujiWrapper = "0x327B83F409E1D5f13985c6d0584420FA648f1F56" as Address;
const address = (value?: string): Address => value && isAddress(value, { strict: false }) && value.toLowerCase() !== zeroAddress ? value as Address : zeroAddress;
const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
export type NurseryEnvironment = Record<string, string | undefined>;
export function resolveNurseryNetwork(env: NurseryEnvironment) {
  const mode = env.NEXT_PUBLIC_NURSERY_NETWORK ?? "fuji";
  const mainnet = mode === "mainnet-pilot";
  const chain = mainnet ? avalanche : avalancheFuji;
  const token = address(mainnet ? env.NEXT_PUBLIC_NURSERY_EVO_ADDRESS : env.NEXT_PUBLIC_FUJI_EVO_ADDRESS);
  const nft = address(mainnet ? env.NEXT_PUBLIC_NURSERY_NFT_ADDRESS : env.NEXT_PUBLIC_FUJI_EVO_NFT_ADDRESS);
  const bertha = address(mainnet ? env.NEXT_PUBLIC_NURSERY_BERTHA_ADDRESS : env.NEXT_PUBLIC_FUJI_BERTHA_ADDRESS);
  const hermann = address(mainnet ? env.NEXT_PUBLIC_NURSERY_HERMANN_ADDRESS : env.NEXT_PUBLIC_FUJI_HERMANN_ADDRESS);
  const wrapper = address(mainnet ? env.NEXT_PUBLIC_NURSERY_WRAPPER_ADDRESS : env.NEXT_PUBLIC_FUJI_WRAPPER_ADDRESS);
  const values = [token, nft, bertha, hermann, wrapper];
  const dependencies = mainnet
    ? same(token, mainnetNurseryDependencies.token) && same(nft, mainnetNurseryDependencies.nft) && same(wrapper, mainnetNurseryDependencies.wrapper)
    : values.every(value => ![mainnetNurseryDependencies.token, mainnetNurseryDependencies.nft, mainnetNurseryDependencies.wrapper].some(live => same(value, live)));
  const configured = ["fuji", "mainnet-pilot"].includes(mode) && values.every(value => value !== zeroAddress) && new Set(values.map(value => value.toLowerCase())).size === 5 && dependencies && (!mainnet || env.NEXT_PUBLIC_NURSERY_REGISTRY_VERSION === "2");
  const history = (mainnet ? env.NEXT_PUBLIC_NURSERY_HERMANN_HISTORY : env.NEXT_PUBLIC_FUJI_HERMANN_HISTORY) ?? "";
  return {
    mode, chain, token, nft, bertha, hermann, wrapper, configured,
    transactionsEnabled: configured && (!mainnet || env.NEXT_PUBLIC_NURSERY_MAINNET_APPROVED === "1"),
    message: mainnet ? "Avalanche mainnet · Live assets · Private testing" : "Fuji test mode · Test assets only",
    chainlink: same(wrapper, mainnet ? mainnetNurseryDependencies.wrapper : chainlinkFujiWrapper),
    history: [...new Set(history.split(",").slice(0, 4).map(value => address(value.trim())))].filter(value => value !== zeroAddress && !values.some(current => same(value, current)) && (!mainnet || !same(value, chainlinkFujiWrapper))),
  };
}
