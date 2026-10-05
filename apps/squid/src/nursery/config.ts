export type NurseryConfig = {
  chainId: string;
  hatcher: string;
  collection: string;
  fromBlock: number;
};
const address = (value: string) =>
  /^0x[0-9a-f]{40}$/i.test(value) && !/^0x0{40}$/i.test(value);
export function nurseryConfig(
  env: Record<string, string | undefined>,
): NurseryConfig | undefined {
  const values = [
    env.NURSERY_HERMANN_ADDRESS,
    env.NURSERY_EVO_ADDRESS,
    env.NURSERY_FROM_BLOCK,
  ];
  if (values.every((value) => value === undefined || value === "")) return;
  if (values.some((value) => !value))
    throw new Error("Supply all three NURSERY registry settings.");
  if (env.BREEDING_BACKEND === "legacy-brenda")
    throw new Error(
      "Hermann and the legacy Brenda worker cannot share an active breeding backend.",
    );
  if (env.CHAIN_ID !== "43114")
    throw new Error("Nursery indexing requires Avalanche C-Chain (43114).");
  const [hatcher, collection, from] = values as [string, string, string];
  if (
    !address(hatcher) ||
    !address(collection) ||
    hatcher.toLowerCase() === collection.toLowerCase()
  )
    throw new Error("Invalid Nursery registry/collection address.");
  if (collection.toLowerCase() !== "0x4151b8afa10653d304fdac9a781afccd45ec164c")
    throw new Error(
      "Nursery must use the approved existing Evo C-Chain collection.",
    );
  if (!/^[0-9]+$/.test(from) || !Number.isSafeInteger(Number(from)))
    throw new Error("Invalid Nursery deployment block.");
  const watched = (env.NFT_ADDRESSES ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase());
  if (!watched.includes(collection.toLowerCase()))
    throw new Error(
      "Nursery collection must also be watched for NFT transfers.",
    );
  return {
    chainId: "43114",
    hatcher: hatcher.toLowerCase(),
    collection: collection.toLowerCase(),
    fromBlock: Number(from),
  };
}
