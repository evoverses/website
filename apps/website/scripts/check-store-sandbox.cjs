// Signed-out local sandbox browser check; creates no payments or player sessions.
const { createRequire } = require("node:module");
const { chromium } = createRequire(
  process.env.EVOVERSES_TEST_RUNTIME_PACKAGE ||
    require("node:path").join(
      require("node:os").homedir(),
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json",
    ),
)("playwright");
(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(120000);
    await page.goto("http://localhost:3100/store", {
      waitUntil: "networkidle",
      timeout: 180000,
    });
    const purchase = page.getByTestId("purchase-button");
    if (!(await purchase.isDisabled()))
      throw Error("Anonymous purchase must be disabled");
    const text = await page.locator("main").last().innerText();
    if (!text.includes("Payments are simulated"))
      throw Error("Sandbox readiness not shown");
    if (
      text.includes("EVO discount") ||
      (await page.getByRole("button", { name: "EVO", exact: true }).count())
    )
      throw Error("Hidden crypto UI exposed");
    const responses = await Promise.all([
      context.request.post("http://localhost:3100/api/store/stripe/checkout", {
        headers: { Origin: "http://localhost:3100" },
        data: {
          bundleId: "bundle_pouch",
          requestId: "12345678-1234-4234-8234-123456789abc",
        },
      }),
      context.request.post("http://localhost:3100/api/store/stripe/checkout", {
        headers: { Origin: "https://attacker.example" },
        data: {
          bundleId: "bundle_pouch",
          requestId: "12345678-1234-4234-8234-123456789abc",
        },
      }),
      context.request.post("http://localhost:3100/api/store/stripe/webhook", {
        data: { type: "checkout.session.completed" },
      }),
      context.request.get(
        "http://localhost:3100/api/store/stripe/order?orderId=12345678-1234-4234-8234-123456789abc",
      ),
    ]);
    const status = responses.map((x) => x.status());
    if (JSON.stringify(status) !== "[401,403,400,401]")
      throw Error("Unexpected API security statuses: " + status.join(","));
    await page.setViewportSize({ width: 390, height: 844 });
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    )
      throw Error("Mobile overflow");
    console.log(
      JSON.stringify({
        anonymousCardDisabled: true,
        sandboxCopy: true,
        cryptoHidden: true,
        statuses: status,
        mobileFits: true,
      }),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
