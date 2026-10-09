# Local Store item combat-state integration

Initial implementation snapshot, 9 October 2026, `dan-dev`; hosting remains paused. The paragraphs below record that earlier sprint, not the final deployment readiness state.

The owned account bootstrap can opt into the game repository's `EvoCombatState` service after a verified local backup and additive schema 007. The working service/database was not restarted/migrated in this sprint. Existing bought item quantities, catalogue revisions, Stripe flows, balances, encrypted wallet links and Epic login remain intact.

Website ordinary/NFT Evo details overlay authoritative HP, equipped PP, recovery deadline and state version. NFT combat metadata can be requested by identity beyond the first inventory page; current chain ownership and wallet links are independently verified. Failed combat reads preserve owned cards, show unavailable HP/PP and never fabricate full health.

Validation: 17 inventory tests, 6 linked game-feed tests and TypeScript no-emit check passed. No human visual/login check or deployment is claimed. The game repository's `Documentation/store-item-integration.md` contains the full evidence and acceptance gates. Next is trusted match admission/game transport/shared HUD, with PvBot first, then normal EOS P2P and ranked-path verification.

## GitHub sync assessment

The current website/bootstrap also includes casual item consumption and variable HP support through the companion backend. PvBot and Friendly use battle copies and save item deduction only; persistent combat state and 12-hour recovery apply to ranked. The separate backend changes remain local and are not included in this website push. Current validation and hosted blockers are recorded in [Vercel preview readiness](vercel-preview-readiness.md); this supersedes the earlier next-step recommendation above.
