import "server-only";
import { readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { cookies } from "next/headers";
import { createPlayerWebAuth, PlayerWebError, playerSessionCookie, type LocalEpicConfig } from "./auth-core";

export const localPlayerLogin = process.env.NODE_ENV === "development" && process.env.EVOVERSES_LOCAL_EPIC_ACCOUNT_LOGIN === "1" && process.env.NEXT_PUBLIC_EVOVERSES_LOCAL_PLAYER_LOGIN === "1";
function read(file: string) {
  if (statSync(file).size > 1024 * 1024) throw new PlayerWebError("SIGNIN_UNAVAILABLE");
  return readFileSync(file, "utf8");
}
export function getLocalEpicConfig(): LocalEpicConfig | null {
  if (!localPlayerLogin) return null;
  try {
    const root = process.env.EVOVERSES_LOCAL_EPIC_RUN_ROOT;
    if (!root || !path.isAbsolute(root) || !/^EpicAccountLocal-[a-f0-9]{32}$/.test(path.basename(root)) || existsSync(path.join(root, "stopped.json"))) return null;
    const expected = JSON.parse(read(path.join(root, "expected-context.json")));
    const reviewed = JSON.parse(read(path.join(root, "reviewed-context.json")));
    const verified = JSON.parse(read(path.join(root, "verified-context.json")));
    if (JSON.stringify(reviewed) !== JSON.stringify(verified) || Object.keys(reviewed).length !== 6 || ["audience", "productId", "sandboxId", "deploymentId"].some(k => !expected[k] || reviewed[k] !== expected[k])) return null;
    const clientId = process.env.AUTH_EPIC_ID;
    const clientSecret = process.env.AUTH_EPIC_SECRET;
    if (!clientId || !/^[A-Za-z0-9]{16,128}$/.test(clientId) || clientId === expected.audience || !clientSecret || clientSecret.trim() !== clientSecret || clientSecret.length > 2048 || clientSecret === "REPLACE_ME") return null;
    const ready = JSON.parse(read(path.join(root, "ready.json")));
    if (ready.websiteClientId !== clientId || ready.mode !== "Account" || !/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(ready.apiUrl)) return null;
    return { clientId, clientSecret, deploymentId: expected.deploymentId, applicationId: reviewed.applicationId, apiUrl: ready.apiUrl };
  } catch { return null; } // Never expose credentials/provider responses in error output.
}
const key = Symbol.for("evoverses.local.epic.web.flow");
const shared = globalThis as unknown as Record<symbol, ReturnType<typeof createPlayerWebAuth> | undefined>;
export function playerWebAuth() {
  return shared[key] ??= createPlayerWebAuth({ configuration: getLocalEpicConfig });
}
export const getPlayerAccount = cache(async () => {
  if (!localPlayerLogin) return null;
  const token = (await cookies()).get(playerSessionCookie)?.value;
  if (!token) return null;
  try { return await playerWebAuth().readProfile(token); } catch { return null; }
});
export async function getPlayerInventory() {
  const token = (await cookies()).get(playerSessionCookie)?.value;
  if (!token) throw new PlayerWebError("INVALID_SESSION");
  return playerWebAuth().readInventory(token);
}

export function getLocalStoreConnection() {
  if (!localPlayerLogin || process.env.EVOVERSES_LOCAL_STORE_PAYMENTS !== "1" || process.env.EVOROS_STRIPE_MODE !== "test") return null;
  const config = getLocalEpicConfig();
  const root = process.env.EVOVERSES_LOCAL_EPIC_RUN_ROOT;
  const token = process.env.EVOVERSES_LOCAL_STORE_SERVICE_TOKEN;
  if (!config || !root || !token || !/^[a-f0-9]{64}$/.test(token)) return null;
  try {
    const ready = JSON.parse(read(path.join(root, "ready.json")));
    if (ready.storeAccount !== process.env.EVOROS_STRIPE_ACCOUNT || !/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(ready.storeApiUrl || "")) return null;
    return { apiUrl: ready.storeApiUrl as string, token };
  } catch { return null; }
}
