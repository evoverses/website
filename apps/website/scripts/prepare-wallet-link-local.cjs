"use strict";
// Approved local encryption exception only. Never print or replace an existing key.
const fs = require("node:fs"),
  path = require("node:path"),
  { randomBytes } = require("node:crypto"),
  { spawnSync } = require("node:child_process");
try {
  if (process.env.NODE_ENV === "production") throw Error("Local only");
  const file = path.join(__dirname, "../.env.local"),
    root = path.resolve(__dirname, "../../..");
  const git =
    process.platform === "win32"
      ? "C:\\Program Files\\Git\\cmd\\git.exe"
      : "git";
  const ignored = spawnSync(
    git,
    ["check-ignore", "--quiet", "apps/website/.env.local"],
    { cwd: root, stdio: "ignore" },
  );
  if (ignored.status !== 0) throw Error("Local config must be ignored");
  const text = fs.readFileSync(file, "utf8");
  process.loadEnvFile(file);
  if (process.env.EVOVERSES_LOCAL_EPIC_ACCOUNT_LOGIN !== "1")
    throw Error("Reviewed local login required");
  const keys = ["EVOVERSES_LOCAL_WALLET_KEY"];
  let additions = "";
  for (const name of keys) {
    const value = process.env[name];
    if (value && !/^[a-f0-9]{64}$/.test(value))
      throw Error("Invalid existing local wallet config");
    if (!value) additions += `${name}=${randomBytes(32).toString("hex")}\n`;
  }
  const flag = "EVOVERSES_LOCAL_WALLET_LINKING";
  let next = text;
  if (new RegExp(`^${flag}=`, "m").test(next))
    next = next.replace(new RegExp(`^${flag}=.*$`, "m"), flag + "=1");
  else additions += flag + "=1\n";
  if (additions) next = next.replace(/\s*$/, "") + "\n" + additions;
  if (next !== text) fs.writeFileSync(file, next, { mode: 0o600 });
  console.log(
    "Local wallet-link encryption and private bridge configured. Existing keys preserved; no keys printed. Restart only the owned account service and website preview.",
  );
} catch {
  console.error(
    "Local wallet configuration could not be prepared. Private details omitted.",
  );
  process.exitCode = 1;
}
