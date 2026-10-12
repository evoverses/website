# Leaderboard rewards: implementation and release log

## Agreed rules

Trainer earned XP determines prizes, including earned XP beyond level 100. Evo XP, PvBot, Friendly and server-failure results are excluded using the same scoring SQL as the public leaderboard. Calendar periods use UTC; Day starts at midnight, Week on Monday, Month on its first day.

| Period | Minimum completed ranked battles | Gold | Silver | Bronze | Release |
|---|---:|---|---|---|---|
| Day | 3 | 3 Vital Dew | 2 Vital Dew | 1 Vital Dew | Automatic |
| Week | 5 | 4-Evo pack | 2-Evo pack + 3 Vital Dew | 2-Evo pack | Admin approval |
| Month | 10 | 6-Evo pack + gold badge | 4-Evo pack + silver badge | 2-Evo pack + bronze badge | Admin approval |
| All-time | — | Recognition only | Recognition only | Recognition only | No periodic grant |

Positive period XP and active, approved beta status are required. Qualifying trainers receive separate competition prize places: ties share a prize, with places such as 1,1,3. Ineligible public leaders are skipped; public ranking stays unchanged. Packs arrive unopened and use the existing opening/reveal flow. No currency, XP, NFT or combat-state changes are made by reward grants.

## Backend and storage

Migration 022 adds immutable versioned policies, reward periods, per-component receipts and permanent monthly badges. Its policy activates at database migration time; only complete calendar periods starting at or after activation are included. Existing records are not backfilled. The v1 policy requires beta approval; a future explicitly installed production policy can disable that requirement without changing administrator permissions or client payloads. A new policy applies to periods starting after its activation; historical periods retain their pinned version and catalogue revision.

`LeaderboardRewards` reuses the public leaderboard scoring CTE and the existing audited inventory grant operation. Product revisions are checked against immutable installed catalogue records. Hosted startup checks the policy after catalogue installation and requires the new tables before opening the listener.

Period preparation saves proposed qualifying winners, scores, battle counts, prizes and a preview fingerprint. Weekly/monthly approval recalculates this proposal; a changed fingerprint updates the preview and awards nothing until confirmed again. Final grants, inventory changes, badges, component receipts and the period decision commit together. A stock-capacity or other database failure rolls back the whole period. Awarded/withheld periods and grant receipts cannot be edited or deleted.

Shared advisory locks and recipient row locks serialize competing reward and inventory operations. Unique period and receipt keys prevent duplicate awards; identical decisions return their prior result. Pinned catalogue revisions remain grantable after a newer revision is authored; ordinary administrator grant validation remains unchanged. Administrator approval is recorded on the period; individual item grants retain the existing rule/event audit records.

## Automatic daily operation

The existing account API process runs a non-overlapping daily check on startup and once per minute. Database time determines closed periods. Up to seven missing days are prepared/awarded per check, so a restart catches up without awarding twice. Multiple API processes use the same database lock and receipts. No additional server, Cloudflare schedule, public automatic-grant route or per-battle reporting is required.

Failures emit the safe status `LEADERBOARD_DAILY_REWARDS_PENDING` and retry next minute. A failed batch grants nothing; persistent failures require operator investigation, rather than fabricating prizes or bypassing eligibility. Weekly/monthly periods never auto-approve. Administrators prepare up to 20 outstanding periods of each type per request, then review and approve or withhold with a reason.

## Interfaces and website

Service-authenticated internal POST routes under `/internal/leaderboard/rewards` provide the public archive, `/me` and `/admin/list|prepare|approve|withhold`. Private/admin routes additionally require a live account session; administration is checked server-side. Payloads cannot supply recipients, quantities, scores or reward contents. Body, request concurrency and database statement limits apply.

`POST /v1/player/rewards` with a game account bearer session and `{}` supplies that player's permanent badges and recent reward history. This is read-only and requires no website service credential. It establishes the shared game/profile interface; displaying badges in the game is a later cosmetic step. Inventory grants already appear through the existing game inventory API.

Website adapters provide:

- `POST /api/leaderboard/rewards`: strict admin list, preparation and decision requests; same-origin/host checks and HttpOnly session.
- `GET /api/leaderboard/rewards/archive?page=0`: awarded periods only; no player IDs, approval hashes, operator details or wallet information. Banned/closed recipients are omitted from public display. Cache: 60 seconds.
- `GET /api/leaderboard/rewards/me`: own badges and last 50 awarded periods; private, uncached.

The account admin page has a reward table, pagination, recipient/prize totals and confirmation dialogs. Changed previews remain open for fresh confirmation; uncertain outcomes preserve the same decision payload for safe retry. Trainer profiles show permanent dated medals and reward history, noting that prizes are already in Inventory.

The leaderboard has separate **View prizes** and **Past winners** buttons. The graphic prize dialog switches between daily/weekly/monthly cards using existing Vital Dew and pack artwork. The winners dialog loads the public archive only when opened. Both use the existing accessible UI dialogs and theme, support Escape/focus restoration and fit mobile viewports. All-time has no recurring prizes.

## Evidence and release

Synthetic database tests cover activation boundaries, threshold-based skipping of a higher-scoring trainer, ties, casual/failure exclusion, automatic catch-up/restart, manual monthly badges/packs, changed eligibility, repeated decisions, withholding, immutable history and whole-period rollback. HTTP tests cover service/session/admin enforcement and the read-only game route. Existing administration, hosted startup and pack-store regression tests are included.

Website tests also compare all nine graphic prize cards against the v1 policy and check the separate popup buttons. They cover origins, sessions, strict payloads, cache separation, public/private projections and changed approval receipts. Production Next/OpenNext builds and actual-component browser checks are run. Browser evidence uses real React/query/Radix/UI components and local artwork with synthetic API replies: all prize tabs, both pop-ups, Escape/focus restoration, 390px layout and changed-preview reconfirmation. No real accounts were granted prizes during implementation.

Hosting remains unchanged. Recommended next step: restore AWS access, reconcile the actual current account-service runtime, explicitly apply pending migrations 021 and 022, update the account API, then publish the website and check the public/private routes. Migration 022's activation time is the reward start point. Preserve existing resources, secrets, prices and game-server settings.

## Final verification checkpoint

52 backend leaderboard/administration/hosted/pack-store tests and 19 website leaderboard/admin tests pass. Four existing hosted startup checks pass again after adding policy validation. Interactive browser checks additionally verify both prize/history dialogs, artwork loading, all three prize periods, keyboard focus, a 390px viewport and changed-preview confirmation. These are local synthetic checks; no hosted release or real grants occurred.

### Past winners period tabs

Past winners has independent Daily, Weekly and Monthly tabs. The API filters awarded periods before pagination; changing tabs returns to page one. Arrow keys, Home and End navigate the tabs. Closed dialogs do not load history. Existing unfiltered API callers remain supported. No database migration is required.

Verification: six backend leaderboard tests and ten website leaderboard tests passed, as did the production build. Headless browser checks used real components with synthetic responses to verify each period, pagination reset, keyboard navigation and dialog focus. Screenshots are in website docs/evidence/leaderboard-rewards. Deployment remains pending AWS login renewal.
