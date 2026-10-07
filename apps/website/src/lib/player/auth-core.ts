import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const playerWebOrigin = "http://localhost:3100";
export const playerSessionCookie = "ev:player-session";
export const epicStateCookie = "ev:epic-state";
export const epicPendingCookie = "ev:epic-pending";
const callbackUrl = playerWebOrigin + "/api/player/auth/epic/callback";
const hex = /^[0-9a-f]{64}$/;
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export type Player = { id: string; displayName: string; experience: number };
export type PlayerSnapshot = { player: Player; balance: { evoros: number } };
export type Inventory = { items: { productId: string; revision: number; quantity: number }[]; evos: { id: string; speciesKey: string; experience: number; stats: Record<string, number> }[] };
export type LocalEpicConfig = { clientId: string; clientSecret: string; deploymentId: string; applicationId: string; apiUrl: string };
export class PlayerWebError extends Error {
  constructor(public code: string) { super(code); }
}
const fail = (code: string): never => { throw new PlayerWebError(code); };
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const natural = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const seconds = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
const uuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
function player(value: unknown): Player {
  if (!record(value) || !uuid(value.id) || typeof value.displayName !== "string" || !value.displayName.length || value.displayName.length > 64 || !natural(value.experience)) return fail("SERVICE_UNAVAILABLE");
  return { id: value.id, displayName: value.displayName, experience: value.experience };
}

// Single-process, development-only OAuth transactions. Provider evidence never reaches browser storage.
export type AuthDiagnostic = { stage: "epic-token" | "account-login" | "account-profile" | "account-inventory" | "account-logout"; outcome: "http-error" | "timeout" | "invalid-response" | "network-error"; status?: number; elapsedMs: number };
export function createPlayerWebAuth({ configuration, fetchImpl = fetch, now = Date.now, diagnostic }: {
  configuration: () => LocalEpicConfig | null; fetchImpl?: typeof fetch; now?: () => number; diagnostic?: (value: AuthDiagnostic) => void;
}) {
  const states = new Map<string, { cookieHash: string; expires: number; context: string }>();
  const pending = new Map<string, { proof: string; expires: number; context: string }>();
  let starts: number[] = [], active = 0;
  const config = () => {
    const value = configuration();
    if (!value || !/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(value.apiUrl) || new URL(value.apiUrl).port === "0") return fail("SIGNIN_UNAVAILABLE");
    return value;
  };
  const context = (c: LocalEpicConfig) => hash(JSON.stringify([c.clientId, c.applicationId, c.deploymentId, c.apiUrl]));
  function cleanup() {
    for (const map of [states, pending]) for (const [key, value] of map) if (value.expires <= now()) map.delete(key);
  }
  async function boundedResponse(response: Response, signal: AbortSignal, limit = 65536) {
    if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get("content-type") || "") || !response.body || Number(response.headers.get("content-length") || 0) > limit) { await response.body?.cancel().catch(() => {}); return fail("SERVICE_UNAVAILABLE"); }
    const reader = response.body.getReader();
    const cancel = () => { void reader.cancel().catch(() => {}); };
    signal.addEventListener("abort", cancel, { once: true });
    let size = 0; const chunks: Uint8Array[] = [];
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (signal.aborted) return fail("SERVICE_UNAVAILABLE");
        if (done) break;
        size += value.byteLength;
        if (size > limit) return fail("SERVICE_UNAVAILABLE");
        chunks.push(value);
      }
      return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))) as unknown;
    } catch { return fail("SERVICE_UNAVAILABLE"); }
    finally { signal.removeEventListener("abort", cancel); await reader.cancel().catch(() => {}); }
  }
  async function request(url: string, init: RequestInit = {}) {
    const stage: AuthDiagnostic["stage"] = url === "https://api.epicgames.dev/epic/oauth/v2/token" ? "epic-token" : url.endsWith("/v1/auth/login") ? "account-login" : url.endsWith("/v1/player/me") ? "account-profile" : url.endsWith("/v1/player/inventory") ? "account-inventory" : "account-logout";
    const started = Date.now();
    const report = (outcome: AuthDiagnostic["outcome"], status?: number) => { try { diagnostic?.({ stage, outcome, ...(status === undefined ? {} : { status }), elapsedMs: Date.now() - started }); } catch { /* Diagnostics never affect authentication. */ } };
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        (async () => {
          const response = await fetchImpl(url, { ...init, cache: "no-store", redirect: "error", credentials: "omit", signal: controller.signal });
          if (response.status >= 500 || ((stage === "epic-token" || stage === "account-login") && response.status >= 400)) report("http-error", response.status);
          const value = response.status === 204 ? null : await boundedResponse(response, controller.signal);
          return { status: response.status, value };
        })(),
        new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new PlayerWebError("SERVICE_UNAVAILABLE")); }, 5000); }),
      ]);
    } catch (error) {
      report(controller.signal.aborted ? "timeout" : error instanceof PlayerWebError ? "invalid-response" : "network-error");
      return fail("SERVICE_UNAVAILABLE");
    }
    finally { clearTimeout(timer); controller.abort(); }
  }
  async function admit<T>(work: () => Promise<T>) {
    if (active >= 4) return fail("SIGNIN_BUSY");
    active++;
    try { return await work(); } finally { active--; }
  }
  async function login(c: LocalEpicConfig, proof: string, confirmNewPlayer: boolean) {
    const { status, value } = await request(c.apiUrl + "/v1/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ proof, confirmNewPlayer }) });
    if (status === 409 && record(value) && record(value.error) && value.error.code === "NEW_PLAYER_CONFIRMATION_REQUIRED") return null;
    if (status !== 200 || !record(value)) return fail(status === 401 ? "EPIC_VERIFICATION_FAILED" : "SERVICE_UNAVAILABLE");
    if (typeof value.sessionToken !== "string" || !hex.test(value.sessionToken) || !seconds(value.issuedAt) || !seconds(value.expiresAt) || value.issuedAt > now() / 1000 + 1 || value.expiresAt <= now() / 1000 || value.expiresAt <= value.issuedAt || value.expiresAt - value.issuedAt > 3600) return fail("SERVICE_UNAVAILABLE");
    const result = { token: value.sessionToken, expiresAt: Math.min(value.expiresAt, now() / 1000 + 900), player: player(value.player) };
    try {
      const snapshot = await readProfile(result.token);
      if (snapshot.player.id !== result.player.id) return fail("SERVICE_UNAVAILABLE");
      return result;
    } catch {
      try { await logout(result.token); } catch { /* The backend session still expires independently. */ }
      return fail("SERVICE_UNAVAILABLE");
    }
  }
  function start() {
    const c = config(); cleanup();
    starts = starts.filter(time => time > now() - 60000);
    if (starts.length >= 30 || states.size >= 64 || pending.size >= 64) return fail("SIGNIN_BUSY");
    starts.push(now());
    const state = randomBytes(32).toString("hex"), cookie = randomBytes(32).toString("hex");
    states.set(hash(state), { cookieHash: hash(cookie), expires: now() + 300000, context: context(c) });
    const url = new URL("https://www.epicgames.com/id/authorize");
    url.search = new URLSearchParams({ client_id: c.clientId, response_type: "code", scope: "basic_profile friends_list presence country", redirect_uri: callbackUrl, state }).toString();
    return { url: url.toString(), cookie };
  }
  async function callback(input: { state: string; cookie: string; code?: string; cancelled?: boolean }) {
    const c = config(); cleanup();
    if (!hex.test(input.state) || !hex.test(input.cookie)) return fail("SIGNIN_EXPIRED");
    const key = hash(input.state), saved = states.get(key);
    if (!saved || saved.context !== context(c) || !timingSafeEqual(Buffer.from(saved.cookieHash, "hex"), Buffer.from(hash(input.cookie), "hex"))) return fail("SIGNIN_EXPIRED");
    states.delete(key); // Consume BEFORE upstream requests, including provider errors.
    if (input.cancelled) return fail("EPIC_CANCELLED");
    if (!input.code || !/^[A-Za-z0-9._~-]{1,2048}$/.test(input.code)) return fail("SIGNIN_EXPIRED");
    return admit(async () => {
      const { status, value } = await request("https://api.epicgames.dev/epic/oauth/v2/token", { method: "POST", headers: {
        "content-type": "application/x-www-form-urlencoded", authorization: "Basic " + Buffer.from(c.clientId + ":" + c.clientSecret).toString("base64"),
      }, body: new URLSearchParams({ grant_type: "authorization_code", code: input.code!, deployment_id: c.deploymentId, redirect_uri: callbackUrl }).toString() });
      if (status !== 200 || !record(value) || value.client_id !== c.clientId || value.application_id !== c.applicationId || typeof value.account_id !== "string" || !/^[0-9a-f]{32}$/.test(value.account_id) || typeof value.token_type !== "string" || value.token_type.toLowerCase() !== "bearer" || typeof value.access_token !== "string" || value.access_token.length > 16384 || value.access_token.split(".").length !== 3) return fail("EPIC_VERIFICATION_FAILED");
      // The backend checks the JWT signature, issuer, client and ALL signed game-context claims.
      // Token response account_id/display text are never used as authentication evidence.
      const result = await login(c, value.access_token, false);
      if (result) return { session: result };
      cleanup(); if (pending.size >= 64) return fail("SIGNIN_BUSY");
      const cookie = randomBytes(32).toString("hex");
      pending.set(hash(cookie), { proof: value.access_token, expires: now() + 60000, context: context(c) });
      return { pendingCookie: cookie };
    });
  }
  function hasPending(cookie: string | undefined) {
    cleanup(); return !!cookie && hex.test(cookie) && pending.has(hash(cookie));
  }
  async function confirm(cookie: string) {
    const c = config(); cleanup();
    if (!hex.test(cookie)) return fail("SIGNIN_EXPIRED");
    const key = hash(cookie), saved = pending.get(key);
    if (!saved || saved.context !== context(c)) return fail("SIGNIN_EXPIRED");
    pending.delete(key);
    const result = await admit(() => login(c, saved.proof, true));
    if (!result) return fail("SERVICE_UNAVAILABLE");
    return result;
  }
  async function readProfile(token: string): Promise<PlayerSnapshot> {
    if (!hex.test(token)) return fail("INVALID_SESSION");
    const { status, value } = await request(config().apiUrl + "/v1/player/me", { headers: { authorization: "Bearer " + token } });
    if (status !== 200) return fail(status === 401 || status === 403 ? "INVALID_SESSION" : "SERVICE_UNAVAILABLE");
    if (!record(value) || !record(value.balance) || !natural(value.balance.evoros)) return fail("SERVICE_UNAVAILABLE");
    return { player: player(value.player), balance: { evoros: value.balance.evoros } };
  }
  async function readInventory(token: string): Promise<Inventory> {
    if (!hex.test(token)) return fail("INVALID_SESSION");
    const { status, value } = await request(config().apiUrl + "/v1/player/inventory", { headers: { authorization: "Bearer " + token } });
    if (status !== 200) return fail(status === 401 || status === 403 ? "INVALID_SESSION" : "SERVICE_UNAVAILABLE");
    if (!record(value) || !Array.isArray(value.items) || !Array.isArray(value.evos) || value.items.length > 2000 || value.evos.length > 2000) return fail("SERVICE_UNAVAILABLE");
    const items = value.items.map(item => {
      if (!record(item) || (typeof item.productId !== "string" || !/^[a-z][a-z0-9_]{0,79}$/.test(item.productId)) || !natural(item.revision) || item.revision < 1 || !natural(item.quantity)) return fail("SERVICE_UNAVAILABLE");
      return { productId: item.productId, revision: item.revision, quantity: item.quantity };
    });
    const evos = value.evos.map(evo => {
      if (!record(evo) || !uuid(evo.id) || typeof evo.speciesKey !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(evo.speciesKey) || !natural(evo.experience) || !record(evo.stats) || Object.keys(evo.stats).length > 32 || Object.values(evo.stats).some(n => !natural(n))) return fail("SERVICE_UNAVAILABLE");
      return { id: evo.id, speciesKey: evo.speciesKey, experience: evo.experience, stats: evo.stats as Record<string, number> };
    });
    return { items, evos };
  }
  async function logout(token: string) {
    if (!hex.test(token)) return fail("INVALID_SESSION");
    const { status } = await request(config().apiUrl + "/v1/auth/logout", { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" }, body: "{}" });
    if (status !== 204) return fail(status === 401 ? "INVALID_SESSION" : "SERVICE_UNAVAILABLE");
  }
  return { start, callback, confirm, hasPending, readProfile, readInventory, logout };
}
