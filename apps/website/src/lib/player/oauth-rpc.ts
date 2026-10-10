import { PlayerWebError, type OAuthTransactionStore } from "./auth-core";
// Server-only credentials are supplied by composition; this module never reads
// environment files and is also exercised with synthetic credentials in tests.
export function createOAuthRpc({ connection, fetchImpl = fetch }: {
  connection: () => { apiUrl: string; serviceToken: string } | null;
  fetchImpl?: typeof fetch;
}): OAuthTransactionStore {
  async function call(operation: string, input: unknown): Promise<unknown> {
    const c = connection();
    if (!c || !/^[a-f0-9]{64}$/.test(c.serviceToken)) throw new PlayerWebError("SIGNIN_UNAVAILABLE");
    const url = new URL(c.apiUrl);
    if (url.protocol !== "https:" || url.origin !== c.apiUrl || url.username || url.password || url.port || !/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(url.hostname) || url.hostname.endsWith(".localhost") || /^[\d.]+$/.test(url.hostname)) throw new PlayerWebError("SIGNIN_UNAVAILABLE");
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetchImpl(c.apiUrl + "/internal/web-oauth/" + operation, {
        method: "POST", headers: { "content-type": "application/json", "X-EvoVerses-Service": c.serviceToken },
        body: JSON.stringify(input), cache: "no-store", redirect: "manual", credentials: "omit", signal: controller.signal,
      });
      if (response.status >= 300 && response.status < 400) throw Error("Redirect refused");
      if (!response.headers.get("content-type")?.startsWith("application/json") || !response.body) throw Error("Invalid response");
      const reader = response.body.getReader(); let size = 0; const chunks: Uint8Array[] = [];
      try { while (true) {
        const part = await reader.read(); if (controller.signal.aborted) throw Error("Timeout"); if (part.done) break;
        size += part.value.byteLength; if (size > 24000) throw Error("Response too large"); chunks.push(part.value);
      } } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
      if (response.status !== 200) {
        if ([409,429].includes(response.status) && ["SIGNIN_EXPIRED","SIGNIN_BUSY"].includes(value?.error?.code)) throw new PlayerWebError(value.error.code);
        throw Error("Unavailable");
      }
      if (Object.keys(value).length !== 1 || !Object.hasOwn(value,"value")) throw Error("Invalid response");
      return value.value;
    } catch (error) {
      if (error instanceof PlayerWebError) throw error;
      throw new PlayerWebError("SERVICE_UNAVAILABLE");
    } finally { clearTimeout(timer); controller.abort(); }
  }
  return {
    putState: async input => { if (await call("put-state", input) !== true) throw new PlayerWebError("SERVICE_UNAVAILABLE"); },
    takeState: async input => { if (await call("take-state", input) !== true) throw new PlayerWebError("SERVICE_UNAVAILABLE"); },
    putPending: async input => { if (await call("put-pending", input) !== true) throw new PlayerWebError("SERVICE_UNAVAILABLE"); },
    takePending: async input => { const value = await call("take-pending", input); if (typeof value !== "string" || !/^[A-Za-z0-9._~-]{1,16384}$/.test(value)) throw new PlayerWebError("SERVICE_UNAVAILABLE"); return value; },
    hasPending: async input => { const value = await call("has-pending", input); if (typeof value !== "boolean") throw new PlayerWebError("SERVICE_UNAVAILABLE"); return value; },
  };
}
