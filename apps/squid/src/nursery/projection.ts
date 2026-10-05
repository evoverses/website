export type Metadata = Record<string, string | number | boolean | null>;
export type BlockRef = { height: number; hash: string; timestamp: number };
export type RegistryEvent = BlockRef & {
  index: number;
  tokenId: bigint;
  name:
    | "AdultImported"
    | "EggRecorded"
    | "EggTreated"
    | "HatchRequested"
    | "EggHatched"
    | "MetadataUpdate";
  seed?: {
    species: bigint;
    generation: bigint;
    parent1: bigint;
    parent2: bigint;
  };
};
export type Adult = {
  species: bigint;
  generation: bigint;
  totalBreeds: bigint;
  lastBreedTime: bigint;
  attributes: {
    gender: bigint;
    rarity: bigint;
    primaryType: bigint;
    secondaryType: bigint;
    nature: bigint;
    size: bigint;
  };
  stats: {
    health: bigint;
    attack: bigint;
    defense: bigint;
    special: bigint;
    resistance: bigint;
    speed: bigint;
  };
};
export type Egg = {
  parent1: bigint;
  parent2: bigint;
  speciesVersion: bigint;
  createdAt: bigint;
  treated: boolean;
  status: number;
  vrfRequestId: bigint;
};
export type Species = {
  id: bigint;
  primaryType: bigint;
  secondaryType: bigint;
};
export type Snapshot = {
  id: string;
  hatcher: string;
  blockNumber: number;
  blockHash: string;
  metadata: Metadata;
};
export type Reader = {
  known(id: bigint): Promise<boolean>;
  egg(id: bigint): Promise<Egg>;
  adult(id: bigint): Promise<Adult>;
  species(version: bigint, species: bigint): Promise<Species>;
};
const elements = [
  "none",
  "water",
  "fire",
  "air",
  "plant",
  "earth",
  "light",
  "dark",
  "mineral",
  "corrupt",
  "ether",
  "bug",
  "monster",
];
const natures = [
  "dauntless",
  "executive",
  "restless",
  "nervous",
  "cunning",
  "energetic",
  "clever",
  "confident",
  "ignorant",
  "arrogant",
  "biting",
  "aggressive",
  "patient",
  "mature",
  "sensible",
  "calm",
  "rude",
  "cautious",
  "curious",
  "discrete",
  "loyal",
];
function integer(
  value: bigint,
  label: string,
  maximum = Number.MAX_SAFE_INTEGER,
) {
  if (typeof value !== "bigint" || value < 0n || value > BigInt(maximum))
    throw new Error("Invalid canonical " + label);
  return Number(value);
}
function date(value: bigint) {
  const result = new Date(integer(value, "timestamp") * 1000);
  if (!Number.isFinite(result.getTime()))
    throw new Error("Invalid canonical timestamp");
  return result.toISOString();
}
const element = (value: bigint) =>
  elements[integer(value, "element", elements.length - 1)]!;
export async function projectSnapshot(
  id: string,
  hatcher: string,
  tokenId: bigint,
  block: BlockRef,
  reader: Reader,
  previous?: Snapshot,
  seed?: RegistryEvent["seed"],
  hatchedAt?: number,
): Promise<Snapshot | undefined> {
  if (previous && previous.hatcher !== hatcher)
    throw new Error(
      "Registry changed: reconcile the previous deployment before replacing metadata.",
    );
  if (previous && previous.blockNumber > block.height) return previous;
  if (
    previous &&
    previous.blockNumber === block.height &&
    previous.blockHash !== block.hash
  )
    throw new Error(
      "Rollback the orphaned block before applying another fork.",
    );
  if (!(await reader.known(tokenId))) return;
  const egg = await reader.egg(tokenId);
  if (
    !Number.isInteger(egg.status) ||
    egg.status < 0 ||
    egg.status > 3 ||
    typeof egg.treated !== "boolean"
  )
    throw new Error("Invalid canonical egg state");
  const metadata: Metadata = {
    updated_at: new Date(block.timestamp).toISOString(),
  };
  if (egg.status > 0) {
    metadata.parent1_token_id = egg.parent1.toString();
    metadata.parent2_token_id = egg.parent2.toString();
    metadata.created_at = date(egg.createdAt);
    metadata.treated = egg.treated;
    metadata.egg_status = egg.status;
  }
  if (egg.status === 1 || egg.status === 2) {
    // Hermann deliberately has no adultOf result while an egg is incubating.
    // Seed species/generation from EggRecorded, then retain them in tracked state.
    const speciesId =
      seed?.species ??
      (previous ? BigInt(String(previous.metadata.species_id)) : undefined);
    const generation =
      seed?.generation ??
      (previous ? BigInt(String(previous.metadata.generation)) : undefined);
    if (speciesId === undefined || generation === undefined)
      throw new Error(
        "Missing EggRecorded history; replay from the registry deployment block.",
      );
    if (seed && (seed.parent1 !== egg.parent1 || seed.parent2 !== egg.parent2))
      throw new Error("Egg parents disagree with the registry.");
    const species = await reader.species(egg.speciesVersion, speciesId);
    if (species.id !== speciesId)
      throw new Error("Species version does not contain the egg species.");
    Object.assign(metadata, {
      type: "EGG",
      species_id: integer(speciesId, "species"),
      generation: integer(generation, "generation"),
      primary_type: element(species.primaryType),
      secondary_type: element(species.secondaryType),
      gender: "unknown",
      nature: "unknown",
      rarity: "unknown",
      chroma: "none",
      total_breeds: 0,
      last_breed_time: null,
      hatched_at: null,
      health: 0,
      attack: 0,
      defense: 0,
      special: 0,
      resistance: 0,
      speed: 0,
      size: 0,
    });
  } else {
    const adult = await reader.adult(tokenId);
    const a = adult.attributes;
    const rarity = integer(a.rarity, "rarity", 2);
    Object.assign(metadata, {
      type: "EVO",
      species_id: integer(adult.species, "species"),
      generation: integer(adult.generation, "generation"),
      total_breeds: integer(adult.totalBreeds, "breed count"),
      last_breed_time:
        adult.lastBreedTime === 0n ? null : date(adult.lastBreedTime),
      gender: integer(a.gender, "gender", 1) === 1 ? "male" : "female",
      rarity: rarity === 2 ? "epic" : "unknown",
      chroma: rarity === 1 ? "chroma" : "none",
      primary_type: element(a.primaryType),
      secondary_type: element(a.secondaryType),
      nature: natures[integer(a.nature, "nature", natures.length - 1)]!,
      size: integer(a.size, "size", 20),
    });
    for (const name of [
      "health",
      "attack",
      "defense",
      "special",
      "resistance",
      "speed",
    ] as const)
      metadata[name] = integer(
        adult.stats[name],
        name,
        name === "health" ? Number.MAX_SAFE_INTEGER : 50,
      );
    if (egg.status === 3) {
      const hatched =
        hatchedAt === undefined
          ? previous?.metadata.hatched_at
          : new Date(hatchedAt).toISOString();
      if (!hatched)
        throw new Error(
          "Missing EggHatched history; replay from the registry deployment block.",
        );
      metadata.hatched_at = hatched;
    }
  }
  // XP and original imported birth/hatch timestamps are intentionally absent:
  // the SQL read model preserves the established database values.
  return {
    id,
    hatcher,
    blockNumber: block.height,
    blockHash: block.hash,
    metadata,
  };
}
export function groupRegistryEvents(events: RegistryEvent[]) {
  const blocks = new Map<
    number,
    {
      block: BlockRef;
      tokens: Map<
        string,
        { tokenId: bigint; seed?: RegistryEvent["seed"]; hatchedAt?: number }
      >;
    }
  >();
  for (const event of [...events].sort(
    (a, b) => a.height - b.height || a.index - b.index,
  )) {
    if (
      !Number.isSafeInteger(event.height) ||
      event.height < 0 ||
      event.tokenId < 0n ||
      !/^0x[0-9a-f]{64}$/i.test(event.hash) ||
      !Number.isFinite(event.timestamp)
    )
      throw new Error("Invalid registry event position.");
    let group = blocks.get(event.height);
    if (!group) {
      group = { block: event, tokens: new Map() };
      blocks.set(event.height, group);
    }
    if (
      group.block.hash !== event.hash ||
      group.block.timestamp !== event.timestamp
    )
      throw new Error("Mixed forks in a registry batch.");
    const touch = (id: bigint) => {
      const key = id.toString();
      if (!group!.tokens.has(key)) group!.tokens.set(key, { tokenId: id });
      return group!.tokens.get(key)!;
    };
    const token = touch(event.tokenId);
    if (event.name === "EggRecorded") {
      if (!event.seed) throw new Error("EggRecorded has no offspring seed.");
      if (
        token.seed &&
        (["species", "generation", "parent1", "parent2"] as const).some(
          (key) => event.seed![key] !== token.seed![key],
        )
      )
        throw new Error("Conflicting egg records.");
      token.seed = event.seed;
      touch(event.seed.parent1);
      touch(event.seed.parent2);
    }
    if (event.name === "EggHatched") token.hatchedAt = event.timestamp;
  }
  return [...blocks.values()];
}
