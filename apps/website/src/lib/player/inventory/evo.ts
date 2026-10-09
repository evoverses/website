import catalogue from "@/data/evo-progression.json";
export const statKeys = [
  "health",
  "attack",
  "special",
  "defense",
  "resistance",
  "speed",
] as const;
export type StatKey = (typeof statKeys)[number];
export type EvoStats = Record<StatKey, number>;
export type GeneratedEvoStats = {
  schemaVersion: 1;
  level: 1;
  experience: 0;
  baseStats: EvoStats;
  genetics: EvoStats;
  trainingPoints: EvoStats;
  values: EvoStats;
  nature: string;
  gender: "Female" | "Male";
  size: number;
  currentHealth: number;
  moves: number[];
};
// Same integer interpolation as the game and account service; Health genes do not alter HP.
export function levelHealth(baseHealth: number, level: number, training = 0): number {
  const end = baseHealth + Math.floor(training / 5), start = Math.max(1, Math.round(end / 10));
  return Math.round((start * (100 - level) + end * (level - 1)) / 99);
}
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const integer = (v: unknown, min = 0, max = 2147483647): v is number =>
  Number.isSafeInteger(v) && Number(v) >= min && Number(v) <= max;
const invalid = (): never => {
  throw Error("Invalid account Evo details");
};
function stats(v: unknown, min: number, max: number): EvoStats {
  if (
    !record(v) ||
    Object.keys(v).length !== statKeys.length ||
    statKeys.some((k) => !integer(v[k], min, max))
  )
    return invalid();
  return Object.fromEntries(statKeys.map((k) => [k, v[k]])) as EvoStats;
}
export function parseEvoStats(
  value: unknown,
  species: string,
): Record<string, number> | GeneratedEvoStats {
  if (!record(value) || Object.keys(value).length > 32) return invalid();
  if (!Object.hasOwn(value, "schemaVersion")) {
    if (Object.values(value).some((v) => !integer(v))) return invalid();
    return value as Record<string, number>;
  }
  const learnset = (
    catalogue.species as Record<string, { moves: Record<string, number> }>
  )[species.toLowerCase()]?.moves;
  if (
    value.schemaVersion !== 1 ||
    value.level !== 1 ||
    value.experience !== 0 ||
    !learnset ||
    typeof value.nature !== "string" ||
    !catalogue.natures.some((n) => n.name === value.nature) ||
    !["Female", "Male"].includes(String(value.gender)) ||
    typeof value.size !== "number" ||
    !Number.isFinite(value.size) ||
    Math.abs(value.size) > 1 ||
    !Array.isArray(value.moves) ||
    !value.moves.length ||
    value.moves.length > 4 ||
    new Set(value.moves).size !== value.moves.length ||
    value.moves.some(
      (id) =>
        !integer(id, 1) ||
        !Object.hasOwn(learnset, String(id)) ||
        learnset[String(id)]! > 1,
    )
  )
    return invalid();
  const values = stats(value.values, 1, 10000);
  if (
    !integer(value.currentHealth ?? values.health, 0, values.health)
  )
    return invalid();
  return {
    schemaVersion: 1,
    level: 1,
    experience: 0,
    baseStats: stats(value.baseStats, 1, 10000),
    genetics: stats(value.genetics, 1, 50),
    trainingPoints: stats(value.trainingPoints, 0, 0),
    values,
    nature: value.nature,
    gender: value.gender as "Female" | "Male",
    size: value.size,
    currentHealth: Number(value.currentHealth ?? values.health),
    moves: value.moves as number[],
  }; // Only supported public gameplay fields leave this boundary; no backend metadata is forwarded.
}
export function isGeneratedStats(
  value: Record<string, number> | GeneratedEvoStats,
): value is GeneratedEvoStats {
  return value.schemaVersion === 1 && typeof value.values === "object";
}
export function evoProgression(species: string, stats: GeneratedEvoStats, experience = 0) {
  const rule = (catalogue.species as Record<string,{moves:Record<string,number>;maxXp:number}>)[species.toLowerCase()]!;
  let level = 1;for(let next=2;next<=100;next++){if(experience < Math.round(next**3*rule.maxXp/1000000))break;level=next;}
  const nature = catalogue.natures.find((n) => n.name === stats.nature)!;
  const projected = Object.fromEntries(
    statKeys.map((k) => [
      k,
      k === "health"
        ? levelHealth(stats.baseStats.health,100,stats.trainingPoints.health)
        : Math.round(
            (stats.baseStats[k] +
              stats.genetics[k] +
              Math.floor(stats.trainingPoints[k] / 5)) *
              (k === nature.increase ? 1.08 : k === nature.decrease ? 0.92 : 1),
          ),
    ]),
  ) as EvoStats;
  const learnset = (
    catalogue.species as Record<string, { moves: Record<string, number> }>
  )[species.toLowerCase()]!.moves;
  const moves = Object.entries(learnset)
    .map(([id, required]) => ({
      id: Number(id),
      name:
        required <= level
          ? (catalogue.moveNames as Record<string, string>)[id] || `Move #${id}`
          : "New move",
      level: required,
      equipped: stats.moves.includes(Number(id)),
      unlocked: required <= level,
      remainingPP: undefined as number | undefined,
      maximumPP: undefined as number | undefined,
    }))
    .sort((a, b) => a.level - b.level || a.id - b.id);
  return {
    combatVerified: false,
    recoverAt: null as string | null,
    combatVersion: undefined as number | undefined,
    level,
    geneticHealthAvailable: true,
    nature: stats.nature,
    gender: stats.gender,
    maxHealth: levelHealth(stats.baseStats.health,level,stats.trainingPoints.health),
    currentHealth: stats.currentHealth,
    values: {...stats.values,health:levelHealth(stats.baseStats.health,level,stats.trainingPoints.health)},
    projected,
    genetics: stats.genetics,
    moves,
  };
}

// Indexed metadata contains genetic ratings, not depleted combat HP or saved move choices.
// Project only validated, ownership-checked traits. Missing metadata stays unavailable.
export function nftProgression(
  species: string,
  metadata: Record<string, unknown>,
): ReturnType<typeof evoProgression> | undefined {
  const entry = (
    catalogue.species as Record<
      string,
      { moves: Record<string, number>; baseStats: EvoStats; maxXp: number }
    >
  )[species];
  const nature = catalogue.natures.find(
    (n) => n.name.toLowerCase() === String(metadata.nature).toLowerCase(),
  );
  const keys = statKeys.filter((k) => k !== "health");
  if (
    !entry ||
    !nature ||
    !integer(metadata.xp) ||
    !["female", "male"].includes(String(metadata.gender).toLowerCase()) ||
    keys.some((k) => !integer(metadata[k], 0, 50))
  )
    return undefined;
  let level = 1;
  for (let next = 2; next <= 100; next++) {
    if (Number(metadata.xp) < Math.round((next ** 3 * entry.maxXp) / 1000000))
      break;
    level = next;
  }
  const genetics = Object.fromEntries(
    statKeys.map((k) => [k, k === "health" ? 0 : Number(metadata[k])]),
  ) as EvoStats;
  const projected = Object.fromEntries(
    statKeys.map((k) => [
      k,
      k === "health"
        ? levelHealth(entry.baseStats.health,100)
        : Math.round(
            (entry.baseStats[k] + genetics[k]) *
              (k === nature.increase ? 1.08 : k === nature.decrease ? 0.92 : 1),
          ),
    ]),
  ) as EvoStats;
  const values = Object.fromEntries(
    statKeys.map((k) => [
      k,
      k === "health"
        ? levelHealth(entry.baseStats.health,level)
        : Math.round(
            (((entry.baseStats[k] + genetics[k]) * level) / 100) *
              (k === nature.increase ? 1.08 : k === nature.decrease ? 0.92 : 1),
          ),
    ]),
  ) as EvoStats;
  // Current health is optional: never replace an explicitly recorded zero with full HP.
  if (
    Object.hasOwn(metadata, "currentHealth") &&
    !integer(metadata.currentHealth, 0, values.health)
  )
    return undefined;
  const moves = Object.entries(entry.moves)
    .map(([id, required]) => ({
      id: Number(id),
      name:
        required <= level
          ? (catalogue.moveNames as Record<string, string>)[id] || `Move #${id}`
          : "New move",
      level: required,
      equipped: false,
      unlocked: required <= level,
      remainingPP: undefined as number | undefined,
      maximumPP: undefined as number | undefined,
    }))
    .sort((a, b) => a.level - b.level || a.id - b.id);
  return {
    combatVerified: false,
    recoverAt: null as string | null,
    combatVersion: undefined as number | undefined,
    level,
    nature: nature.name,
    gender:
      String(metadata.gender).toLowerCase() === "female" ? "Female" : "Male",
    maxHealth: values.health,
    currentHealth: Number(metadata.currentHealth ?? values.health),
    values,
    projected,
    genetics,
    geneticHealthAvailable: false,
    moves,
  };
}
