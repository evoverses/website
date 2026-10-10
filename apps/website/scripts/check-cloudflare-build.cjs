"use strict";
// Export source without local environment/data, then build only in a temporary copy.
// No login, upload, resource creation or deployment commands are issued.
const fs = require("node:fs"), path = require("node:path"), os = require("node:os");
const { spawnSync } = require("node:child_process");
const repo = path.resolve(__dirname, "../../..");
const manager = process.env.npm_execpath;
if (!manager || !/^pnpm\.(c?js)$/.test(path.basename(manager))) {
  throw Error("Run with pnpm --filter website check:cloudflare (Node 22 or newer).");
}
const root = fs.mkdtempSync(path.join(os.tmpdir(), "evoverses-cloudflare-"));
const source = path.join(root, "source"), app = path.join(source, "apps/website");
const files = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {cwd:repo, encoding:"utf8"});
if (files.status !== 0) throw Error("Could not export repository source.");
for (const name of new Set(files.stdout.split("\0").filter(Boolean))) {
  const parts = name.split("/");
  if (parts.some(p => p.startsWith(".env") || p.startsWith(".dev.vars") || [".git",".vercel","node_modules","Saved",".next",".next-beta-check",".open-next",".wrangler"].includes(p))) continue;
  const original = path.resolve(repo, name), target = path.resolve(source, name);
  if (!original.startsWith(repo + path.sep) || !target.startsWith(source + path.sep)) throw Error("Invalid export path.");
  if (!fs.existsSync(original) || !fs.lstatSync(original).isFile()) continue;
  fs.mkdirSync(path.dirname(target), {recursive:true}); fs.copyFileSync(original, target);
}
// Deliberate allowlist: provider credentials and local account switches never travel.
const environment = {};
for (const name of ["PATH","Path","SystemRoot","WINDIR","TEMP","TMP","COMSPEC"]) if (process.env[name]) environment[name]=process.env[name];
Object.assign(environment, {
  CI:"1", NEXT_TELEMETRY_DISABLED:"1", WRANGLER_SEND_METRICS:"false",
  EVOVERSES_CLOUDFLARE_BUILD_CHECK:"1",
  // Synthetic hosted configuration checks the production account branch.
  // These values cannot authenticate against Epic or an account service.
  EVOVERSES_HOSTED_BETA:"1", AUTH_EPIC_ID:"syntheticclient00000001", AUTH_EPIC_SECRET:"synthetic-secret",
  EVOVERSES_EPIC_DEPLOYMENT_ID:"synthetic-deployment", EVOVERSES_EPIC_APPLICATION_ID:"synthetic-application",
  EVOVERSES_ACCOUNT_API_ORIGIN:"https://accounts.example.invalid", EVOVERSES_ACCOUNT_SERVICE_TOKEN:"d".repeat(64),
  NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN:"beta.evoverses.com",
  NEXT_PUBLIC_THIRDWEB_CLIENT_ID:"0123456789abcdef0123456789abcdef",
  NEXT_PUBLIC_EVOVERSES_GRAPHQL_URL:"https://example.invalid/graphql",
  NEXT_PUBLIC_BASE_API_IMAGE_URL:"https://example.invalid/images",
  NEXT_PUBLIC_API_IMAGE_SUFFIX:".png", NEXT_PUBLIC_AUTH_URL:"https://beta.evoverses.com"
});
function run(args,cwd) {
  const result=spawnSync(process.execPath,[manager,...args],{cwd,env:environment,stdio:"inherit"});
  if(result.error) throw Error("Could not launch isolated pnpm check.");
  if(result.status!==0) throw Error("Compatibility command failed; temporary evidence retained at " + root);
}
console.log("Credential-free compatibility source: " + source);
run(["install","--frozen-lockfile"], source);
// Build explicitly so OpenNext does not invoke a separate global pnpm binary.
run(["exec","next","build"], app);
run(["exec","opennextjs-cloudflare","build","--skipNextBuild"], app);
run(["exec","wrangler","deploy","--dry-run","--outdir",path.join(root,"bundle")], app);
console.log("Local bundle check complete. Nothing deployed. Evidence: " + root);
