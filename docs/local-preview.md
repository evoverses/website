# Local website preview and repair log

## Current BETA update - 7 October 2026

With the genuine public Thirdweb client ID, Pro external-wallet connection now works even while the explicit local flag disables legacy wallet authentication. Account-menu controls consolidate connect/switch/disconnect. Local Epic sign-in and Stripe test purchases have been rehearsed; live payments remain disabled. The earlier disabled-wallet/purchase notes below describe historical stages. Production checks use `node scripts/check-beta-build.cjs`, which sets flags inside Windows Node and writes `.next-beta-check`; do not run an ordinary build against the active preview. Strict TypeScript now passes.

## 2026-10-06: Windows startup repair

Work is local on `Dan/website-player-accounts`, branched from `dan-dev`. No push, deployment, payment, AWS change or game change was performed.

### What broke and what changed

The checkout contained Linux native CSS packages, while the preview ran Windows Node. Added `lightningcss-win32-x64-msvc@1.30.1` and `@tailwindcss/oxide-win32-x64-msvc@4.1.8` inside ignored `node_modules`. Both downloaded archives matched the existing lockfile SHA-512 integrity values. Package versions and the lockfile did not change. Restarted only the identified website preview.

The earlier working preview supplied temporary Thirdweb settings in its launch command. They were not durable configuration. The local `.env.local` contained only public metadata/image URLs, so the restarted website failed while importing the wallet authentication module.

The ignored local `.env.local` now also contains:

```dotenv
NEXT_PUBLIC_THIRDWEB_AUTH_DOMAIN=localhost:3100
NEXT_PUBLIC_EVOVERSES_LOCAL_WALLET_PREVIEW=1
```

This explicit development UI mode lets you browse the existing Store, Nursery and sign-in page. The SDK receives the same public UI placeholder used by the earlier preview; it is not a genuine project credential. Wallet connection controls are disabled, wallet cookies are rejected, and both wallet login actions refuse to issue authentication credentials. No private keys or SDK secrets were invented or saved. The sign-in page explains the current preview status. Purchases remain disabled by the existing store integration boundary.

Preview mode only activates when `NODE_ENV=development` and the flag equals `1`. A production build ignores the flag and still requires genuine configured wallet settings. Normal configured wallet verification remains available. Auth clients are created lazily and cached, so rendering the signed-out preview does not require a signing key.

### Verification

- Windows Lightning CSS converted a real stylesheet; Oxide and Tailwind PostCSS loaded.
- Nineteen existing store pricing/payment tests passed.
- Five focused preview tests passed. They cover development-only activation, configured public-client preservation, rejection of existing cookies, refusal of login actions before credential access, and normal verifier delegation.
- Headless Edge loaded `/store`, `/nursery/bertha` and `/signin`: all HTTP 200, no browser exceptions, no broken images, Nunito styling present, Sign In disabled.
- A fabricated wallet cookie still redirects `/profile` to `/signin`.
- Full TypeScript checking reports six existing address-typing errors in the smart-wallet form and liquidity cards. An in-memory comparison against original HEAD source confirms the same six errors, with no additional errors from these changes.

### Running locally

From `apps/website`, use Windows Node and the pinned workspace package manager:

```powershell
pnpm dev --hostname 0.0.0.0 --port 3100
```

Open `http://localhost:3100/store` on the main machine. If dependencies are reinstalled, run the pinned Windows pnpm install with the existing lockfile so Windows optional packages are installed. A Linux-only dependency installation will reproduce the native-binary error when run with Windows Node.

The current LAN address is `192.168.1.20`, but LAN asset access also needs that host in Next's allowed development origins. The verified preview check used localhost. Epic's saved localhost callback is for the main machine; remote-machine sign-in is not verified.

### Next step

Implement website Epic sign-in/start/callback, player-session cookies, profile and sign-out against the existing reviewed local player service. This repair does not implement those routes, wallet linking, or NFT-account projection. Then test the same Epic user reaches the same game player, Evoros balance and ordinary inventory. Optional wallet linking must independently prove wallet control before NFT Evos are shown as linked to that player. Wallet authentication must not be substituted for a permanent game account.

## 2026-10-06: Pro mode display preference

Added a themed, accessible **Pro mode** switch at the far right of the top menu. It defaults to off and stores only `on`/`off` in browser local storage (`evoverses:pro-mode`). The preference survives refreshes and synchronises across tabs. If browser storage is unavailable, the switch still works for that page session.

- **Off:** hides Marketplace, Nursery, Liquidity, homepage Buy Evos, wallet controls and wallet sections in the account menu/profile. The Store remains visible with card pricing; EVO prices, discounts, payment controls and wallet balance stay hidden even if a wallet is already connected.
- **On:** reveals those features. Nursery stays immediately after Marketplace. EVO payment options additionally require a connected wallet, as before; card remains the default. Turning Pro mode off resets the Store payment selection to card.
- Bookmarked Marketplace, Nursery and Liquidity pages display a small panel inviting the user to enable Pro mode. The top-right switch remains available. Profile asset/liquidity routes use the same display gate, while existing authentication still applies independently.
- Switching modes does not connect or disconnect a wallet, sign a message, grant account permissions, or change transaction/contract checks. This client-side preference is not a security boundary; server-rendered data may still be fetched. Existing signed-in auto-connect behaviour is unchanged.
- Account Sign In remains available outside Pro mode, separately from Connect wallet. Website Epic account sign-in is still pending. The local sign-in page states this rather than attempting wallet login while Pro mode is off. Local UI preview wallet controls, including the direct Nursery and Store connectors, stay disabled.
- Desktop and mobile controls use the existing theme. Compact phone controls retain accessible names, preserve the logo, and wrap on narrow screens.

No game, contract, database, AWS, payment, GitHub or deployment changes were made for this preference. Work remains local on `Dan/website-player-accounts`.

Recommended next step remains the website Epic sign-in/session/profile/sign-out slice described above, using the existing local player service. Optional wallet linking and field encryption remain subsequent work; neither is implemented by this switch.

### Pro mode verification

- Local Edge checks passed for desktop and touch/mobile menus, default off, Nursery order, reload persistence, cross-tab synchronisation, bookmarked route gates, gate activation and 375px/320px toolbar sizing. No browser exceptions occurred.
- Rendered the actual Store component with simulated wallet state: Pro off with/without a wallet, Pro off after selecting EVO, Pro on without a wallet, and Pro on with a wallet. All five cases passed. EVO copy and quote requests appear only when Pro is on and a wallet is connected; switching off forces card display without disconnecting that wallet. These checks use SDK stubs and make no transactions or live wallet connections.
- Five existing local-preview authentication tests still pass. Type checking retains the six previously confirmed address-typing errors; no new errors were introduced by Pro mode.
- Manual check: open `/store`, toggle **Pro mode** at the far right, refresh, and open the mobile **Links** menu. Switch off while viewing `/nursery/bertha` to see its display gate. Local preview intentionally keeps wallet connections and purchases disabled.

## 2026-10-06: Website Epic connection and Arena sign-in

Implemented the local website Epic start/callback, explicit account confirmation, independent player cookie, shared player profile/inventory, Store sign-in display and backend session sign-out. Arena is the supplied image copied unchanged from the Windows shared-drive path. Existing game and contract sources are unchanged. Purchases remain disabled. See [website-player-accounts.md](website-player-accounts.md) for commands, security boundaries, detailed verification and the pending genuine Epic rehearsal.
