# Optional local game Store on the account service

8 October 2026. Local only; no hosted deployment or live payment activation.

`player-accounts-local.cjs` can compose the sibling game's authenticated Store routes into the already owned account API. The feature is disabled by default and enabled explicitly with `EVOVERSES_LOCAL_GAME_STORE=1` in ignored local configuration. It uses the same player sessions and database as the website; it does not open a second database instance. It preserves the existing Stripe sandbox and encrypted wallet-link adapters.

Before the first additive schema 004 migration, the helper writes a gzip database snapshot into the owned run folder as `GameStoreBeforeSchema004-<time>.tar.gz`. Backup failure or a partial schema prevents activation. Tests restored that snapshot and proved the pre-migration account tables are intact. These files contain private account data and remain under the game's ignored Saved directory; never commit them. Repeated startup installs the same catalogue without another migration or duplicate starter grants.

The current game catalogue has 54 items plus 2/4/6 packs, costing 600/1100/1600 Evoros. Pack openings and new-account starter grants are handled by the sibling backend. Existing accounts are not backfilled. The game displays all Evos consistently; wallet distinctions remain website-only. Item effects, trusted battle results and XP are separate work.

Prerequisite: the current local `Dan/beta-account-bridge` checkout with `local-game-store.cjs`, schema 004 and Store data. This optional feature does not make game code part of the website repository. The website build remains independent and the feature stays disabled on machines without its local flag.

From `apps/website` in PowerShell, after configuring the explicit local flag:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-player-accounts-local.ps1 -Mode Stop
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-player-accounts-local.ps1 -Mode Start
```

The ownership-checked launcher starts/stops only its account service. It closes after two hours. Use the game's existing `Start-EpicAccountLocal.ps1 -Mode Account -ReuseWebsiteService -RunRoot <reviewed owned folder>` to reuse the running API; do not start a second owner of the same database. Genuine Epic sign-in remains a user action.

Validation: the final selected website regression passed **93 tests**. `test:game-store:local` has two tests covering disabled/invalid ownership, real backup/restore, preserved accounts and repeat startup. The sibling backend additionally checks atomic purchases, openings, new-account grants, saved-roll persistence and PostgreSQL concurrency. Runtime activation on Dan's reviewed local database preserved 1 player, 1 identity, 10,500 Evoros and 0 ordinary Evos, wrote a 4,358,724-byte pre-migration snapshot and registered Store routes; anonymous requests return 401. Fresh genuine Epic purchase testing is still pending.
