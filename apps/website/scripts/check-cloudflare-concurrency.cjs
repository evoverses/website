"use strict";
const path = require("node:path");
const assert = require("node:assert/strict");
const { unstable_dev } = require("wrangler");

async function main() {
  const worker = await unstable_dev("cloudflare-worker.ts", {
    config: path.resolve(process.argv[2] || "wrangler.production.jsonc"),
    envFiles: [], local: true, ip: "127.0.0.1", port: 0, inspectorPort: 0,
    persist: false, logLevel: "error",
    experimental: { disableExperimentalWarning: true, forceLocal: true, watch: false, liveReload: false },
  });
  try {
    const routes = ["/", "/signin", "/store", "/leaderboard/overall"];
    for (let batch = 0; batch < 2; batch++) {
      await Promise.all(Array.from({ length: 12 }, async (_, index) => {
        const route = routes[index % routes.length];
        const response = await worker.fetch(route, {
          headers: index % 2 ? { cookie: "ev:jwt=invalid.jwt.signature" } : {},
        });
        const body = await response.text();
        assert.equal(response.status, 200, `${route}: concurrent status`);
        assert.ok(body.includes("EvoVerses"), `${route}: content`);
        assert.ok(body.endsWith("</html>"), `${route}: complete response`);
      }));
    }
    console.log("24 concurrent Worker renders passed with complete responses");
  } finally { await worker.stop(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
