# EvoVerses hosted beta plan

**Status: Dan requested the public beta release on 9 October 2026 (Brisbane). Local implementation is underway; nothing deployed. See [hosted account progress](hosted-account-progress.md) for current evidence and remaining blockers.**

The policy below is historical where superseded by [beta preparation](beta-preparation.md): all Evoros purchasing is disabled, Stripe stays on standby, and administration may grant currency, consumables and unopened packs. Automated milestone rewards have a trusted-event extension point but are not active. The account server, database and website are still local.

The historical website snapshot below was `dan-dev` at `d7406ec`. The user has since authorised hosting implementation and requested release. AWS provisioning still needs a concrete infrastructure/cost review and required secret handling. Automatic `dan-dev` Vercel deployment is not the chosen path; Cloudflare Workers is being prepared.

**Historical pause:** item consumption work was prioritised before hosting. The user has now resumed website release preparation; do not interpret the earlier pause as a current instruction to stop this work.

## 1. Intended result

A public beta website at **https://beta.evoverses.com**, with accounts and inventory stored on AWS. Anyone with the address can browse and sign in. Every approved tester receives **5,000 Evoros once**, plus the existing starter pack. Approval controls rewards, not an invitation gate.

Stripe uses test payments. Nursery transactions remain disabled until the separate contract approval. Dedicated battle hosting and real-money launch are later steps.

| Component | Proposed setup | Purpose |
| --- | --- | --- |
| Website | Dedicated Vercel beta project, using `dan-dev` | Isolates beta configuration from the main website. |
| Account API | Separate AWS ECS/Fargate service in Ohio | Handles identities, balances, inventory, wallet links and administration. |
| Database | New logical database, `evoverses_player_beta`, on the existing private RDS instance | Reuses existing hosting while separating player data from NFT metadata. |
| Management | Protected `/beta-admin` page | Provides controlled tester and Evoros management. |

The AWS reuse proposal is based on the **5 October audit**; refresh capacity and resource checks before provisioning.

## 2. Accounts and management

- Permit public browsing and verified Epic account creation/sign-in. Bind each account to its permanent Epic identity. Administrator revocation still suspends an account and invalidates its sessions; a pending tester does not require approval to sign in.
- Grant **5,000 Evoros once per beta player**. Record a unique grant and ledger entry transactionally; repeat logins, concurrent requests and re-invitations cannot repeat it. Keep the existing once-only starter pack.
- Add Beta Admin controls for tester rewards, account revocation, player search, balances, inventory and audited Evoros/item adjustments. Do not build invitation management.
- Adjustments require a reason and confirmation, preserve a non-negative balance, and record administrator, amount, previous/new balance and time. Repeated submissions apply once.
- Restrict administration to Dan's verified Epic identity initially. Check permissions in the AWS service on every operation.
- Keep item/Evo inventory read-only in Admin. No raw SQL editor, account deletion, inventory grants or price editor in this first version.

**Database additions:** tester reward approval records, administrator permissions, once-only beta grants and audited adjustments. Extend the existing ledger's source validation; never disguise grants as Stripe purchases. Public sign-in does not depend on a beta approval record.

## 3. Hosted connections and provider configuration

### Website and AWS

- Introduce an explicit hosted-beta adapter while retaining localhost development. Do not bypass production protections by setting `NODE_ENV=development`.
- Preserve the website's current account routes and display types. Browser requests go through Vercel to the authenticated AWS API; browsers never access PostgreSQL.
- Package the backend independently of local Windows paths and sibling-checkout runtime imports. Use native PostgreSQL, a small connection pool and versioned migrations.
- Start with one Fargate task at **0.25 vCPU / 512 MiB**, subject to measured load testing. Reuse the existing network/load balancer with a separate HTTPS route at `accounts-beta.evoverses.com`.
- Require encrypted connections, restricted database permissions, application-encrypted wallet links, backups and tested recovery. Keep player data inaccessible to public GraphQL.
- Complete the mandated AWS Secrets Manager workflow before credential configuration; that skill was unavailable in the planning session.

### Epic

- Register `https://beta.evoverses.com/api/player/auth/epic/callback` for the website client.
- Move OAuth transaction state and pending confirmations into the AWS-backed service so separate requests and restarts work reliably.
- Preserve verified identity mapping and explicit account creation. Use secure, host-only session cookies and exact beta-origin checks.
- Check Epic's permitted tester access/brand-review requirements before inviting external testers. Configure the Thirdweb public client for the beta domain.

### Stripe

- Keep the existing sandbox and approved six bundles at **US$0.01 per Evoro**.
- Run Checkout creation and fulfillment through the AWS service. Register its permanent HTTPS webhook, independent of the local CLI listener.
- Preserve signature verification, payment/order validation and transactional once-only crediting, including delayed-payment success. Redirects never credit currency. [Stripe fulfillment guidance](https://docs.stripe.com/checkout/fulfillment).
- Keep real payments and EVO settlement disabled.

## 4. Verification and release

Before release, verify:

- Public Epic login succeeds without tester approval; suspended/revoked accounts fail. Only authorised administrators can issue tester rewards.
- Each account receives exactly 5,000 Evoros and one starter pack, including simultaneous first logins.
- Administration rejects ordinary users, forged requests and duplicate adjustments.
- Balances, inventory and wallet links persist across service restarts.
- Successful sandbox purchases credit once; cancelled, declined, forged and replayed confirmations do not incorrectly credit.
- Concurrent spending cannot overspend, and database recovery preserves ledger consistency.
- Existing website tests/build pass, and exploitable dependency vulnerabilities are resolved before exposure.
- **Added release dependency:** representative advertised items work through purchase, target selection, effect application, once-only consumption and persisted state, rather than merely appearing in inventory.

Prepare CDK changes, a migration/rollback procedure, cost estimate and deployment runbook for review. Deployment requires separate explicit approval. Keep automatic Git deployments blocked; initially release a reviewed commit manually to the dedicated beta project.

## 5. Cost and deferred sprint

Reuse existing AWS infrastructure, targeting **US$15-20/month additional AWS cost**, subject to the regional quote and measurements. Avoid another RDS instance, NAT gateway or load balancer.

Budget for Vercel Pro if the existing account lacks it: **US$20/month base** at the time of planning, plus applicable usage. Hobby is restricted to personal, non-commercial use. [Vercel plans](https://vercel.com/docs/plans/pro-plan), [Hobby restrictions](https://vercel.com/docs/plans/hobby).

**Deferred hosting sprint:** implement and test the once-only 5,000-Evoros grant and minimal Beta Admin interface locally, documenting both. Then prepare the hosted adapter and AWS infrastructure changes. This sprint is paused until Dan resumes it.

## Current next step: game item usage

Read-only source inspection on 8 October confirms:

- Store purchases, inventory and atomic pack opening exist locally.
- `EvoRecovery.useRevive` provides server-only, transactional revival/consumption rules; it is not exposed by a real game item-use route or screen.
- Persistent combat state and 12-hour fainted-PvP recovery rules exist, but actual battle hydration/authoritative outcome settlement still need connection.
- General healing, PP/status restoration and temporary buffs do not yet form an end-to-end purchase-to-use loop.

Start with authoritative HP hydration and one outside-battle healing/revival flow; integrate target selection and named eligibility errors in the themed game inventory. Commit the effect and item consumption together, reject duplicates and concurrent uses, and treat NFT/account Evos identically in the game. Battle use follows through the shared battle HUD and validated battle actions. Do not accept client-submitted HP, healing amounts or results as authority. PvP item policy, PP persistence and draft effect values require review before those behaviors are enabled.
