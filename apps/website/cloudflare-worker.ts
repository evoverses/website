// @ts-ignore OpenNext generates this module after the Next.js build.
import nextWorker from "./.open-next/worker.js";
import { createBetaOwnerWorker } from "./src/lib/beta-owner-worker";
import { createDownloadWorker } from "./src/lib/downloads/worker";
import { createEvoQuoteWorker } from "./src/lib/store/evo-quote-worker";
import { createLauncherWorker } from "./src/lib/downloads/launcher-worker";

// Large downloads bypass the Next.js response adapter after its existing HEAD access check.
export default createBetaOwnerWorker(createEvoQuoteWorker(createLauncherWorker(createDownloadWorker(nextWorker))));

// Keep the exports provided by the generated Worker for the adapter's caching features.
// @ts-ignore OpenNext generates this module after the Next.js build.
export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from "./.open-next/worker.js";
