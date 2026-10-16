import { fetchHostedEvoQuote } from "./hosted-evo-quote";
type QuoteEnvironment = { EVOVERSES_HOSTED_BETA?: string; EVOVERSES_ACCOUNT_API_ORIGIN?: string; EVOVERSES_ACCOUNT_SERVICE_TOKEN?: string };
type Context = { waitUntil(promise: Promise<unknown>): void };
type Worker<E> = { fetch(request: Request, env: E, ctx: Context): Promise<Response> };
/** Keep the public read-only quote outside the application/authentication adapter. */
export function createEvoQuoteWorker<E>(next: Worker<E>, fetcher: typeof fetch = fetch): Worker<E & QuoteEnvironment> {
  return { async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/store/evo-quote" || env.EVOVERSES_HOSTED_BETA !== "1") return next.fetch(request, env, ctx);
    const headers = { "Cache-Control": "no-store" };
    if (request.method !== "GET") return new Response("Method not allowed.", { status: 405, headers: { ...headers, Allow: "GET" } });
    try {
      if (env.EVOVERSES_ACCOUNT_API_ORIGIN !== "https://beta-accounts.evoverses.com" || !/^[a-f0-9]{64}$/.test(env.EVOVERSES_ACCOUNT_SERVICE_TOKEN ?? "")) throw Error("Quote service configuration missing.");
      const quote = await fetchHostedEvoQuote({ apiUrl: env.EVOVERSES_ACCOUNT_API_ORIGIN, token: env.EVOVERSES_ACCOUNT_SERVICE_TOKEN! }, fetcher);
      return Response.json(quote, { headers });
    } catch (error) {
      // Fixed messages/statuses only. Never log request headers, bindings or payloads.
      const message = error instanceof Error ? error.message : "Quote failure.";
      const known = /^(?:EVO quote unavailable(?: HTTP \d{3})?\.|Invalid EVO (?:quote|oracle)\.|Quote service configuration missing\.)$/;
      console.warn("EVO_QUOTE_UNAVAILABLE", known.test(message) ? message : "Quote request failed.");
      return Response.json({ error: "EVO price is unavailable. Please refresh the quote." }, { status: 503, headers });
    }
  } };
}
