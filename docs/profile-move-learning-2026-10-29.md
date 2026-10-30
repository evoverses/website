# Profile move-learning repair - 29 October 2026

## Finding

Signing in with Epic reached Profile, where inventory rendering threw `Invalid unlocked combat move`. The website discarded `combat.learning` and validated every move against the original automatic species/level unlocks. The game and account service now use versioned choices and each Evo's persisted learned collection.

The legacy `evo-progression.json` files already match between the game and website. Replacing that file with earlier unlock levels would incorrectly auto-learn eligible choices and break retained legacy cohorts. The active v2 catalogue contains 3,072 earlier or additional candidate entries across all 68 species. Eligibility does not imply that an Evo learned a move.

Authoritative v2 source: `Content/Store/Data/move-learning-v2.json`, SHA256 `69d23cbb083c6354ec0c9e5fcd4320818430312d1ac451c3d4203d00596b64ff`. This matches the game's recorded beta 0.03 activation. The website also retains the v1 catalogue for existing enrolled Evos.

## Repair

- Retain and validate the authenticated combat response's catalogue version and learned IDs, including resource identity and exact correspondence with PP records.
- Project learned names, equipped state, HP, PP, and recovery from saved combat data for ordinary and NFT Evos. Species compatibility is checked against the Evo's pinned catalogue.
- Keep unlearned names and PP hidden. Choice levels describe eligibility; they do not automatically unlock moves. Cards distinguish learned moves, future choices, and choices made in the game.
- Use current combat XP for ordinary profiles as well as NFTs. Birth stats remain immutable.
- Contain a projection mismatch to the affected Evo's card, with an unavailable message. Keep its holding and other valid cards visible. Never display invalid data as verified combat state.
- Generate a display-only snapshot from the game's immutable catalogues. The sync checker verifies source digests, the projection digest, and parity of legacy progression. It makes no database or account changes.

## Keeping releases aligned

From the website repository root:

```powershell
node apps/website/scripts/sync-move-learning.cjs D:\documents\GitHub\evoverses
node apps/website/scripts/sync-move-learning.cjs --check D:\documents\GitHub\evoverses
```

Run the check as part of a move-catalogue release. New catalogue versions need explicit parser support and regression coverage; do not silently replace the meaning of an existing version.

## Verification

- Reproduced the reported failure before the repair.
- Full website TypeScript check: no diagnostics.
- Inventory suite: 32 passing tests. One existing TCP integration test is blocked by this execution environment (`connect EACCES 127.0.0.1`), and fails unchanged before the repair.
- Added an in-process integration test using the real account service, active v2 learning, SQL, pack opening, and account reader. It checks shared Epic identity, account isolation, starter collections, and preservation of depleted HP/PP without requiring a TCP connection.
- Checked v1 and v2 across all 68 species at levels 1, 5, 20, 35, 50, 65, 80, and 100. Eligible but unlearned moves stay hidden.
- Rendered the actual inventory card and checked learned starter names, choice labels, hidden future names, zero HP/PP, and the unavailable state. NFT endpoint coverage includes a valid and invalid card in the same response.
- The original legacy unlock, XP, wallet ownership, request-origin, and malformed-state checks remain covered.

To run the suite with an explicit game checkout:

```powershell
$env:EVOVERSES_ACCOUNT_TEST_REPO='D:\documents\GitHub\evoverses'
node apps/website/scripts/test-inventory.cjs
```

In a sandbox that blocks local TCP, run the remaining checks explicitly with `--test-skip-pattern='same Epic identity in game and website'`. This exclusion is not the suite default.

## Release and rollback

This is a website-only repair. It requires no backend migration, account reset, move reassignment, or game release. Deploy the reviewed website source through its existing release process, then verify Epic callback/Profile, learned move cards, NFT inventory, and depleted HP/PP on the hosted site. Hosted validation remains outstanding.

Rollback is a website redeployment of the previous retained version. Account state is untouched, although the old website will again reject affected choice-based rosters.
