# Ranked leagues and monthly Pro entry — 12 October 2026

## Original implementation checkpoint

Local implementation on game/backend `Dan/2026_BETA` and website `dan-dev`. No AWS database migration, Cloudflare publication, provider reconfiguration or real EVO payment activation is included. Hosted Pro entry is explicitly disabled in the service composition. Store and breeding beta transaction restrictions remain separate and unchanged.

Reviewed the concurrent “Build headless battle server” thread before editing. Preserved its sign-in, team restoration, server-failure protection, Play presentation and 60-minute HP/PP recovery. Removed the Ranked Friend choice and disabled new create/accept requests on the backend; existing trusted runtime and matches remain supported for safe settlement. Friendly remains EOS P2P without XP or competitive outcomes.

## Competitive rules

- Period wins rank highest; equal wins use fewer losses (equivalent to win/loss ratio); identical wins/losses share competition rank. XP remains an informational statistic.
- Only backend matchmaking records with `source=random` qualify. A client mode claim or friend challenge cannot qualify. Service failures contribute neither XP nor results; natural completion alone awards XP. Confirmed forfeits/disconnects count W/L with zero XP.
- Equal selected team sizes are required. Median/highest level tolerances are 2/5 initially, 5/10 after 30 seconds and 10/20 after 60 seconds. Both provider configuration and backend validation remove unrestricted widening. Existing hosted provider configuration must be updated at release, not silently assumed updated.
- There is no opponent-pair match cap. Review flags cover repeated opponents, reciprocal wins, concentrated opponent networks, short matches/surrenders and NFT identities used across accounts. They are evidence for administrators, not automatic bans or a guarantee against collusion. Shared IPs/wallets alone are not punishment criteria.
- Standard prize minima remain 3 daily / 5 weekly / 10 monthly battles, with a win under the new policy. Daily grants are automatic; weekly/monthly require approval. Unfinalized Standard reward reviews use the current wins-based policy; finalized historic rewards and payouts are not rewritten. Review flags belong to the selected reward period.
- Pro requires a paid monthly entry, an active beta-approved account, at least ten qualifying monthly matches and at least one win. Every Evo in that player's backend-approved starting team must be an NFT. Mixed teams are excluded; the opponent need not be entered. Enrolment counts eligible matches throughout that UTC month, including before payment.

## Entry and exact accounting

Registration runs from seven days before UTC month start until 00:00 UTC on day 8, excluding the closing instant. Admins publish a positive EVO fee before opening; publication locks it permanently. Unconfigured or cancelled competitions reject payment.

A signed-in approved player creates an immutable account/month intent bound to a verified linked wallet. The existing website wallet submits an exact ERC20 EVO transfer on Avalanche C-Chain (43114), token `0x42006ab57701251b580bdfc24778c43c9ff589a1`, directly to treasury `0x9F64C4bECa7BBda647B9A755B29F7F9687bc4303`. There is no allowance, new contract, backend signing key or automatic payout.

Read-only verification checks chain ID, successful finalized receipt, canonical block hash, token Transfer event, linked sender, treasury, exact amount and block timestamp within registration. Verification can finish after closing if the transfer was timely. Unlinked wallets cannot verify new entries. A transaction hash can enrol exactly one player/month; global transaction locking and immutable records protect duplicate/concurrent submissions. No client-submitted amount/effect is trusted.

Pool = collected fees minus floor(collected fees / 5) + discretionary bonus + discretionary incoming rollover. Commission is rounded down to the smallest 18-decimal unit, so any indivisible unit remains in the prize reserve. Bonus incurs no commission. Admin bonus control records the absolute earmarked bonus total, not an automatic bank transfer; administrators must actually fund treasury.

Top-three shares remain 50/30/20; tied ranks split occupied prize shares. Unfilled places and integer remainder stay accounted for as reserve. Winner finalization freezes exact amounts and the oldest currently verified linked payout wallet. Manual payment/refund records require confirmation, hash and reason, with immutable audit history; they do not independently verify outgoing transfers.

Explicit cancellation zeroes commission allocation and the prize pool, creates full entry-fee refund liabilities and prevents prize finalization. Failure to qualify does not create a refund, including when nobody qualifies: administrators close the month with no winners and retain the commission and prize reserve. This is stated in the public rules and before payment. Entrants and refunds are paginated, 50 per page. Flags are bounded to 200 review signals.

Administrators may roll available reserve into a later month with a published fee, using a confirmed amount and reason. Rollover is discretionary, never automatic, incurs no additional commission and sends no tokens. Immutable records protect against repeated or excessive allocation. Finalized winner allocations remain protected, even if not yet paid. Cancelled months may roll only bonus/carryover reserve; entry fees remain reserved for refunds.

## Interfaces and recovery

Authenticated private website POST `/api/leaderboard/pro/entry` handles status, intent and verify through service-authenticated backend routes `/internal/leaderboard/pro/entry/{status,intent,verify}`. Responses are uncached and schema-validated; public leaderboards expose no wallet addresses or player IDs. Payment controls stay disabled until a separate release enables the backend.

The website saves a submitted hash against its intent and offers hash-based verification recovery, including after closing. If a browser crashes after wallet broadcast but before saving the hash, retrieve it from wallet history and verify the existing intent; never infer failure or send a second payment merely from a timeout. An intent cannot switch its paying wallet within the same month. Identical verified retries return the original confirmation; altered retries fail.

## Migration reconciliation and release preflight

Sequence is `023_one_hour_recovery.sql`, `024_pro_monthly_prizes.sql`, `025_ranked_league_entry.sql`, then `026_pro_prize_rollover.sql`. The recovery migration and previously committed migration 025 remain unchanged. A read-only AWS check on 12 October confirmed deployed versions 1–20; all 20 recorded checksums match canonical Git source. Neither conflicting 023 was applied. Evidence is in the game repository at `Documentation/evidence/ranked-league-live-ledger-2026-10-12.json`. No migration or database change was made.

At release, recheck the ledger, apply pending migrations using the reviewed mechanism, roll the API, update bounded matchmaking configuration and publish the website together. The runner refuses filename/checksum mismatches. Do not use the diagnostic migration task for read-only checks: it applies migrations.

## Verification and recommended next step

Latest checks: 81 backend regression tests and 17 website tests passed. Earlier game verification remains valid because this follow-up changes only backend/website code: Windows game and editor Development compilation passed. Headless Unreal automation completed 44 tests with zero failures (one existing warning). Next.js production and OpenNext Worker packaging passed. Canonical Git migration export/checksums passed against all 26 committed migrations. Browser fixtures also passed discretionary-rollover confirmation, pending-receipt retry and uncertain wallet-response recovery without a second transfer. Browser fixture screenshots are under website `docs/evidence/ranked-league-entry/`.

Disposable database suites cover provenance, bounds, team eligibility, ties, existing XP/recovery and service failures; entry checks cover chain/token/sender/recipient/amount/window, finality/reorg, unlinking, concurrent retries, locked terms and commission/refunds. Website tests cover authentication, same-origin protection, forged inputs, private response projection and rules. Actual React browser fixtures cover winner/bonus confirmations, hash-gated manual Paid records, refreshed audit state and mobile layout. These use synthetic wallets and API data; they are not a live two-player match or real payment rehearsal.

Recommended next step: resolve the reported ranked server dropout, then authorize a coordinated beta release. Keep actual entry payments disabled until a test-wallet end-to-end verification checks deployed RPC finality support, linked-wallet admission and deadline/retry recovery. No real entry fee or bonus has been configured by these tests.

## Completion audit and latest corrections

- Competitive rules, authenticated matchmaking provenance, equal team sizes, bounded widening, all-NFT Pro eligibility and friend-ranked rejection are implemented locally. Existing recovery, no-XP friendly play and server-failure handling remain covered by regression tests.
- Registration verification, duplicate/concurrent payment protection, exact accounting, cancellation/refunds and manual payout controls are implemented. Nonqualification now closes without refunds; discretionary rollover is recorded separately.
- Standard prize reviews use current wins ranking, with period-specific farming flags. Entrant administration is paginated.
- Browser fixtures verify standby payment controls, pending-receipt retries and uncertain wallet responses without a second transfer. They use synthetic SDK/API responses, not real payments.
- Remaining release gates: ranked server dropout diagnosis, coordinated deployment authorization, and deployed signed-in/test-wallet checks before enabling fees. Hosting and actual entry payments remain unchanged.

## Deployed beta release — 12 October 2026

Owner authorized deploying the website and matching account service. Applied migrations 021–026 transactionally; the live ledger now contains 26 entries, all matching canonical Git checksums. AWS account API stack reached UPDATE_COMPLETE; ECS API task revision 25 is serving healthy traffic. Backend source: `d4673532224ace754ba2b7d97c13934e50214b62`; image digest: `sha256:98bdf6b001dece7bd40e30ad7f3b7aa0dc3ff9f0acdd4bccf9734b37426cee5f`. The migration job used the same schema from the immediately preceding source checkpoint.

Published website `dan-dev` source `ed5b8a16ad94b3e92bc52004c0ae556cd7726451` to Cloudflare Worker `evoverses-beta`, version `5fc69284-4497-4352-a8e1-77703f915be1`, at https://beta.evoverses.com. Existing bindings, secrets and payment/breeding beta controls were retained.

Owner separately approved removing the extra global Pro payment block: availability now requires published, non-cancelled monthly terms; intent creation still enforces the UTC registration window and account/wallet checks. No fee or bonus was published and no payment was made. Current-month public Pro response has no configured pool.

Live checks: homepage, sign-in, Store, leaderboard and account-admin pages return HTTP 200; Day/Week/Month/All-time, Pro and past-winner APIs return valid public responses. Private Pro administration and entry return 401 without a session. Epic authorization start returns 303 to Epic with a browser-bound cookie. No account impersonation, grants, purchases or competition finalization was used in verification. Signed-in administrator interaction and full Epic credential entry require human review.

No game ZIP, game-server image, provider matchmaking configuration or DNS change was published. Rollback: restore the previous compatible API image and Cloudflare Worker version, retaining the additive schema and immutable ledgers; do not remove migrations. Next: review the leaderboard and beta-admin controls while signed in on beta.evoverses.com. Ranked-dropout resolution and matching game/provider release remain separate.
