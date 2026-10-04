// Mirrors EvoBreedingRules.sol. All money and timestamps use integer arithmetic.
export const EVO_UNIT = 10n ** 18n;
export const DAY = 86_400n;
export const INCUBATION = 3n * DAY;
export const TREAT_COST = 250n * EVO_UNIT;
export type Parent = {
  tokenId: string;
  generation: bigint;
  totalBreeds: bigint;
  lastBreedTime: bigint;
  gender: string | number;
  primaryType: string | number;
  secondaryType: string | number;
  reserved?: boolean;
  available?: boolean;
};
export function parentCost(parent: Parent) {
  if (
    parent.generation < 0n ||
    parent.generation > 255n ||
    parent.totalBreeds < 0n
  )
    throw new Error("Invalid parent traits");
  const breeds =
    parent.generation === 0n && parent.totalBreeds > 4n
      ? 4n
      : parent.totalBreeds;
  return 500n * EVO_UNIT * 2n ** parent.generation * (breeds + 1n);
}
export function cooldown(generation: bigint) {
  return (generation < 6n ? 7n - generation : 1n) * DAY;
}
export function parentUnavailable(parent: Parent, now: bigint): string | null {
  if (parent.available === false) return "Not ready for this nursery";
  if (parent.reserved) return "Already breeding";
  if (
    parent.generation < 0n ||
    parent.generation > 255n ||
    parent.totalBreeds < 0n
  )
    return "Traits unavailable";
  if (![0, 1, "male", "female"].includes(parent.gender))
    return "Gender unavailable";
  if (parent.generation !== 0n && parent.totalBreeds >= 5n)
    return "All five breeds used";
  if (now < parent.lastBreedTime + cooldown(parent.generation))
    return "Recovering from breeding";
  return null;
}
export function compatible(first: Parent, second: Parent) {
  const gender = (value: Parent["gender"]) =>
    value === "male" ? 1 : value === "female" ? 0 : value;
  const known = (value: Parent["gender"]) =>
    [0, 1].includes(gender(value) as number);
  const element = (value: Parent["primaryType"]) =>
    value !== "none" && value !== "unknown" && value !== 0;
  return (
    first.tokenId !== second.tokenId &&
    known(first.gender) &&
    known(second.gender) &&
    gender(first.gender) !== gender(second.gender) &&
    [first.primaryType, first.secondaryType]
      .filter(element)
      .some((type) =>
        [second.primaryType, second.secondaryType]
          .filter(element)
          .includes(type),
      )
  );
}
export function nativeBudget(quote: bigint) {
  return quote + (quote + 9n) / 10n;
}
export function hatchState(
  createdAt: bigint,
  status: number,
  treated: boolean,
  fulfilled: boolean,
  now: bigint,
) {
  return {
    canTreat: status === 1 && !treated,
    canRequest: status === 1 && now >= createdAt + INCUBATION,
    canComplete: status === 2 && fulfilled,
    remaining: createdAt + INCUBATION > now ? createdAt + INCUBATION - now : 0n,
  };
}
export function remainingTime(seconds: bigint) {
  if (seconds <= 0n) return "Ready to hatch";
  const days = seconds / DAY;
  const hours = (seconds % DAY) / 3600n;
  const minutes = (seconds % 3600n) / 60n;
  return [days ? `${days}d` : "", hours ? `${hours}h` : "", `${minutes}m`]
    .filter(Boolean)
    .join(" ");
}
