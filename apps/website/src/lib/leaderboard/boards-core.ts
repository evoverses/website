import { selection, type Period } from "./core";

export type ProgressionBoard = "pvbot" | "overall";
export type ProgressionEntry = {
  rank: number; name: string; level: number; pvpXp: number; pvbotXp: number;
  totalXp: number; lifetimeXp: number; battles: number; wins: number;
  losses: number; winRate: number | null;
};
export type ProgressionLeaderboard = {
  board: ProgressionBoard; period: Period; page: number; pageSize: 50; total: number;
  periodStart: string | null; calculatedAt: string; entries: ProgressionEntry[];
  own?: ProgressionEntry | null; ownRow?: number | null;
};
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const natural = (value: unknown): value is number => Number.isSafeInteger(value) && Number(value) >= 0;
const instant = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d\d-\d\dT.*Z$/.test(value) && Number.isFinite(Date.parse(value));

export function boardSelection(url: URL, board: ProgressionBoard): {period: Period; page: number} {
  const normalized = new URL(url);
  if (board === "overall" && !normalized.searchParams.has("period")) normalized.searchParams.set("period", "all");
  const input = selection(normalized);
  if (board === "overall" && input.period !== "all") throw Error("Overall is all-time only");
  return input;
}
function entry(value: unknown, board: ProgressionBoard): ProgressionEntry {
  if (!record(value) || Object.keys(value).sort().join(",") !== "battles,level,lifetimeXp,losses,name,pvbotXp,pvpXp,rank,totalXp,winRate,wins" ||
    typeof value.name !== "string" || !value.name.length || value.name.length > 80 ||
    ![value.rank, value.level, value.pvpXp, value.pvbotXp, value.totalXp, value.lifetimeXp, value.battles, value.wins, value.losses].every(natural) ||
    Number(value.rank) < 1 || Number(value.level) < 1 || Number(value.level) > 100 || Number(value.wins) + Number(value.losses) > Number(value.battles) ||
    Number(value.pvpXp) + Number(value.pvbotXp) !== value.totalXp || value.lifetimeXp !== value.totalXp || (board === "pvbot" && value.pvpXp !== 0) ||
    !(value.winRate === null || (typeof value.winRate === "number" && Number.isFinite(value.winRate) && value.winRate >= 0 && value.winRate <= 100))) {
    throw Error("Invalid leaderboard entry");
  }
  return value as ProgressionEntry;
}
export function parseBoard(value: unknown, expected: {board: ProgressionBoard; period: Period; page: number}, privateRead = false): ProgressionLeaderboard {
  if (!record(value) || Object.keys(value).some(key => !["board", "period", "page", "pageSize", "total", "periodStart", "calculatedAt", "entries", ...(privateRead ? ["own", "ownRow"] : [])].includes(key)) ||
    value.board !== expected.board || value.period !== expected.period || value.page !== expected.page || (expected.board === "overall" && expected.period !== "all") ||
    value.pageSize !== 50 || !natural(value.total) || !Array.isArray(value.entries) || value.entries.length > 50 || !instant(value.calculatedAt) ||
    !((expected.period === "all" && value.periodStart === null) || (expected.period !== "all" && instant(value.periodStart))) ||
    (privateRead && (!Object.hasOwn(value, "own") || !(value.own === null ? value.ownRow === null : natural(value.ownRow) && value.ownRow > 0)))) {
    throw Error("Invalid leaderboard response");
  }
  return {board: expected.board, period: expected.period, page: expected.page, pageSize: 50, total: value.total,
    periodStart: value.periodStart as string | null, calculatedAt: value.calculatedAt, entries: value.entries.map(row => entry(row, expected.board)),
    ...(privateRead ? {own: value.own === null ? null : entry(value.own, expected.board), ownRow: value.ownRow as number | null} : {})};
}
export function parsePosition(value: unknown, board: ProgressionBoard): {own: ProgressionEntry | null; ownRow: number | null; calculatedAt: string} {
  if (!record(value) || Object.keys(value).sort().join(",") !== "calculatedAt,own,ownRow" || !instant(value.calculatedAt) ||
    !(value.own === null ? value.ownRow === null : natural(value.ownRow) && value.ownRow > 0)) throw Error("Invalid position");
  return {own: value.own === null ? null : entry(value.own, board), ownRow: value.ownRow as number | null, calculatedAt: value.calculatedAt};
}
export async function boardRpc({connection, board, selection: input, token, fetchImpl = fetch}: {
  connection: {apiUrl: string; serviceToken: string}; board: ProgressionBoard; selection: {period: Period; page: number}; token?: string; fetchImpl?: typeof fetch;
}): Promise<ProgressionLeaderboard> {
  const url = new URL(connection.apiUrl);
  if (!["pvbot", "overall"].includes(board) || (board === "overall" && input.period !== "all") || url.protocol !== "https:" || url.origin !== connection.apiUrl || url.username || url.password || url.port ||
    !url.hostname.endsWith(".evoverses.com") || !/^[a-f0-9]{64}$/.test(connection.serviceToken) || (token !== undefined && !/^[a-f0-9]{64}$/.test(token))) throw Error("Leaderboard unavailable");
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetchImpl(`${url.origin}/internal/leaderboard/${board}${token ? "/me" : ""}`, {
      method: "POST", headers: {"Content-Type": "application/json", "X-EvoVerses-Service": connection.serviceToken, ...(token ? {Authorization: "Bearer " + token} : {})},
      body: JSON.stringify(input), cache: "no-store", redirect: "manual", credentials: "omit", signal: controller.signal,
    });
    if (response.status !== 200) throw Object.assign(Error("Leaderboard unavailable"), {status: [401, 403].includes(response.status) ? response.status : 503});
    if (!response.headers.get("content-type")?.startsWith("application/json") || !response.body) throw Error("Invalid response");
    const reader = response.body.getReader(), parts: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const part = await reader.read();
        if (controller.signal.aborted) throw Error("Timeout");
        if (part.done) break;
        size += part.value.length;
        if (size > 65536) throw Error("Response too large");
        parts.push(part.value);
      }
    } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    return parseBoard(JSON.parse(new TextDecoder("utf-8", {fatal: true}).decode(Buffer.concat(parts))), {board, ...input}, token !== undefined);
  } finally { clearTimeout(timer); controller.abort(); }
}
