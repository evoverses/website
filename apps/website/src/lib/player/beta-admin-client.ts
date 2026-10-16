/** Retry an uncertain admin write once with its original idempotency key. */
export async function sendBetaAdminRequest(
  operation: "list" | "action",
  input: unknown,
  fetchImpl: typeof fetch = fetch,
  wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
) {
  const body = JSON.stringify({ operation, input });
  const requestId = input && typeof input === "object" && "requestId" in input ? input.requestId : null;
  const retryable = operation === "action" && typeof requestId === "string" && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(requestId);
  for (let attempt = 0; ; attempt++) {
    let response: Response;
    let value;
    try {
      response = await fetchImpl("/api/player/beta-admin", {
        method: "POST", headers: { "content-type": "application/json" },
        credentials: "same-origin", body, cache: "no-store", signal: AbortSignal.timeout(12000),
      });
      value = await response.json();
    } catch {
      if (retryable && attempt === 0) { await wait(500); continue; }
      throw Error("NETWORK_UNCERTAIN");
    }
    if (response.ok) return value;
    if (retryable && attempt === 0 && [429, 503].includes(response.status)) {
      await wait(1000); continue;
    }
    throw Error(value.error?.code ?? "BETA_ADMIN_UNAVAILABLE");
  }
}
