import "server-only";
import { getEpicConfig } from "./server";

export async function betaAdminRpc(operation: "list" | "action", token: string, input: unknown) {
  const config = getEpicConfig();
  if (!config) throw Error("Unavailable");
  const response = await fetch(`${config.apiUrl}/v1/beta/admin/${operation}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(config.hosted ? { "X-EvoVerses-Service": config.hosted.serviceToken } : {}) },
    body: JSON.stringify(input), cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(8000),
  });
  if (response.status >= 300 && response.status < 400) throw Error("Redirect refused");
  const reader = response.body?.getReader();
  if (!reader) throw Error("Unavailable");
  const chunks: Uint8Array[] = []; let length = 0;
  try { while (true) { const chunk = await reader.read(); if (chunk.done) break; length += chunk.value.byteLength; if (length > 1048576) { await reader.cancel(); throw Error("Unavailable"); } chunks.push(chunk.value); } }
  finally { reader.releaseLock(); }
  return { status: response.status, value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))) as unknown };
}
