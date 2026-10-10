import { combatDetails, type CombatState } from "./combat";
import { playerSessionCookie } from "../auth-core";
import type { Inventory } from "../auth-core";
import { ordinaryInventory } from "./model";
import { loadLinkedNfts, walletProjection, type NftSources } from "./nfts";
import { WalletWebError } from "../wallet/handler";
export async function inventoryHandler(
  request: Request,
  dependencies: {
    enabled: boolean;
    webOrigin?: "http://localhost:3100" | "https://beta.evoverses.com";
    readInventory: (token: string) => Promise<Inventory>;
    readCombat?: (token:string,members:{chainId:43114;collection:string;tokenId:string}[])=>Promise<CombatState[]>;
    projection: (token: string) => Promise<unknown>;
    sources: NftSources;
    image: (row: import("./types").InventoryRow) => string | null;
  },
) {
  const reply = (status: number, body: unknown) =>
    Response.json(body, {
      status,
      headers: {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff",
      },
    });
  try {
    const url = new URL(request.url);
    const origin = dependencies.webOrigin ?? "http://localhost:3100";
    const matchingUrl = origin === "http://localhost:3100" ? url.protocol === "http:" && url.port === "3100" : url.origin === origin;
    if (
      !dependencies.enabled ||
      !matchingUrl ||
      url.pathname !== "/api/player/inventory" ||
      url.search ||
      request.headers.get("host") !== new URL(origin).host ||
      request.headers.get("origin") !== origin
    )
      return reply(403, { error: { code: "ORIGIN_NOT_ALLOWED" } });
    if (request.method !== "POST")
      return reply(405, { error: { code: "METHOD_NOT_ALLOWED" } });
    const cookies = (request.headers.get("cookie") || "")
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.startsWith(playerSessionCookie + "="));
    const token =
      cookies.length === 1
        ? cookies[0]!.slice(playerSessionCookie.length + 1)
        : "";
    if (!/^[a-f0-9]{64}$/.test(token))
      return reply(401, { error: { code: "INVALID_SESSION" } });
    if (
      request.headers.get("content-type") !== "application/json" ||
      request.headers.has("content-encoding")
    )
      return reply(400, { error: { code: "INVALID_REQUEST" } });
    const reader = request.body?.getReader();
    if (!reader) return reply(400, { error: { code: "INVALID_REQUEST" } });
    let size = 0,
      timedOut = false;
    const parts: Uint8Array[] = [];
    const timer = setTimeout(() => {
      timedOut = true;
      void reader.cancel();
    }, 2000);
    try {
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        size += result.value.byteLength;
        if (size > 1024) {
          await reader.cancel();
          return reply(413, { error: { code: "INVALID_REQUEST" } });
        }
        parts.push(result.value);
      }
    } finally {
      clearTimeout(timer);
      reader.releaseLock();
    }
    if (timedOut) return reply(408, { error: { code: "INVALID_REQUEST" } });
    let body;
    try {
      body = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(parts)),
      );
    } catch {
      return reply(400, { error: { code: "INVALID_REQUEST" } });
    }
    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      Object.keys(body).length !== 3 ||
      Object.keys(body).some(
        (k) => !["includeNfts", "page", "linksVersion"].includes(k),
      ) ||
      typeof body.includeNfts !== "boolean" ||
      !Number.isSafeInteger(body.page) ||
      body.page < 0 ||
      body.page > 100_000 ||
      !(
        body.linksVersion === null ||
        (typeof body.linksVersion === "string" &&
          /^[a-f0-9]{64}$/.test(body.linksVersion))
      ) ||
      (!body.includeNfts && (body.page !== 0 || body.linksVersion !== null)) ||
      (body.page > 0 && body.linksVersion === null)
    )
      return reply(400, { error: { code: "INVALID_REQUEST" } });
    const inventory = await dependencies.readInventory(token);
    const rows = ordinaryInventory(inventory).map((row) => ({
      ...row,
      image: row.image || dependencies.image(row),
    }));
    if (!body.includeNfts) return reply(200, { rows, nfts: null });
    const initial = walletProjection(await dependencies.projection(token));
    if (body.linksVersion !== null && body.linksVersion !== initial.version)
      return reply(409, { error: { code: "INVENTORY_CHANGED" } });
    const nfts = await loadLinkedNfts(initial, body.page, dependencies.sources);
    if(dependencies.readCombat){
      const evos=nfts.rows.filter(row=>row.form==="evo"&&row.tokenId&&row.details);
      const states:CombatState[]=[];
      try { for(let start=0;start<evos.length;start+=6){
        states.push(...await dependencies.readCombat(token,evos.slice(start,start+6).map(row=>({chainId:43114 as const,collection:"0x4151b8afa10653d304fdac9a781afccd45ec164c",tokenId:row.tokenId!}))));
      }
      const verified=evos.map(row=>{const state=states.find(s=>s.resourceKey===`chain:43114:0x4151b8afa10653d304fdac9a781afccd45ec164c:${row.tokenId}`);if(!state)throw Error("Combat state unavailable");return combatDetails(row.details!,state);});
      evos.forEach((row,index)=>{row.details=verified[index];});
      }catch(error){if(error&&typeof error==="object"&&"code" in error&&error.code==="INVALID_SESSION")throw error;nfts.warnings.push("COMBAT_STATE_UNAVAILABLE");}
    }
    // Logout/unlink/new-link during upstream reads must not release a stale projection.
    const final = walletProjection(await dependencies.projection(token));
    if (final.version !== initial.version)
      return reply(409, { error: { code: "INVENTORY_CHANGED" } });
    nfts.rows = nfts.rows.map((row) => ({
      ...row,
      image: dependencies.image(row),
    }));
    return reply(200, { rows, nfts });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "INVALID_SESSION"
    )
      return reply(401, { error: { code: "INVALID_SESSION" } });
    if (error instanceof WalletWebError && error.code === "ACCOUNT_UNAVAILABLE")
      return reply(403, { error: { code: "ACCOUNT_UNAVAILABLE" } });
    return reply(503, { error: { code: "INVENTORY_UNAVAILABLE" } });
  }
}
