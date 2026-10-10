# Beta preparation - 9 October 2026

Target: beta.evoverses.com, website branch dan-dev. The user now requests a public beta release. Implementation is continuing locally while hosted runtime, provider access and concrete infrastructure/secret configuration are completed. No deployment or paid infrastructure change has occurred.

## Completed locally

- Next.js/eslint-config-next 15.5.27 and React/ReactDOM 19.1.9 are pinned in the workspace lockfile. The isolated production build passes, including TypeScript and Beta Admin routes. Existing lint warnings remain.
- Evoros Checkout is disabled in the UI and server handler. EVO settlement remains disabled. Stripe sandbox configuration is retained on standby.
- Nursery stays visible; breeding submission and egg collection are guarded in the UI and final contract-call layer pending contract approval.
- `/beta-admin` uses the signed-in Epic account and backend permission checks. Ordinary users cannot search players or issue rewards.
- Approval adds 5,000 Evoros once. Existing balances are retained. Reapproval, retries and concurrent requests cannot repeat that initial grant.
- Administrators can grant additional Evoros, any catalogue consumable or unopened 2/4/6-Evo packs. Each action requires a reason and confirmation and creates an immutable audit/receipt transaction.
- Revocation suspends the player and revokes sessions; inventory is retained. The operator administrator cannot be revoked through this interface.
- A future backend-only rule resolver can grant rewards using a unique player/rule/milestone key. The proposed two-pack at every ten verified player levels is **not active**. No browser can claim a level or trigger this resolver.

## Local administrator activation

The user-selected account is stored as `DanMancs`. It was uniquely matched to an active, verified Epic identity before enabling the ignored operator-review file. Startup backs up the database before schema 011 and pins the immutable player ID, so later display-name changes do not transfer the role. The review file and backup remain under the ignored local Saved directory.

The owned local service was stopped and restarted through its launcher. A PowerShell ISO-date deserialization mismatch in the ownership guard was fixed by comparing full UTC timestamps; PID, executable, script and run-directory checks remain intact. Re-sign in with Epic after restart, then visit http://localhost:3100/beta-admin.

## Verification

- Backend administration: 17/17 passed.
- Website administration route: 5/5 passed.
- Disposable native PostgreSQL 15.17: 42/42 passed, including eight independent competing connections, once-only beta grants and future reward milestones. Evidence: sibling game repository `Saved/PlayerEconomyNative/faabd1c95da0/summary.json`; the owned container and data volume were removed.
- An earlier native run reported INVALID_SESSION in the admin concurrency fixture. It did not recur in this run; no production authentication check was weakened and no specific fix is claimed.
- Updated website production build passed in `.next-beta-check`, preserving the running development preview. This is not yet clean Linux/Vercel evidence.
- Public HEAD check at 08:21 UTC on 9 October: beta.evoverses.com returns HTTP 307 to evoverses.com. The new beta has not been deployed.
- Connected Vercel inspection: accessible projects are procurable-nextjs and auto-gpt-next-web-fyhg; the evoverses/website repository filter returns none. Direct beta.evoverses.com deployment lookup returns 404; the evoverses.com domain/project lookup returns 403 (no domain access). This confirms a scope/access limitation, not that the live domain or deployment does not exist. No Vercel changes were made. Obtain access to the existing EvoVerses team before configuring its beta domain, or review a separately owned beta project.

## Remaining release work, in order

Cloudflare Workers is now the locally checked alternative to Vercel for the limited beta audience. [Compatibility results and remaining checks](cloudflare-compatibility.md). Vercel access is no longer a prerequisite if this hosting option is selected; AWS account/backend work is still required. No deployment or DNS changes have occurred.

1. Package the account backend with its authored catalogue/progression data and migrations, independent of Windows paths and sibling checkout imports.
2. Add durable one-use OAuth transactions and confirmations, secure hosted cookies and a fixed authenticated HTTPS account adapter. Keep local development separate.
   Implemented and locally tested: [hosted account progress](hosted-account-progress.md). The runnable hosted backend and wallet adapter remain outstanding.
3. Public website and Epic sign-in: no invitation gate. Approval controls the once-only tester reward and administrator grants. Suspended accounts remain blocked by existing backend checks.
4. Verify clean Linux build, current dependency advisories, database migration/restore and multi-instance login behaviour.
5. Inspect the existing Vercel project and AWS capacity read-only. Provider connections must be available. AWS secret work must follow the required aws-secrets-manager skill, which is unavailable in this session.
6. Prepare reviewed IaC, exact environment names, Epic beta callback, Thirdweb allowed origin, migration/rollback and incremental cost. Stripe remains on standby; no payment testing is needed for this disabled-purchase beta.
7. Provision and publish the reviewed revisions once provider access, secret handling and infrastructure changes are concretely approved; run public-login, admin, inventory, wallet, restart and disabled-transaction checks before announcing the beta.

Do not upload local databases, backups, account records or ignored configuration. Local administrator pinning does not automatically grant the same role in a fresh hosted database; bootstrap it only after verifying the same Epic identity there.
