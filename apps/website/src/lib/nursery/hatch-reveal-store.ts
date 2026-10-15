import type { Hex } from "viem";
export type HatchRevealRecord = { tokenId: string; hash?: Hex; dismissed: boolean; celebrated: boolean };
export function readHatchReveals(value: string | null): HatchRevealRecord[] {
  try {
    const parsed: unknown = JSON.parse(value ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is HatchRevealRecord => Boolean(item && typeof item === "object" &&
      typeof item.tokenId === "string" && /^[1-9][0-9]{0,77}$/.test(item.tokenId) && BigInt(item.tokenId) < 2n ** 256n &&
      (item.hash === undefined || typeof item.hash === "string" && /^0x[0-9a-fA-F]{64}$/.test(item.hash)) &&
      typeof item.dismissed === "boolean" && typeof item.celebrated === "boolean")).slice(0, 100);
  } catch { return []; }
}
export function rememberHatch(records: HatchRevealRecord[], tokenId: string, hash?: Hex): HatchRevealRecord[] {
  const existing = records.find(record => record.tokenId === tokenId && record.hash === hash);
  return [existing ?? { tokenId, hash, dismissed: false, celebrated: !hash }, ...records.filter(record => record !== existing && record.tokenId !== tokenId)].slice(0, 100);
}
