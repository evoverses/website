# Trainer leaderboard

## Behaviour

`/leaderboard` is a public website page linked from the main menu in standard and Pro modes. Day, Week, Month and All-time rank trainers by verified **earned trainer XP**, including XP earned after level 100. Trainer level uses the existing account XP policy and remains capped. Evo XP is not counted again. Day starts at 00:00 UTC, Week starts Monday at 00:00 UTC, and Month starts on its first day at 00:00 UTC. Timestamp ranges include their start and exclude the calculation time.

Rank is the leftmost column. Each row shows trainer display name, level, ranked battles, wins, losses and win rate. The rightmost column is the XP used for ranking: period XP for Day/Week/Month, lifetime earned XP for All-time. Period views also show lifetime XP for context; All-time shows it once. First, second and third place have gold, silver and bronze trophies, respectively; tied ranks share the corresponding trophy. Battle statistics use the selected period. Scores tie using competition ranks (1, 1, 3); name and internal player ID provide deterministic pagination without being additional scoring criteria. Pages contain 50 entries. The authenticated player has a separate position summary, including when outside the visible page. Names alone are never used to identify the highlighted player.

All-time means recorded earned awards, not an invented history derived from the current account balance. The current recorded source is trusted ranked trainer awards. Future XP sources must supply an immutable, timestamped award before inclusion; implementing quests/acquisition XP is outside this release.

## Data and security

The account service reads `ranked_xp_awards` (trainer recipients only), trusted completed ranked battles, battle participants and active player records. Valid terminal complete/forfeit/disconnect results contribute battle statistics; PvBot, Friendly, unresolved matches and recovered server failures do not. A match with no decisive winner has no win/loss contribution; win rate uses wins / (wins + losses), or a dash when neither exists.

Suspended and closed players are omitted. A period includes an active player who earned positive XP or completed an eligible ranked battle during it. No wallet, Epic subject, email, inventory or currency data is exposed. Immutable award keys continue preventing duplicate settlement scoring. No combat, XP or inventory write route was added.

The public account-service route is service-authenticated, rather than a player-data endpoint open on the ALB. The private route additionally validates the live player session. Both bound JSON, request budgets and database execution time. Public pages are cached in the service for 60 seconds (32-entry bounded cache), with exact period-start checking across UTC resets; status/name changes can take up to one minute to appear. Private reads are uncached.

## Interfaces

- Website `GET /api/leaderboard?period=day|week|month|all&page=0` returns period, page, pageSize, total, periodStart, calculatedAt and aggregate entries. Public cache policy is 60 seconds. Duplicate/unknown query fields and out-of-range pages fail.
- Website `GET /api/leaderboard/me` accepts the same selection and returns own position, its ordinal row and calculation time. Uses the HttpOnly player session; response is `no-store`.
- Backend `POST /internal/leaderboard` accepts `{period,page}` with the existing website service credential. `/internal/leaderboard/me` additionally requires the player bearer session. The website credential remains server-side.
- Migration `021_trainer_leaderboard.sql` adds two read indexes only. Existing migration bytes, awards, balances and battle state are unchanged.

The UI preserves the last successful public results during loading/errors and identifies when they belong to the previous selection. Tabs support arrow/Home/End navigation. The narrow-screen table scrolls within its panel without widening the page.

## Evidence and local commands

163 distinct automated checks pass: backend leaderboard/hosted/ranked regression 69; website leaderboard/auth/admin/marketplace 70 (66 existing plus four new leaderboard checks); inventory 24. Coverage includes UTC/leap/year boundaries, inclusive starts, cap behaviour, ties, 50-row pagination, private position outside a page, duplicate awards, mode/failure filtering, suspension, malformed replies, credentials and cache separation. One existing ranked fixture hit its two-clock recovery-deadline constraint during a concurrent run; the intended serial ranked run passed all 69 checks without changing that test or battle code.

Production Next.js and OpenNext builds pass. The Linux amd64 account image builds, imports the new modules without network access, and reports all 21 migrations. Desktop/mobile layout fixtures use the actual new component and production CSS, synthetic rankings and a Button style double. See `evidence/leaderboard/visual-check.json`, `desktop.png` and `mobile.png`; these do not claim an authenticated live-game check or real player scores.

Run `pnpm test:leaderboard` in `apps/website`; run `npm run test:leaderboard` in `Prototypes/player_economy`. The wider backend regression uses `--test-concurrency=1` for the existing ranked suite.

## Release status and next step

Implementation and release artifacts are prepared locally. The subsequent layout refinement keeps rank at the left and ranking XP at the right, with distinct gold/silver/bronze trophies. All four leaderboard tests and desktop/mobile layout fixtures pass after this refinement. Publishing is pending renewal of the expired AWS `evoverses` CLI login. The live website has not been changed for this feature.

After renewal: inspect the actual current ECS image/template and in-flight matches; reconcile only the five leaderboard module/composition/migration changes against that runtime. Review migration checksums against the live ledger; publish the source-only image, run explicit migration 021, then roll the account API while preserving its existing resources, settings and secret references. Publish the already-built Cloudflare site only after the backend is healthy. Verify public totals against trusted awards, private position/session protection, UTC tabs and both viewport sizes. No new infrastructure, secret, account grant or price change is required.
