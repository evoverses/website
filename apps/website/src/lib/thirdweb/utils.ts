import { chains } from "@/lib/thirdweb/config";
import { toKebabCase } from "@/utils/strings";
import type { Chain } from "thirdweb";

export const normalizeChainName = (v: string | Chain) => typeof v === "string" ? toKebabCase(v) : toKebabCase(v.name!);

type GetChainReturn<T extends number | undefined, U extends Chain | undefined> = U extends Chain
  ? Chain
  : T extends number ? Chain : undefined;
export const getChainById = <T extends number | undefined, U extends Chain | undefined>(
  chainId?: T,
  fallback?: U,
): GetChainReturn<T, U> => (
  chains.find(c => c.id === Number(chainId)) || fallback
) as GetChainReturn<T, U>;

export const getChainByName = (name?: string) => chains.find(c => !name
  || normalizeChainName(c.name!)
  === normalizeChainName(name));
