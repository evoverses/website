import { appDevMode } from "@/data/constants";
import { clamp } from "@workspace/evoverses/utils/numbers";

export const staleTimeMinutes = (minutes: number) => appDevMode
  ? 1 // 1ms
  : Math.floor(clamp(minutes, 0, 10_080)) * 60 * 1_000; // 0m-7d
