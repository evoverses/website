# Profile inventory fixes - 17 October 2026

Deployed to https://beta.evoverses.com as Worker `abc543be-2961-4caf-9073-fa2c9f54b8e5`, preserving the existing PvBot and Overall leaderboard release.

- Removed the forced Profile content scrollbar. The document continues to scroll normally, with no extra static track.
- Display one inventory card per product and sum its positive-quantity revision stacks. Two Dawnbrew Elixir stacks of one display as one card with quantity two. Item-type counts and quantity sorting use the combined rows; distinct products remain separate. Stored inventory is unchanged.

Validation: 25 inventory tests and 31 leaderboard tests pass; TypeScript, production Next/OpenNext build and Worker dry run pass. Synthetic desktop (1920px) and mobile (390px) browser checks confirm one quantity-two potion card, normal document scrolling and no horizontal overflow. Public home, sign-in, Store and both leaderboard pages return 200; anonymous Profile redirects to sign-in and inventory reads return 401. Both deployed Profile assets match the release SHA-256 hashes. Signed-in real-account acceptance was not automated.

The source, test and release receipt are staged in the shared website checkout for the combined Git push. No separate push was made. Deployment details: [receipt](evidence/profile-inventory-2026-10-17.json). Previous compatible Worker for rollback: `d291f1bf-62b0-48f8-b0b7-7ee6db877d03`.
