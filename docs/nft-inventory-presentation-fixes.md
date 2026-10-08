# NFT inventory presentation and compact website cards

8 October 2026. Related local branches: game `Dan/beta-account-bridge`, website `dan-dev`. No push, deployment, live purchase or account balance/HP edit.

## Problems and repairs

- The NFT account DTO previously carried only species, XP and identity. Native presentation therefore left current HP at zero and omitted genetic traits. The move-editor filter applied only to generated pack Evos. These were presentation gaps, not evidence of recent battles.
- Ownership-checked NFT metadata now supplies a bounded typed trait projection to both website cards and the native account adapter. The strict bridge strips unsupported metadata/private fields and never sends full wallet addresses or combat permissions. Transfer/unlink rechecks remain in place.
- NFT presentation uses the same 50 HP starting rule as pack Evos when no current HP field exists. An explicitly recorded `currentHealth: 0` stays zero. The existing metadata schema does not store combat HP, training points or equipped moves: zero training and no claimed equipped moves are used for this display projection. **This is not persistent NFT battle damage/recovery integration.** The recovery service must provide authoritative current HP once connected to real battle outcomes.
- Levels come from saved XP and the existing species cubic XP thresholds. Current/level-100 stat projections use authored base stats, genetic ratings and nature effects. Existing generated pack Evos remain level one. Demo combat normalization is unchanged. No XP is awarded here.
- The web reference table now includes 68 configured species: the 43 pack species plus 25 retained NFT species, including Kitsul and Carcoid. Authored stats and learnsets were read without saving game assets. Unconfigured species or malformed metadata show an incomplete-metadata notice rather than invented stats. NFT metadata has five genetic ratings; a Health gene is not invented or displayed.
- Website NFT cards receive the same **Stats and moves** disclosure as other Evos, including available/locked move levels. Native linked Evo editors, add/replace/save paths also enforce the authored level limits. Linked display objects keep `TokenId = 0` and a separate canonical inventory GUID; these traits do not grant gameplay admission. Move choices are still local pending server-side persistence.
- The History placeholder repair handles nested CommonButton/TabButton controls, sets their hover captions consistently, and allows account navigation installation when the menu existed before account projection. The check still confirms the History screen is empty before repurposing it. Source caption and full CommonUI hover hooks are updated.
- Store retains only the last verified balance during a same-session authenticated refresh. Inventory/ownership snapshots still clear immediately; buying is disabled during refresh. Account replacement, logout, rejection and expiry clear the cached display. The menu view model uses the same balance source so it cannot briefly bind zero during a successful refresh.
- Website item cards use a denser grid (four columns on medium screens, eight on wide screens), 56px artwork and a short image area. Evo artwork is two thirds of the previous width/height, with a shorter image area. Stats font classes are unchanged. These sizes apply to consolidated account inventory; Store Evoros bundle artwork is unchanged.

## Validation

- UE 5.5 editor build passed. 48 native tests passed, zero failures or warning tests. New coverage includes NFT traits/50 HP, explicit zero HP, no token authority, level-seven unlocks, delayed balance refresh and exact expiry. Inventory remains cleared during pending refresh.
- Store render/purchase/open/team/logout check passed with 24 screenshots in `Saved/GameStoreLocal-f15ab2bd60cf47048b41140cac2a34b8`. The inspected screenshot shows **Team Roster** in the replacement tooltip. This is an isolated synthetic account, not a login to the user's Epic account.
- Website inventory: 16 passed; shared NFT feed/team proof: 8 passed. Backend linked inventory/store/auth/account HTTP: 64 passed. Tests cover typed metadata, missing/malformed traits, explicit zero HP, authenticated ownership checks and existing transfer/unlink guards.
- Strict TypeScript and isolated Next production build passed. Existing repository lint/compiler warnings remain; no new engine asset or animation changes are part of this sprint.
- An intermediate compile exposed a test-only `TSharedRef.Reset` misuse and was corrected. The first feed check exposed the missing Kitsul reference data; the retained NFT assets were read and the final eight-test feed suite passed. Intermediate failed checks are not counted as passes.

## Local preview and meeting constraint

The owned game window was closed for the DLL rebuild before the meeting request. It stays closed; no game window or new visual browser is opened during the meeting. Website code hot-reloads; the already-running account service caches its compiled NFT reader, so it must be restarted with its ownership-checked launcher before the live local game receives the new traits. This restart signs out local test sessions and does not alter balances/items/creatures. Reopen the game only when the user is ready.

**Recommended next step:** after the meeting, restart the owned account preview, sign into the same Epic account in game and website, and compare one NFT's HP/stats/unlock levels plus one item purchase. Then persist team/move choices and connect authoritative battle HP/recovery before enabling trusted combat.


## Local account preview resumed - 8 October 2026

Following the user's “carry on”, stopped only the owned website account service through its ownership-checked launcher. After confirmed database closure, copied the database to an ignored `Saved/.../Backups/before-nft-reader-restart-*` directory before restarting. The new service loaded the updated NFT progression reader, including all 68 configured species and Kitsul/Carcoid. Verified that player/identity counts, the 9,750-Evoros aggregate balance and two saved ordinary Evos were unchanged. No account or inventory grants were made. Local sessions were revoked as designed during restart.

Website `/signin` returned HTTP 200. Anonymous website account and game-inventory reads returned HTTP 401. Reopened the owned game against this same service and verified both owned processes are running. No other game/editor or animation process was stopped. The account service still closes after two hours.

**Next step:** the user signs in with Epic in the game and website Profile to compare one NFT's HP/stats/locked moves, the Team Roster tooltip and item-card sizes, then makes one local item purchase to check balance retention. Automated authentication or a successful real-account visual check is not claimed. No push or deployment.


## Responsive inventory and floating details - 8 October 2026

- Moved linked wallets above consolidated inventory in Pro mode. Normal mode hides wallet/NFT content.
- Named container queries adapt to the actual inventory panel width. Evo cards have an effective 176px minimum; two item cards and their 12px gap match one Evo card. The densest item cell is 82px. The grid falls to fewer columns on narrower panels rather than compressing further. Filter controls wrap at a 160px minimum. At 1440px, cards measure 183px for Evos and 85.5px for items, compared with the previous 280.5px four-column Evo layout.
- Replaced Stats and Moves dropdowns with one floating disclosure at a time. The panel is up to 640px wide, stays 16px inside viewport edges and uses two content columns where space permits, one on narrow screens. Battle stats show labelled Now and Level 100 columns; genetics and move unlocks have separate sections. The existing 12px stat font and values are unchanged. Both ordinary and NFT Evos use this component.
- Hover, keyboard focus or tap opens the panel. A short leave delay allows the pointer to enter it without closing; focused content remains readable. Escape and outside interactions dismiss it. It does not steal or restore focus on hover, avoiding the focus-triggered reopening found during browser checks. A shared active-row ID prevents two panels remaining open together. Long lists scroll inside the available vertical space.

Validation: 16 inventory tests passed, strict TypeScript and the isolated production build passed (existing repository lint warnings remain). The headless Edge fixture used actual Profile/Inventory, shared Input/Button and Radix Popover components with production CSS and synthetic account/query/wallet data. Nine viewport widths from 320px to 1440px passed card alignment, minimum-width filter wrapping, wallet ordering and horizontal-overflow checks. Four widths passed panel edge/column checks; keyboard focus, tap, Escape, outside click and normal-mode hiding passed. No real Epic session, wallet proof or network request was used in this visual fixture. [Measured results](evidence/inventory-responsive-2026-10-08/website-layout.json), [wide panel](evidence/inventory-responsive-2026-10-08/hover-1440.png), [narrow panel](evidence/inventory-responsive-2026-10-08/hover-320.png).

Local only, on website `dan-dev`. No push, payment activation, AWS operation, account grant or database migration. The game counterpart adds immediate inventory compaction, fixes the premature one-move full-loadout flag and provides EOS Friends beside Play; live friends/overlay and invitation acceptance still need human/integration checks. The game window remains closed after its rebuild; the existing shared account service was confirmed running and left unchanged.

**Recommended next step:** review Profile at full and narrow widths and sign in freshly with Epic to verify Friends consent/list. Then persist selected teams and equipped moves to the authenticated local account before connecting trusted friend battles.


## Local preview recovery and Friends window - 8 October 2026

The user reported Profile not responding and requested the game. Both anonymous `/signin` and `/profile` requests to the existing Turbopack preview timed out after 25 seconds; `/api/player/me` still correctly denied anonymous requests. Verified the exact listener PID, creation time, parent and repository before stopping only that preview. Restarted Next with the standard compiler, retaining loopback port 3100. The account/database service and other game/animation processes were preserved. The first sign-in request took about 75 seconds; `/profile` returned its expected unauthenticated redirect. The existing headless browser check then passed actual Epic form navigation (intercepted before Epic), Origin/CSRF/cookie protection, forged-session rejection and mobile layout. No real user session/cookie or credential was read, and no Epic login was automated. A logged-in Profile still needs the user's refresh/check.

Reopened the owned game in Account mode on `Dan/beta-account-bridge`, reusing the existing shared account service. Verified both owned processes and the game readiness marker. Friends is accessible beside Play after Epic sign-in; live list/overlay and developer permissions remain human checks. No database migration/grant, source change, push or deployment. The standard preview launcher ownership/log records are ignored under `apps/website/node_modules/.beta-preview`.

**Next check:** fresh Epic sign-in and actual Friends list, plus authenticated website Profile. The next implementation remains account-backed team/move persistence.
