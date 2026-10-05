import type { AbiFunction, FunctionReturn } from "@subsquid/evm-abi";
import type { Codec, Struct, EncodedStruct } from "@subsquid/evm-codec";
import { functions } from "../abi/generated/hatcher-hermann";
import type { BlockRef, Reader } from "./projection";
import type { NurseryConfig } from "./config";
export type Rpc = {
  call<T = unknown>(method: string, params?: unknown[]): Promise<T>;
};
/** EIP-1898 pins every eth_call to this fork. Unsupported/pruned reads fail closed. */
export async function registryReader(
  client: Rpc,
  config: NurseryConfig,
  block: BlockRef,
): Promise<Reader> {
  if (
    Number(BigInt(await client.call<string>("eth_chainId"))) !==
    Number(config.chainId)
  )
    throw new Error("Registry RPC is on the wrong chain.");
  async function read<
    T extends Struct,
    R extends Codec<unknown> | Struct | undefined,
  >(
    func: AbiFunction<T, R>,
    args: EncodedStruct<T>,
  ): Promise<FunctionReturn<AbiFunction<T, R>>> {
    const result = await client.call<string>("eth_call", [
      { to: config.hatcher, data: func.encode(args) },
      { blockHash: block.hash, requireCanonical: true },
    ]);
    return func.decodeResult(result);
  }
  if ((await read(functions.evoNft, {})).toLowerCase() !== config.collection)
    throw new Error("Hermann references a different NFT collection.");
  const pools = new Map<
    string,
    Promise<FunctionReturn<typeof functions.getSpeciesPool>>
  >();
  return {
    known: (tokenId) => read(functions.known, { _0: tokenId }),
    egg: (tokenId) => read(functions.eggs, { _0: tokenId }),
    adult: (tokenId) => read(functions.adultOf, { tokenId }),
    species: async (version, speciesId) => {
      const key = version.toString();
      if (!pools.has(key))
        pools.set(key, read(functions.getSpeciesPool, { version }));
      const species = (await pools.get(key)!).find(
        (value) => value.id === speciesId,
      );
      if (!species) throw new Error("Missing versioned species configuration.");
      return species;
    },
  };
}
