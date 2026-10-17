"use strict";
// Run only against an isolated source export: no remote bindings or credentials.
const path = require("node:path");
const { unstable_dev } = require("wrangler");
async function main() {
  const config = path.resolve(process.argv[2] || "wrangler.jsonc");
  const worker = await unstable_dev("cloudflare-worker.ts", {
    config, envFiles: [], local: true, ip: "127.0.0.1", port: 0,
    inspectorPort: 0, persist: false, logLevel: "error",
    experimental: { disableExperimentalWarning: true, forceLocal: true, watch: false, liveReload: false },
  });
  try {
    for (const pathname of ["/", "/signin", "/store", "/leaderboard/pvbot", "/leaderboard/overall"]) {
      const response = await worker.fetch(pathname);
      const body = await response.text();
      if (response.status !== 200 || !body.includes("EvoVerses")) throw Error(`Workers runtime failed for ${pathname}: HTTP ${response.status}`);
      console.log(`Workers runtime ${pathname}: HTTP 200`);
    }
    for (const board of ["pvbot", "overall"]) {
      for (const suffix of ["", "/me"]) {
        const response = await worker.fetch(`/api/leaderboard/${board}${suffix}`);
        const body = await response.json();
        // The isolated Worker origin is deliberately not the production site.
        if (response.status !== 403 || response.headers.get("cache-control") !== "no-store" || body.error?.code !== "ORIGIN_NOT_ALLOWED") throw Error(`Leaderboard origin/privacy gate failed for ${board}${suffix}`);
        console.log(`Workers runtime ${board}${suffix}: HTTP 403, no-store`);
      }
    }
    const feed = await worker.fetch("/api/launcher/latest.json");
    const state = await feed.json();
    if (!([404, 503].includes(feed.status) && ["NO_UPDATE_PUBLISHED", "STORAGE_UNAVAILABLE"].includes(state.error))) throw Error("Unexpected isolated launcher storage response");
    console.log(`Workers runtime launcher feed: HTTP ${feed.status}, ${state.error}`);
  } finally { await worker.stop(); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
