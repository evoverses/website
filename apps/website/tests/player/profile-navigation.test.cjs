const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function middleware(hostedBeta) {
  const module = { exports: {} };
  const calls = [];
  const code = ts.transpileModule(fs.readFileSync("src/middleware.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, URL,
    process: { env: { NODE_ENV: "production", EVOVERSES_HOSTED_BETA: hostedBeta ? "1" : "0" } },
    require: name => name === "@/lib/thirdweb/auth.edge" ? {
      verifyAuthCookie: async () => { calls.push("wallet"); return { valid: false }; },
    } : { NextResponse: {
      next: () => ({ kind: "next", headers: new Headers(), cookies: { delete() {} } }),
      redirect: url => ({ kind: "redirect", url: url.toString() }),
    } }, Headers,
  });
  return async pathname => {
    calls.length = 0;
    const result = await module.exports.middleware({
      nextUrl: new URL("https://beta.evoverses.com" + pathname), cookies: { get() {} },
    });
    return { result, calls: [...calls] };
  };
}

test("Epic profile liquidity reaches the authenticated profile layout without legacy wallet login", async () => {
  const check = middleware(true);
  for (const path of ["/profile", "/profile/liquidity", "/signin"]) {
    const { result, calls } = await check(path);
    assert.equal(result.kind, "next");
    assert.deepEqual(calls, []);
  }
});

test("other wallet-only profile routes and non-beta liquidity retain their authentication", async () => {
  for (const [enabled, path] of [[true, "/profile/assets"], [true, "/profile/liquidity/private"], [false, "/profile/liquidity"]]) {
    const { result, calls } = await middleware(enabled)(path);
    assert.equal(result.kind, "redirect");
    assert.equal(new URL(result.url).pathname, "/signin");
    assert.deepEqual(calls, ["wallet"]);
  }
});
