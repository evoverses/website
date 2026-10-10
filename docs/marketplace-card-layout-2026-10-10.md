# Marketplace card layout and back navigation - 10 October 2026

## Change

- Added a keyboard-accessible Back button to asset details. Returns through browser history when a previous EvoVerses entry can be identified, retaining the listing/filter position. External or blank-tab history entries and unavailable history information fall back to `/marketplace/evos`, which includes Evos and eggs.
- Shared `EvoCard` now uses card-relative container units for the artwork position and size. The creature occupies a contained area above the information island, keeping its proportions.
- The information island is a smaller game-style polygon containing its own text, instead of a full-card transparent overlay independently positioned from the labels. Nature, stats and breed/egg details share that panel.
- Removed fixed artwork and egg-parent offsets and made icon spacing proportional. Applies to grid/compact/mosaic cards, item details, Nursery selectors and transaction previews using the shared component.
- Card data, ownership, trading and breeding rules are unchanged. Generated social-preview images use a separate renderer and are outside this visual change.

## Verification

Production Next/OpenNext build and headless checks cover desktop grid, compact grid, mosaic, desktop details and 390px mobile list/details. Measurements verify artwork/panel separation, text containment and matching proportional placement at different card widths. Back returned from an item to Marketplace. Screenshots and measurements are in `docs/evidence/marketplace/cards-*.png` and `card-layout-check.json`; `check-card-layout.cjs` can target a local build or public beta.

## Next step

Review the live visual proportions, then verify the delayed on-chain listings after indexer catch-up.

Published beta Worker version: `0c0b6df9-908a-478c-bb7b-5c643f48b0cb`. Live checks passed all six views, list-to-detail Back navigation, and keyboard-activated direct-link fallback even when browser history includes a blank tab. Temporary local visual-check server was stopped.

## Panel polish follow-up

Increased stat column gap from 2 to 3 card-width units and added 0.5 units between rows. The island now fits its content with 4 units of padding on each side, rather than occupying 72% of every card. Lowered it by 1 card-width unit, keeping the number bar clear. Typography and artwork proportions are retained. Published as `869a0f50-4a1f-40a5-8990-cb08dc7cae9b`; production builds and all six live size/layout checks pass, including text containment, side padding and number-label clearance. Screenshots and measurement evidence refreshed.

## Rounded lower-left panel and compact spacing

Replaced the clipped information island with a rounded rectangular panel anchored at the bottom left. Stats use three rows of two, with a full-width, unwrapped breed-count line and a subtle separator. The panel background is 70% opaque; text opacity stays unchanged. This resolves the narrow polygon edge around Total Breeds.

After visual feedback, reduced height from 44 to 31 card-width units (about 30%), keeping width at 40 and retaining font sizes. Tightened line height to 1.2, stat-row height to 4.5 units, row gap to 0.5 and vertical padding to 1.5. Bottom and left anchors are unchanged, keeping owner/number/generation details clear.

Published as `6baac3cb-4cdb-4e2c-af74-cc007688f1a7`. Production Next/OpenNext builds and six live desktop/mobile checks pass, including stat-grid structure, text containment, artwork separation, number clearance and Back navigation. Screenshots and measured evidence refreshed. Recommended next step: user review of the compact panel.

## Frame-bar alignment follow-up

Measured the existing 542×768 frame image. Moved the panel right to a 9.61% card-width inset, placing equal gaps between the panel, inner border and generation-bar tip. Its bottom now matches the generation bar at 9.58 card-width units above the card bottom. Panel dimensions, fonts and 70% background opacity are retained.

Species, level, token number and generation labels now occupy proportional-height bar containers with flex vertical centring and explicit line height. Centred owner text within the bottom frame strip too. Published as `5ddae49c-24d8-4ce6-8c1c-e3c862e05fa7`. Production builds and all six live desktop/mobile checks pass, including panel/generation bottom alignment. Screenshots and measured bar bounds refreshed. Recommended next step: review the final alignment on beta.

## Evo artwork centring follow-up

Moved artwork down from 15 to 27 card-width units, centring it in the open space between the upper frame labels and compact stats panel. Its size and horizontal alignment are unchanged. Shared placement applies to list and detail cards.

Published beta version `34bf350c-f8aa-4f2a-89f5-e04c4247430d`. Production Next/OpenNext builds and six local and live desktop/mobile layout checks pass, including artwork/panel separation, text containment, frame alignment and Back navigation. Screenshots refreshed. Recommended next step: user visual review on beta.

## Current-level HP on cards

Replaced the fixed 50 HP in shared on-page and share-image card renderers with species/XP-derived HP at the current level. This is maximum HP at that level, not remaining HP after damage, as clarified by the user. Unknown/invalid species or XP show an em dash rather than fabricated health. Other displayed genetic ratings are unchanged.

`packages/evoverses/src/lib/asset/health.ts` contains the shared integer HP interpolation and a compact projection of the authored progression catalogue (species base HP and maximum XP). The account inventory projection reuses that interpolation. `check-card-health.cjs` checks catalogue parity for 68 species, all 100 levels, immediately-before-unlock boundaries and unavailable inputs; rerun it when progression data changes. Existing card level XP tables also match all 68 catalogue entries.

Production builds pass. Six local and live card-layout views pass with an explicit Krokon #4503 L1 HP=25 assertion; screenshots refreshed. Published Worker `b755ef5a-a04f-480a-a0df-57e6c6f65a67`. No database records or game rules changed. Recommended next step: visual check of current-level HP on beta.
