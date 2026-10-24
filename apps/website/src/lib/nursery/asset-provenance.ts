import type { SquidAsset } from "@workspace/evoverses/lib/asset/types";
// The chain owns traits/counters; the existing metadata service owns settled XP
// and imported dates. Never replace those values with Fuji fixture defaults.
export function preserveMainnetProvenance(canonical: SquidAsset, indexed: SquidAsset | null | undefined, importedAdult: boolean): SquidAsset {
  if (indexed && (indexed.tokenId !== canonical.tokenId || indexed.chainId !== canonical.chainId || indexed.address.toLowerCase() !== canonical.address.toLowerCase())) throw new Error("Indexed Evo identity mismatch");
  if (importedAdult && (!indexed || indexed.metadata.type !== "EVO")) throw new Error("Imported Evo provenance is unavailable");
  if (canonical.metadata.type !== "EVO") return canonical;
  const prior = indexed?.metadata;
  if (prior?.type === "EVO" && (!Number.isSafeInteger(prior.xp) || prior.xp < 0)) throw new Error("Imported Evo XP is unavailable");
  if (importedAdult && prior?.type === "EVO" && prior.size !== canonical.metadata.size) throw new Error("Imported Evo size disagrees with preserved metadata");
  const history = prior as (typeof prior & { parent1TokenId?: string | null; parent2TokenId?: string | null });
  const knownDate = (value: string | null | undefined) => value && Number.isFinite(Date.parse(value)) && Date.parse(value) > 0 ? value : null;
  return { ...canonical, metadata: {
    ...canonical.metadata,
    xp: prior?.type === "EVO" ? prior.xp : 0,
    ...(importedAdult && prior?.type === "EVO" ? {
      createdAt: knownDate(prior.createdAt), hatchedAt: knownDate(prior.hatchedAt),
      parent1Id: prior.parent1Id ?? history?.parent1TokenId ?? null, parent2Id: prior.parent2Id ?? history?.parent2TokenId ?? null,
    } : {}),
  } };
}
