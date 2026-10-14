import { buildIdPattern, privateHeaders } from "./core";
import type { Bucket } from "./server";

declare const FixedLengthStream: {
  new (length: number): { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> };
};

type DownloadEnvironment = { GAME_BUILDS?: Pick<Bucket, "get"> };
type WorkerContext = { waitUntil(promise: Promise<unknown>): void };
type NextWorker = { fetch(request: Request, env: DownloadEnvironment, ctx: WorkerContext): Promise<Response> };
const metadataHeaders = ["X-EvoVerses-Download-Build", "X-EvoVerses-Download-Length", "X-EvoVerses-Download-Object-Size"];
const unavailable = () => Response.json({ error: "FILE_UNAVAILABLE" }, { status: 503, headers: privateHeaders() });

export function createDownloadWorker(next: NextWorker): NextWorker {
  return {
    async fetch(request, env, ctx) {
      if (new URL(request.url).pathname !== "/api/downloads/file" || !["GET", "HEAD"].includes(request.method)) {
        return next.fetch(request, env, ctx);
      }
      try {
        // The existing route remains authoritative for sessions, beta approval, publication,
        // pinned build IDs and If-Range handling. This HEAD request never reads ZIP bytes.
        const authorised = await next.fetch(new Request(request, { method: "HEAD" }), env, ctx);
        if (![200, 206].includes(authorised.status)) return authorised;
        await authorised.arrayBuffer();
        const id = authorised.headers.get(metadataHeaders[0]!);
        const length = Number(authorised.headers.get(metadataHeaders[1]!));
        const objectSize = Number(authorised.headers.get(metadataHeaders[2]!));
        const etag = authorised.headers.get("ETag");
        if (!id || !buildIdPattern.test(id) || !Number.isSafeInteger(length) || length < 1 ||
            !Number.isSafeInteger(objectSize) || objectSize < length || !etag || !env.GAME_BUILDS) return unavailable();

        let range: { offset: number; length: number } | undefined;
        if (authorised.status === 206) {
          const match = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(authorised.headers.get("Content-Range") ?? "");
          if (!match || Number(match[3]) !== objectSize || Number(match[2]) - Number(match[1]) + 1 !== length ||
              !Number.isSafeInteger(Number(match[1])) || Number(match[1]) < 0 || Number(match[2]) >= objectSize) return unavailable();
          range = { offset: Number(match[1]), length };
        } else if (length !== objectSize) return unavailable();

        const headers = new Headers(authorised.headers);
        for (const name of metadataHeaders) headers.delete(name);
        headers.set("Content-Length", String(length));
        // A native fixed-length stream keeps Content-Length enforceable in Cloudflare and
        // applies backpressure. A short source becomes a failed transfer, never a complete ZIP.
        if (request.method === "HEAD") return new Response(null, { status: authorised.status, headers });
        const stream = new FixedLengthStream(length);

        const object = await env.GAME_BUILDS.get(`files/${id}.zip`, range ? { range } : undefined);
        if (!object) return unavailable();
        if (object.httpEtag !== etag || object.size !== objectSize) {
          await object.body.cancel();
          return unavailable();
        }
        ctx.waitUntil(object.body.pipeTo(stream.writable).catch(() => {
          // The rejected stream propagates to the client. Never log cookies or service credentials.
          console.error("Game download stream failed", { buildId: id, expectedBytes: length });
        }));
        return new Response(stream.readable, { status: authorised.status, headers });
      } catch {
        return unavailable();
      }
    },
  };
}
