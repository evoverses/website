# Cloudflare beta compatibility - 9 October 2026

Scope: local build and Workers runtime check for a limited audience. The beta website is public to anyone with its address; it is not invite-only. No resources, DNS, provider settings or deployments changed. This records a hosting option; it does not claim hosted Epic/account readiness.

## Result

The website builds with Next.js 15.5.27 / React 19.1.9 and OpenNext Cloudflare 1.20.10. Wrangler 4.149.0 produces a Worker bundle and runs it locally. Node 22.23.3 Linux was downloaded from nodejs.org and verified against its published SHA256.

Wrangler dry run reports 31,114.71 KiB uncompressed (about 30.4 MiB), 8,495.28 KiB gzip, and 1,264 static assets. Current Cloudflare documentation lists a 64 MiB uncompressed Worker limit and no compressed-size limit. This passes size checks; hosted startup time and production load have not been measured. [Cloudflare limits](https://developers.cloudflare.com/workers/platform/limits/).

| Local Workers check | Result |
| --- | --- |
| Sign-in page | HTTP 200 |
| Store page | HTTP 200 |
| Breeder Bertha page | HTTP 200 |
| Beta Admin shell | HTTP 200; no private data loaded |
| Account read without hosted configuration | HTTP 403 |
| Card Checkout | HTTP 403 / PURCHASES_PAUSED |
| Admin mutation without hosted configuration | HTTP 503 / BETA_ADMIN_UNAVAILABLE |

These are HTTP/runtime smoke checks with synthetic public settings, not signed-in user or browser visual checks. No real Epic, wallet, database or Stripe configuration was copied into the compatibility build. The local account database and normal preview were not used by the Worker.

## Reproduce

Use Node 22 or newer and pinned pnpm 10.12.3 from the repository root:

```sh
pnpm --filter website check:cloudflare
```

The script exports tracked and untracked non-ignored source to a temporary directory, excluding environment files, local data, symlinks, dependencies and build outputs. It installs from the frozen lockfile, builds Next/OpenNext and runs `wrangler deploy --dry-run`. The dry-run flag does not upload or deploy. Output remains in the printed temporary directory for inspection.

For local runtime testing of that exported copy:

```sh
pnpm exec wrangler dev --local --ip 127.0.0.1 --port 18788 --inspector-port 18789
```

Run this command from the exported copy's `apps/website`, with no provider credentials. Do not use `--remote`. The initial default inspector port conflicted with another service; the explicit isolated ports worked. No other process was stopped.

## Changes and encountered issues

- Added pinned OpenNext/Wrangler dependencies, `open-next.config.ts`, local compatibility Wrangler configuration and a credential-free isolated build script.
- Kept the existing Next build/dev scripts and Vercel hold. The compatibility Worker has no domains/routes and both workers.dev and preview URLs disabled. No deploy/upload script was added.
- Disabled the Sentry upload build wrapper only under the compatibility flag. The first credential-free attempt tried its upload hook and reported missing authentication; no credential was supplied. Ordinary builds keep their existing Sentry configuration.
- OpenNext required `.next/server/middleware-manifest.json` and did not accept the first custom dist directory. Builds now use `.next` inside the temporary source copy, protecting the real development output.
- The reusable checker invokes Next explicitly, avoiding dependence on a globally installed pnpm executable. Compatibility builds explicitly enable Next's standalone output, which OpenNext requires even when its own Next step is skipped. Normal build output settings are preserved.
- Added pino-pretty 13.2.0 because the existing webpack external list referenced it and Workers bundling could not resolve it. No module validation was disabled. Third-party negative-zero comparison warnings remain.
- The Windows dependency refresh encountered pre-existing WSL optional-platform symlinks. The affected verified links were replaced with native junctions to the same package files; source and account data were untouched.

Local evidence: `/tmp/evoverses-cloudflare-20261009/build.log`, `adapter.log`, `dry-run.log` and `preview.log`. Temporary evidence is disposable; this document preserves the results.

The final repository check command passed end to end from a fresh export at `/tmp/evoverses-cloudflare-MmHFfQ`, including frozen installation, Next build, adapter and dry-run: 31,104.54 KiB uncompressed / 8,492.51 KiB gzip, 1,264 assets. Windows TypeScript checking also passed after the dependency-link repairs. The owned local Worker smoke-test process was stopped after testing; the regular website/account preview was not stopped.

## Before a public beta release

1. Implement fixed HTTPS account connections and durable Epic OAuth state. Public sign-in does not require tester approval; approval controls rewards. Cloudflare hosting does not replace these backend connections.
2. Keep the account service and PostgreSQL on the separately reviewed AWS path. Browsers must not connect to the database. Do not migrate the player ledger to Cloudflare D1 merely to host the website.
3. Configure durable Next caching and image handling where used; the compatibility config uses adapter defaults, not a production cache plan. Test metadata failure and image loading.
4. Verify real Epic callback/logout, account/game identity, public sign-in, administrator-only rewards, shared wallets, inventory and Admin against the hosted service. Keep payments and Nursery transactions disabled.
5. Check hosted startup and request CPU before choosing Free or Paid Workers. Free has 100,000 requests/day and 10 ms CPU/request; a small audience reduces volume but does not eliminate per-request limits. Paid starts at US$5/month plus usage. [Pricing](https://developers.cloudflare.com/workers/platform/pricing/).
6. Review Cloudflare account permissions, beta-only domain routing, access controls compatible with Epic callbacks, cost and rollback. Seek explicit deployment/DNS approval before publishing.

Cloudflare currently recommends vinext for new Next applications. This check uses the OpenNext adapter to retain the existing Next build and avoid introducing a framework migration into the MVP. [Cloudflare Next guidance](https://developers.cloudflare.com/pages/framework-guides/nextjs/), [OpenNext existing-app setup](https://opennext.js.org/cloudflare/get-started).

**Recommended next sprint:** implement hosted account connections and durable login locally. Then stage the public Cloudflare beta with AWS accounts after the concrete infrastructure and provider configuration are approved.
