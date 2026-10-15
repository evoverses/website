import { hatchState, remainingTime } from "./rules";
import type { Egg } from "./contracts";

export function breedHatchProgress(egg: Egg, fulfilled: boolean, now: bigint, incubation: bigint) {
  if (egg[5] === 3) return { complete: true, title: "Hatched", advice: "Your Evo has hatched." };
  if (egg[5] === 2) return fulfilled
    ? { complete: false, title: "Ready to reveal", advice: "Reveal your Evo with Hermann." }
    : { complete: false, title: "Preparing your Evo", advice: "Your hatch is underway. Check back shortly." };
  if (egg[5] !== 1) throw new Error("The egg's hatching status is unavailable.");
  const state = hatchState(egg[3], egg[5], egg[4], fulfilled, now, incubation);
  return state.canRequest
    ? { complete: false, title: "Ready to hatch", advice: "Visit Hermann to start hatching." }
    : { complete: false, title: "Incubating", advice: `Ready to hatch in ${remainingTime(state.remaining)}.` };
}
