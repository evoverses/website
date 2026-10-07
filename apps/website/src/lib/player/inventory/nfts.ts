import type {
  InventoryRow,
  NftInventoryPage,
  PrivateWalletProjection,
} from "./types";
const collection = "0x4151b8afa10653d304fdac9a781afccd45ec164c";
const addressPattern = /^0x[a-fA-F0-9]{40}$/;
const uuid = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const integer = (v: unknown): v is number =>
  typeof v === "number" && Number.isSafeInteger(v) && v >= 0;
export function walletProjection(value: unknown): PrivateWalletProjection {
  if (
    !record(value) ||
    !Array.isArray(value.wallets) ||
    value.wallets.length > 50 ||
    typeof value.version !== "string" ||
    !/^[a-f0-9]{64}$/.test(value.version)
  )
    throw Error("Invalid private wallet projection");
  const seen = new Set<string>();
  const wallets = value.wallets.map((w) => {
    if (
      !record(w) ||
      typeof w.id !== "string" ||
      !uuid.test(w.id) ||
      w.chainId !== 43114 ||
      typeof w.address !== "string" ||
      !addressPattern.test(w.address) ||
      typeof w.label !== "string" ||
      !/^0x[a-fA-F0-9]{4}…[a-fA-F0-9]{4}$/.test(w.label) ||
      seen.has(w.address.toLowerCase())
    )
      throw Error("Invalid private wallet projection");
    seen.add(w.address.toLowerCase());
    return { id: w.id, chainId: 43114, address: w.address, label: w.label };
  });
  return { wallets, version: value.version };
}
export type NftSources = {
  fetchIndexed: (owners: string[], page: number) => Promise<unknown>;
  readChain: (
    owners: string[],
    tokenIds: string[],
  ) => Promise<{ owners: (string | null)[]; counts: (bigint | null)[] }>;
};
export async function loadLinkedNfts(
  projection: PrivateWalletProjection,
  page: number,
  sources: NftSources,
): Promise<NftInventoryPage> {
  const wallets = projection.wallets.map((w) => ({ id: w.id, label: w.label }));
  const base = {
    wallets,
    linksVersion: projection.version,
    checkedAt: new Date().toISOString(),
  };
  if (!wallets.length)
    return { ...base, rows: [], nextPage: null, chainTotal: 0, warnings: [] };
  const owners = projection.wallets.map((w) => w.address.toLowerCase());
  const byOwner = new Map(
    projection.wallets.map((w) => [w.address.toLowerCase(), w]),
  );
  let indexed: unknown;
  try {
    indexed = await sources.fetchIndexed(owners, page);
  } catch {
    return {
      ...base,
      rows: [],
      nextPage: null,
      chainTotal: null,
      warnings: ["DATA_SERVICE_UNAVAILABLE"],
    };
  }
  if (
    !record(indexed) ||
    !Array.isArray(indexed.items) ||
    indexed.items.length > 48 ||
    !integer(indexed.total) ||
    !(
      indexed.nextPage === null ||
      (integer(indexed.nextPage) &&
        indexed.nextPage > page &&
        indexed.nextPage <= 100_000)
    )
  )
    throw Error("Invalid indexed inventory page");
  const warnings = new Set<string>(),
    candidates: { id: string; metadata: Record<string, unknown> }[] = [],
    seen = new Set<string>();
  for (const asset of indexed.items) {
    if (
      !record(asset) ||
      asset.chainId !== "43114" ||
      typeof asset.address !== "string" ||
      asset.address.toLowerCase() !== collection ||
      typeof asset.owner !== "string" ||
      !byOwner.has(asset.owner.toLowerCase()) ||
      typeof asset.tokenId !== "string" ||
      !/^\d{1,78}$/.test(asset.tokenId)
    )
      continue;
    const token = BigInt(asset.tokenId);
    if (token >= 2n ** 256n) continue;
    const id = token.toString();
    if (seen.has(id)) continue;
    seen.add(id);
    const m = asset.metadata;
    if (
      !record(m) ||
      !["EVO", "EGG"].includes(String(m.type)) ||
      typeof m.species !== "string" ||
      !/^[a-z0-9_]{1,80}$/i.test(m.species)
    ) {
      warnings.add("METADATA_INCOMPLETE");
      continue;
    }
    candidates.push({ id, metadata: m });
  }
  let chain: Awaited<ReturnType<NftSources["readChain"]>>;
  try {
    chain = await sources.readChain(
      owners,
      candidates.map((c) => c.id),
    );
  } catch {
    return {
      ...base,
      rows: [],
      nextPage: indexed.nextPage as number | null,
      chainTotal: null,
      warnings: [...warnings, "OWNERSHIP_UNAVAILABLE"],
    };
  }
  if (
    chain.owners.length !== candidates.length ||
    chain.counts.length !== owners.length
  )
    throw Error("Incomplete chain ownership response");
  let chainTotal: number | null = null;
  if (chain.counts.every((c) => c !== null && c >= 0n)) {
    const total = chain.counts.reduce<bigint>((sum, n) => sum + (n ?? 0n), 0n);
    if (total <= BigInt(Number.MAX_SAFE_INTEGER)) chainTotal = Number(total);
  }
  if (chainTotal === null) warnings.add("OWNERSHIP_UNAVAILABLE");
  if (chainTotal !== null && chainTotal > indexed.total)
    warnings.add("METADATA_PENDING");
  const rows: InventoryRow[] = [];
  candidates.forEach((candidate, index) => {
    const current = chain.owners[index];
    if (!current || !addressPattern.test(current)) {
      warnings.add("OWNERSHIP_UNAVAILABLE");
      return;
    }
    const wallet = byOwner.get(current.toLowerCase());
    if (!wallet) {
      warnings.add("INDEXER_REFRESHING");
      return;
    }
    const m = candidate.metadata,
      species = String(m.species).toLowerCase(),
      egg = m.type === "EGG";
    rows.push({
      id: `nft:43114:${collection}:${candidate.id}`,
      kind: "nft",
      name: egg
        ? `${species === "unknown" ? "Evo" : species} egg`
        : `${species} #${candidate.id}`,
      image: null,
      quantity: 1,
      xp: !egg && integer(m.xp) ? m.xp : null,
      species,
      category: egg ? "Eggs" : "Evos",
      tokenId: candidate.id,
      form: egg ? "egg" : "evo",
      generation: integer(m.generation) ? m.generation : null,
      chroma:
        typeof m.chroma === "string" && /^[a-z0-9_-]{1,40}$/i.test(m.chroma)
          ? m.chroma
          : null,
      walletId: wallet.id,
      walletLabel: wallet.label,
    });
  });
  return {
    ...base,
    rows,
    nextPage: indexed.nextPage as number | null,
    chainTotal,
    warnings: [...warnings],
  };
}
