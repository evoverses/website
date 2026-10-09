# Inventory move unlock visibility

Initial implementation snapshot, 9 October 2026, `dan-dev`. Prepared for GitHub sync; no deployment.

All account and NFT Evo cards show only **New move unlocks at level X** until the Evo reaches that level. Locked names and PP are omitted from the shared Stats and Moves hover/focus/tap panel, and masked in the details model. Unlocked names, equipped state and verified PP continue to display normally. Existing fonts, card layout and responsive panel behavior are retained.

The 68-species website reference matches the original game table and species assets. Twenty-five species genuinely have their final authored unlock at or below level 50; 43 have later unlocks. The page was not truncating the lists. No move schedule, XP, genetics or stat formula changed.

Valid Corrupt/Ether move IDs above 10,000 no longer cause the website combat parser to reject verified HP/PP. It accepts positive int32 IDs and still rejects malformed numbers, invalid PP, wrong identities and locked combat moves.

Full source comparison, per-species levels and the separate 35-ability native migration backlog: [game audit](../../evoverses-beta-account-bridge/Documentation/website-move-learnset-audit.md). Legacy implementations exist, but those missing native abilities are not certified playable by this website change. Higher-level account projection remains a release risk until their combat definitions and implementations are ported.

Validation: all **19 inventory tests passed**, and the full website TypeScript check passed. `node apps/website/scripts/test-inventory.cjs` checks rendered cards, locked-name/PP omission, unlock boundaries, all 68 authored lists including levels above 50, and high move-ID HP/PP. Tests use disposable fixtures; no real inventory, balance or account database is changed.

**Next:** complete native move migration in tested groups before broader high-level battle acceptance. Adding later moves to the shorter authored lists requires a separate balance decision. Hosting remains paused.

For the current website checks and hosted release requirements, see [Vercel preview readiness](vercel-preview-readiness.md). The native migration backlog above records the separate game audit at that earlier sprint; this website push does not certify or publish subsequent game work.
