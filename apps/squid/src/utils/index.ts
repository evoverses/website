import { ContractType, StateStatus, TokenType } from "../model";
import type { Maybe, NumberIsh } from "../types/shared";
import type { Context } from "./context";

export const convertChainNumericStatus = (status: number) => [
  StateStatus.UNSET,
  StateStatus.CREATED,
  StateStatus.COMPLETED,
  StateStatus.CANCELLED,
][status] || StateStatus.UNSET;

export const convertChainNumericTokenType = (type: number) => [
  TokenType.ERC1155,
  TokenType.ERC721,
  TokenType.ERC20,
][type] || TokenType.UNKNOWN;

export const convertTokenTypeToContractType = (type: TokenType): ContractType => (
  {
    [TokenType.ERC1155]: ContractType.ERC1155,
    [TokenType.ERC721]: ContractType.ERC721,
    [TokenType.ERC20]: ContractType.ERC20,
    [TokenType.CUSTOM]: ContractType.CUSTOM,
    [TokenType.UNKNOWN]: ContractType.UNKNOWN,
  }[type]
);

/// Normalize to unix timestamp (10 digits)
const toTimestamp = (v: Maybe<NumberIsh | Date>) => v
  ? v instanceof Date
    ? Math.floor(v.getTime() / 1000)
    : Number(v.toString().slice(0, 10))
  : 0;

// Normalize to Date (stripping ms and ns)
export const toDate = (v: Maybe<NumberIsh | Date>) => new Date(toTimestamp(v) * 1000);

export const splitIntoBatches = function* <T>(list: T[], maxBatchSize: number): Generator<T[]> {
  if (list.length <= maxBatchSize) {
    yield list;
  } else {
    let offset = 0;
    while (list.length - offset > maxBatchSize) {
      yield list.slice(offset, offset + maxBatchSize);
      offset += maxBatchSize;
    }
    yield list.slice(offset);
  }
};

/**
 * Generates an array of numbers from `from` to `to` (inclusive).
 * If `from` is greater than `to`, it generates the array in reverse order.
 *
 * @param from - The starting number.
 * @param to - The ending number.
 * @returns An array of numbers from `from` to `to`.
 */
export const range = <T extends NumberIsh = number>(from: T, to: T): T[] => {
  const step = from <= to ? 1 : -1;
  return Array.from({ length: Math.abs(Number(to) - Number(from)) + 1 }, (_, i) => Number(from) + i * step)
    .map(v => typeof from === "bigint"
      ? BigInt(v)
      : Number(v)) as T[];
};

export const eventsToContractMap = (events: {
  contract: string,
  fromTokenId: bigint,
  toTokenId: bigint
}[]) => events.reduce((m, e) => {
  if (!m.has(e.contract)) {
    m.set(e.contract, new Set<bigint>());
  }
  m.set(e.contract, new Set<bigint>([ ...m.get(e.contract)!, ...range(e.fromTokenId, e.toTokenId) ]));

  return m;
}, new Map<string, Set<bigint>>());

export const pluralize = (val: NumberIsh, word: string, plural = word + "s") => {
  const pluralizer = (num: NumberIsh, word: string, plural: string) => [ 1, -1 ].includes(Number(num)) ? word : plural;
  if (typeof val === "object") {
    return (num: NumberIsh, word: string) => pluralizer(num, word, val[word]);
  }
  return pluralizer(val, word, plural);
};

export const fetchBlockHeight = async (ctx: Context) => {
  const resp = await ctx._chain.client.call("eth_blockNumber", []);
  return Number(resp);
};

export const splitSlice = function* (
  maxSize: number,
  beg: number,
  end?: number,
): Iterable<[ beg: number, end: number ]> {
  maxSize = Math.max(1, maxSize);
  end = end ?? Number.MAX_SAFE_INTEGER;
  while (beg < end) {
    let left = end - beg;
    let splits = Math.ceil(left / maxSize);
    let step = Math.round(left / splits);
    yield [ beg, beg + step ];
    beg += step;
  }
};

export const parseCsv = (csv?: string) => csv
  ? csv.replace(/ +/g, ",")
    .split(",")
    .filter(Boolean)
    .map(a => a.toLowerCase())
  : [];

export function getEnv(key: string): string | undefined;
export function getEnv<T>(key: string, fallback: T): T;
export function getEnv<T>(key: string, fallback?: T): string | T | undefined {
  const value = process.env[key];
  if (value === undefined) {
    return fallback as T;
  }
  return value as T;
}
