# Ranked leagues and monthly Pro entry — 12 October 2026

## Scope and current release state

Local implementation on game/backend `Dan/2026_BETA` and website `dan-dev`. No AWS database migration, Cloudflare publication, provider reconfiguration or real EVO payment activation is included. Hosted Pro entry is explicitly disabled in the service composition. Store and breeding beta transaction restrictions remain separate and unchanged.

Reviewed the concurrent “Build headless battle server” thread before editing. Preserved its sign-in, team restoration, server-failure protection, Play presentation and 60-minute HP/PP recovery. Removed the Ranked Friend choice and disabled new create/accept requests on the backend; existing trusted runtime and matches remain supported for safe settlement. Friendly remains EOS P2P without XP or competitive outcomes.

## Competitive rules

- Period wins rank highest; equal wins use fewer losses (equivalent to win/loss ratio); identical wins/losses share competition rank. XP remains an informational statistic.
- Only backend matchmaking records with `source=random` qualify. A client mode claim or friend challenge cannot qualify. Service failures contribute neither XP nor results; natural completion alone awards XP. Confirmed forfeits/disconnects count W/L with zero XP.
- Equal selected team sizes are required. Median/highest level tolerances are 2/5 initially, 5/10 after 30 seconds and 10/20 after 60 seconds. Both provider configuration and backend validation remove unrestricted widening. Existing hosted provider configuration must be updated at release, not silently assumed updated.
- There is no opponent-pair match cap. Review flags cover repeated opponents, reciprocal wins, concentrated opponent networks, short matches/surrenders and NFT identities used across accounts. They are evidence for administrators, not automatic bans or a guarantee against collusion. Shared IPs/wallets alone are not punishment criteria.
- Standard prize minima remain 3 daily / 5 weekly / 10 monthly battles, with a win under the new policy. Daily grants are automatic; weekly/monthly require approval. Pinned historic reward policies and finalized payouts are not rewritten.
- Pro requires a paid monthly entry, an active beta-approved account, at least ten qualifying monthly matches and at least one win. Every Evo in that player's backend-approved starting team must be an NFT. Mixed teams are excluded; the opponent need not be entered. Enrolment counts eligible matches throughout that UTC month, including before payment.

## Entry and exact accounting

Registration runs from seven days before UTC month start until 00:00 UTC on day 8, excluding the closing instant. Admins publish a positive EVO fee before opening; publication locks it permanently. Unconfigured or cancelled competitions reject payment.

A signed-in approved player creates an immutable account/month intent bound to a verified linked wallet. The existing website wallet submits an exact ERC20 EVO transfer on Avalanche C-Chain (43114), token `0x42006ab57701251b580bdfc24778c43c9ff589a1`, directly to treasury `0x9F64C4bECa7BBda647B9A755B29F7F9687bc4303`. There is no allowance, new contract, backend signing key or automatic payout.

Read-only verification checks chain ID, successful finalized receipt, canonical block hash, token Transfer event, linked sender, treasury, exact amount and block timestamp within registration. Verification can finish after closing if the transfer was timely. Unlinked wallets cannot verify new entries. A transaction hash can enrol exactly one player/month; global transaction locking and immutable records protect duplicate/concurrent submissions. No client-submitted amount/effect is trusted.

Pool = collected fees minus floor(collected fees / 5) + discretionary bonus. Commission is rounded down to the smallest 18-decimal unit, so any indivisible unit remains in the prize reserve. Bonus incurs no commission. Admin bonus control records the absolute earmarked bonus total, not an automatic bank transfer; administrators must actually fund treasury.

Top-three shares remain 50/30/20; tied ranks split occupied prize shares. Unfilled places and integer remainder stay accounted for as reserve. Winner finalization freezes exact amounts and the oldest currently verified linked payout wallet. Manual payment/refund records require confirmation, hash and reason, with immutable audit history; they do not independently verify outgoing transfers.

Cancellation zeroes commission allocation and the prize pool, creates full entry-fee refund liabilities and prevents prize finalization. Zero qualifying winners follows the same cancellation/refund path. Refunds are manual per entrant. Admin entrant previews are bounded to 500 records and explicitly report additional records; before opening entry to a larger audience, add paginated refund management. Flags are bounded to 200 review signals.

## Interfaces and recovery

Authenticated private website POST `/api/leaderboard/pro/entry` handles status, intent and verify through service-authenticated backend routes `/internal/leaderboard/pro/entry/{status,intent,verify}`. Responses are uncached and schema-validated; public leaderboards expose no wallet addresses or player IDs. Payment controls stay disabled until a separate release enables the backend.

The website saves a submitted hash against its intent and offers hash-based verification recovery, including after closing. If a browser crashes after wallet broadcast but before saving the hash, retrieve it from wallet history and verify the existing intent; never infer failure or send a second payment merely from a timeout. An intent cannot switch its paying wallet within the same month. Identical verified retries return the original confirmation; altered retries fail.

## Migration reconciliation and release preflight

Sequence is `023_one_hour_recovery.sql`, `024_pro_monthly_prizes.sql`, then `025_ranked_league_entry.sql`. The previously duplicated Pro `023` file was renamed to 024; the other thread's recovery migration was preserved unchanged. Prior thread evidence says Pro migration was not deployed, but the live AWS ledger has **not been independently verified** in this sprint. The available read-only log query did not expose it.

Before any release, inspect the actual deployed migration ledger. The migration runner checks canonical filenames, ordering and stored checksums and refuses mismatches. If the old Pro 023 is already applied, stop and reconcile the ledger through an explicit reviewed upgrade; do not rename applied records or bypass checksum checks. Apply pending migrations using the reviewed release mechanism, roll the API, update matchmaking configuration and publish the website together. Do not run the old diagnostic migration task as a read-only check: it applies migrations.

## Verification and recommended next step

Recorded checks: 75 backend regression tests passed, plus the refreshed 10 Pro/reward checks and 16 website tests. Windows game and editor Development compilation passed. Headless Unreal automation completed 44 tests with zero failures (one existing warning). Next.js production and OpenNext Worker packaging passed. Canonical Git migration export/checksums passed (25 migrations). Browser fixture screenshots are under website `docs/evidence/ranked-league-entry/`.

Disposable database suites cover provenance, bounds, team eligibility, ties, existing XP/recovery and service failures; entry checks cover chain/token/sender/recipient/amount/window, finality/reorg, unlinking, concurrent retries, locked terms and commission/refunds. Website tests cover authentication, same-origin protection, forged inputs, private response projection and rules. Actual React browser fixtures cover winner/bonus confirmations, hash-gated manual Paid records, refreshed audit state and mobile layout. These use synthetic wallets and API data; they are not a live two-player match or real payment rehearsal.

Recommended next step: resolve the reported ranked server dropout, verify the live migration ledger, then authorize a coordinated beta release. Keep actual entry payments disabled until a test-wallet end-to-end verification checks deployed RPC finality support, linked-wallet admission and deadline/retry recovery. No real entry fee or bonus has been configured by these tests.
