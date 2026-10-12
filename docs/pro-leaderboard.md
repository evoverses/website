# Monthly Pro leaderboard and manual EVO prizes

> Historical implementation note: scoring and release advice below are superseded by the ranked-leagues-and-pro-entry document. Current ranking uses wins, Pro requires paid entry and an all-NFT team, and deployment remains paused.

## Behaviour

- Monthly Pro appears on the website leaderboard only with Pro mode enabled. Public scores contain names, levels, NFT XP and ranked battle statistics; wallets and player IDs are never exposed publicly.
- Count immutable ranked XP awards with recipient kind `evo` and canonical identity `chain:`. Ordinary Evo and trainer awards are excluded. Mixed teams contribute only their NFT Evos’ earned XP. Earned XP continues to count after the Evo reaches its level cap, as on the standard leaderboard.
- Calendar months use UTC. Completed ranked matches count; casual modes, unfinished matches and server-failure reconciliations do not. XP belongs to the trainer who earned it and is not moved by subsequent NFT transfers or wallet links.
- Prize eligibility retains positive XP, at least ten completed ranked battles involving NFT Evos, active account status and the existing `requireBetaApproval` policy. Qualifying prize ranks are calculated independently of the public rank. Existing standard item rewards are unaffected.
- Admins set an EVO pool per month. Qualifying first/second/third places receive 50/30/20 percent. Ties share the prizes for their occupied places: joint first gets 40% each, followed by third at 20%. A tie crossing third shares the remaining third-place allocation. Unfilled places remain unallocated, rather than redistributing their percentages.
- Amounts use exact 18-decimal integer token units, never floating-point calculations. Any indivisible unit is assigned deterministically by internal player ID; allocations never exceed the pool. The supported maximum is one trillion EVO.

## Administration and payment

1. Select a month and confirm the pool amount. Pool changes are audited; no tokens move.
2. Once the month ends, review the qualifying names, XP, amounts and full first-linked-wallet addresses. The first wallet means the oldest currently linked, verified wallet, with link ID as the stable tie-breaker. Shared wallets remain allowed.
3. Confirm the winners and addresses. This freezes the recipient, amount and encrypted wallet snapshot. A changed preview, stale version, missing wallet or open month blocks confirmation. Unlinking or adding wallets afterwards cannot silently redirect this month’s prize.
4. Make the Avalanche EVO transfer yourself, after checking the displayed address and amount. The website has no transfer authority and does not hold a treasury signing key.
5. Tick Paid, supply the completed Avalanche transaction hash and a note, then confirm. Paid is a manually recorded status, not an independent on-chain payment verification. The actor, time, transaction reference and reason enter the immutable audit log.
6. Correct an erroneous Paid record by unticking it and entering a reason. The prior transaction reference remains in the audit log; the prize and wallet cannot change.

All mutations require a current administrator session, a unique request ID and an expected version. Identical retries return the saved receipt; changed retries fail. A network-uncertain UI retains the original request for retry and never automatically transfers or refunds tokens.

## Technical connections

- Additive migration `024_pro_monthly_prizes.sql`: indexed NFT XP reads, monthly pools, encrypted payout snapshots and immutable admin audit. Database triggers prevent changing finalized pools or payout recipient/amount data.
- `pro-leaderboard.cjs` reuses the trusted ranked award tables; `hosted-wallet-links.cjs` decrypts payouts only within authorized administration. No real credential or wallet encryption key was read during development; tests use synthetic keys and accounts.
- Service-authenticated internal endpoints: `/internal/leaderboard/pro`, `/internal/leaderboard/pro/admin/list`, `/internal/leaderboard/pro/admin/change`. Administration additionally requires an authenticated admin session. The website adapter is `/api/leaderboard/pro` (public GET; authenticated, same-origin POST).
- Public pages have 50-row database pagination, a bounded 60-second API cache and a 60-second public response cache. Prize previews are private and uncached. No new server, scheduled worker, blockchain transaction or automatic token payout is introduced. At most 1,000 tied prize recipients are supported; larger previews fail explicitly.
- Deployment must apply migration 023 in addition to pending leaderboard migrations 021/022, roll the AWS API, then publish the Cloudflare website. Hosting configuration and production databases have not been changed by this sprint.

## Verification and next step

Thirteen backend checks cover mixed-team scoring, nine-versus-ten battle eligibility, beta approval, exact allocations/ties, exclusions, admin/service authentication, encrypted first-wallet snapshots, missing-wallet rollback, unlinking after confirmation, open-month rejection, retry/stale-version handling, Paid correction and immutable audit/amount records. Fifteen website checks cover the existing leaderboard, Pro-only navigation, listed rules, input validation, CSRF/session handling and privacy projections. Actual-component headless browser checks with synthetic API responses cover pool confirmation, winner review, payment-note/hash gating, refreshed Paid/audit state and mobile table scrolling. The website production build is also checked.

Recommended next step: restore AWS CLI authentication, apply the pending additive migrations and deploy the API/website together. Then review the live monthly scores and admin previews. No real pool has been configured or token payment recorded by these tests.
