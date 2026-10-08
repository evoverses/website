# Game account inventory details

8 October 2026. Website `dan-dev`; local only.

Profile’s existing inventory reads the authenticated `/v1/player/inventory` account API. The nested generated Evo schema is now supported; the backend also preserves `E-...` serials and the non-breedable/null-generation flags that its game feed already uses. Authentication remains the existing verified Epic flow, with independent game/website sessions mapping to one player. No wallet is needed for these Evos.

Each generated Evo card shows its serial, level, remaining/max HP, nature/gender, current/level-100 stat projection, genetic ratings out of 50 and authored move unlock levels. Only currently unlocked starting moves are equipped. The level-100 figures use saved base stats, genes, training and nature; they do not award levels or promise future training. Packs use the existing 2/4/6 artwork and remain inventory items until opened. NFT details/ownership filtering continue separately under Pro mode.

`src/lib/player/inventory/evo.ts` validates supported fields and produces public details. `src/data/evo-progression.json` snapshots the game’s 43-species pack pool and 165 display move names from `DT_LegacyMoves`; update this display/validation snapshot when reviewed game learnsets change. It is not a second account database. Unsupported/invalid schema, locked IDs, duplicate IDs or malformed HP/genes fail closed. Private backend fields and strength-tier labels are omitted. Inventory reads are bounded to 192 KiB; other auth response bounds stay unchanged.

Use the existing website-owned local account launcher described in [Store service setup](game-store-local.md), then the game’s `Start-EpicAccountLocal.ps1 -Mode Account -ReuseWebsiteService` with the reviewed run folder. The service was restarted after expiry; sign in again with the same Epic account in both clients. Website preview is `http://localhost:3100`, bound to loopback. The game’s disposable **Try local preview** account is intentionally separate and will not populate the Epic account on the website. The existing real local account still has zero ordinary Evos; no grant/purchase/opening was made on it in this sprint.

Validation: 15 inventory tests (including real isolated PGlite pack-open/shared identity/session isolation and actual card rendering), 22 player-auth tests, strict TypeScript and isolated Next production build passed. Browser sign-in form/Origin/cookie/CSRF/forged-session/mobile checks passed with Epic navigation intercepted. No user login was automated, and no balance/roster in the working database was changed.

Next: open one local test pack after genuine game Epic login, refresh Profile, and compare saved IDs/HP/genes/moves. Chosen move/team persistence, XP settlement and real battle item effects remain separate work.
