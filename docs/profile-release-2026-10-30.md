# Website Profile repair - 30 October 2026

The signed-in production Profile displayed `Invalid unlocked combat move`.
Merged PR #121 (`98f2a4e`) retains the account service's versioned learned
move collection instead of treating every eligible move as automatically learned.
It preserves current XP, HP, PP and recovery state, and isolates an inconsistent
Evo to its own card.

The isolated release branch is `codex/website-profile-release-20261030`.
Source checkpoint `6c61a8d63d43dc0b0740c2cf35b18332e4d53ffb` combines the merged
repair with the exact nursery and marketplace files from the retained production
release source. The preservation manifest is
`evidence/profile-release-baseline-20261030.json`. Unfinished nursery/mainnet work
in the shared checkout is excluded.

Previous production Worker version:
`ea431f6a-09ac-42ae-8b5d-3956815f58c7`. The production configuration matches that
release apart from local bundle/asset paths. Deployment preserves existing
variables and encrypted secrets with `--keep-vars`.

## Verification

- 33 inventory tests passed, including the real local account service and SQL.
- 83 nursery, marketplace and nursery security tests passed.
- 35 stale-cookie and leaderboard tests passed.
- Both v1/v2 move catalogue snapshots match the current game source.
- The Windows production build passed but its adapted Worker failed a local
  middleware-path check; it is excluded from deployment.
- The release is rebuilt on Linux using the same pinned Next.js 15.5.27,
  OpenNext 1.20.10 and React 19.1.9 dependencies.

OpenNext's two-year Next.js support check now rejects the existing Next.js 15
pin. Packaging uses its explicit `--dangerouslyUseUnsupportedNextVersion`
option for this focused repair. A framework support upgrade remains separate
work; no dependency version was changed here.

The subsequent authorised upgrade is recorded in
`next16-upgrade-2026-10-30.md`. It also corrects the old adapter's support cutoff:
Next.js extended version 15 maintenance security support through 31 January 2027.

## Authority and scope

The user authorised renewing a limited Cloudflare login and deploying this fix.
The login is restricted to the EvoVerses account with user/account/zone read,
Worker/script/route write, and offline refresh permissions. No database,
account-state, contract, payment, game-server or Epic release changes are part
of this rollout. The beta Worker is not part of this production rollout.

## Rollout

Production Worker `a68628cf-c434-409a-96ca-75fd24a8907f` serves 100% of traffic.
The user can open <https://evoverses.com/profile> to use the repair.

The Linux bundle passed its dry run, ten Worker checks and twelve stale-cookie
page checks. Thirteen live HTTP checks passed after deployment. The live Profile
JavaScript asset matches the tested release's SHA-256.

I reloaded the existing authenticated Chrome session that showed the crash.
Profile displayed DanMancs, 4,250 Evoros, 28 trainer XP, six item types and four
account Evos. Loading the next NFT page displayed all 49 NFT holdings. The single
Dawnbrew Elixir card shows quantity two. I opened the Droserace account card and
Ainepolux #664 NFT card and checked their four learned starter names and PP.
Both cards display future choices without revealing unlearned names.

The hosted read confirms rendering and saved inventory access. I did not repeat
the OAuth login flow, create a depleted-HP/PP scenario on the live account or
submit a wallet transaction. The regression suite covers depleted HP/PP without
changing account state.

The release artifacts, logs, screenshot and deployment receipts are retained in
`release-linux-20261030/`. Rollback uses the previous Worker version above; the
old website will again reject affected move-choice rosters.
