# Local wallet account links

Updated 7 October 2026. Website branch: `dan-dev`. Local feature only; not deployed or pushed by this sprint.

## Player behaviour

Sign in with Epic, enable Pro mode and open Profile. The wallet section distinguishes the connected wallet from the wallets saved against the trainer. Connect a wallet through the existing account menu, then choose **Link wallet to my account** and sign the ownership message. This is a message signature, not a transaction, spending approval or asset transfer.

A trainer can link multiple wallets. Family members can independently sign for the same shared wallet and link it to their own trainers. A new link does not remove another trainer's link. **Unlink wallet** requires a separate confirmation and removes only the signed-in trainer's selected association. Disconnecting, switching wallets, signing out or disabling Pro mode does not delete saved links. Addresses are shortened in the UI. Non-Pro players see none of these wallet controls.

Existing ordinary Evos, item inventory, Evoros, player XP, Nursery contracts and wallet holdings are unaffected. Linking establishes an account association only. The game does not yet receive NFT Evos or gameplay permissions through it.

## Ownership and privacy controls

- Epic player sessions remain authoritative. The browser cannot choose a player ID, session token or recipient; the website obtains the session from its HttpOnly cookie and the account backend validates it again.
- The account service generates a five-minute, single-use ERC-4361 message scoped to `http://localhost:3100/profile`, C-Chain 43114 and an opaque request ID. Its nonce and request are bound to the authenticated player and exact session. The message contains no Epic subject or player ID. See [ERC-4361](https://eips.ethereum.org/EIPS/eip-4361).
- The backend verifies an actual EOA/ERC-191 signature against its own reconstructed message, then rechecks session, request and expiry under transaction locks before saving. Signature replay, another account/session, altered messages, expired/replaced requests and revoked sessions fail closed. An unverified address is never linked.
- Linked and pending-challenge wallet addresses use AES-256-GCM with fresh IVs and authenticated context binding purpose, player, record ID and chain. Separate derived keys encrypt addresses and HMAC normalized addresses for private duplicate lookup. Database uniqueness is `(player_id, address_fingerprint)`, allowing shared wallets. No full wallet address or signature is stored in the audit log.
- The local master key is server-only in ignored `.env.local`. A stored verifier binds it to this database: replacing it accidentally fails startup instead of creating incompatible associations. Losing the key means encrypted addresses cannot be recovered; key rotation and hosted secret management are not implemented. The user approved a local wallet-key exception to the unavailable AWS secrets skill; AWS rules still apply to AWS secrets.
- This encrypts wallet-address fields, not all existing account data. The trusted running service can decrypt them. Provider identity storage, process compromise, and the publicly visible blockchain remain separate concerns.
- Only existing external EOA wallets are supported in this slice. Smart-contract wallet signature verification and delegated recovery are not implemented. Ownership signatures do not grant custody of assets.

## Implementation and local setup

The website-owned account service reuses the existing game account modules and owns the only database connection. `scripts/wallet-link/schema.sql` adds wallet links, challenges, append-only audit, key verifier and a migration marker within a transaction. It does not change existing tables, provider mappings or game source. `core.cjs` supplies authenticated operations; `bridge.cjs` exposes a credential-protected loopback-only internal service, independently of Stripe configuration.

`POST /api/player/wallet` accepts `status`, `challenge`, `verify` and `unlink`. Exact `localhost:3100` Host and Origin are required; Next's internal bind URL may use `0.0.0.0`. Bodies, connection count, concurrency and request rates are bounded. Results are uncached, errors are sanitized and replies contain shortened addresses only. Status polling refreshes visible links every 15 seconds. Unlink uses the current record ID so an old browser cannot remove a replacement link. The prototype permits up to 50 wallets per trainer.

From `D:\documents\GitHub\evoverses-website\apps\website`:

```powershell
node scripts/prepare-wallet-link-local.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-player-accounts-local.ps1 -Mode Stop
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-player-accounts-local.ps1
```

The preparation script confirms `.env.local` is ignored, preserves an existing key and creates one only if absent. It enables `EVOVERSES_LOCAL_WALLET_LINKING=1`; no key is printed. The bridge credential is independently derived at runtime. The launcher closes/reopens only its owned account service; restarting revokes local sessions, so sign in again. Next's development environment watcher reloads the changed local configuration. If the website was stopped, use its documented port-3100 development command. The account service still closes after two hours.

## Validation and work log

- Added SQL-backed tests in a separate temporary PGlite database, using actual generated EOA signatures and the shared account/economy modules. They cover encryption, key mismatch, persistence/reopen, sharing, per-account unlink, concurrency, proof rejection, replay, rollback after audit failure, private bridge access and unchanged fixture inventory/balance. These are fixture players, not genuine Epic logins or a public hosting concurrency rehearsal.
- Added website handler tests for exact origin/Host, Next's bind URL, session-cookie rejection, body/field restrictions, sanitized replies and safe error responses. The initial migration test exposed PGlite's restriction on multiple prepared statements; migration now executes each static SQL statement in the same transaction. Input validation was made consistently asynchronous.
- Early implementation used automatic reassignment; the user's later decision superseded it. Final behaviour is shared links with exclusive use of each Evo required before NFT gameplay. No automatic removal from another trainer remains.
- Configured the ignored local encryption key and restarted the ownership-checked account service. The wallet bridge reports ready; existing aggregate state remains one player and **10,500 Evoros**. The first HTTP check exposed Next's internal `0.0.0.0` URL: corrected the guard while preserving exact localhost Host/Origin checks. The running route now rejects an invalid session with HTTP 401.
- Final validation: **17 wallet tests and 21 existing player/account tests passed**; strict TypeScript and the isolated production build passed, generating all 27 static pages. Targeted lint reported zero errors with legacy environment warnings; the new wallet environment names are declared in Turbo development configuration. Running endpoint checks reject anonymous/invalid sessions (401) and hostile Origins (403).
- The user confirmed **two wallets linked** through the genuine local UI after the feature was enabled. This is user-confirmed browser evidence; no wallet was signed or linked by automation. Genuine unlinking and a family member’s shared-wallet flow remain manual checks; their backend behaviour is covered by the fixture tests.

Run `pnpm test:wallet:local`; this requires the documented sibling account backend or `EVOVERSES_ACCOUNT_TEST_DIR`, like the SQL payment tests. `pnpm test:player` verifies the existing Epic/account flow. Final test/type/lint results are recorded in the root README.

## Next sprint and NFT gameplay gate

The website now has a session-protected internal wallet projection and a consolidated inventory that combines all verified linked wallets, checks current collection ownership and returns shortened wallet labels only. See [consolidated inventory](consolidated-inventory.md). The user confirmed two genuine links; the consolidated browser view and unlink behaviour still need their visual check. The next game slice should expose a trusted inventory projection through the account service, without asking players to enter wallet addresses again. The website projection is a read-only display, not game admission.

Before enabling NFT gameplay, implement server-authoritative reservations keyed by **chain + collection + token ID**, shared across all linked trainers and wallets. Validate the authenticated player, current link and on-chain ownership before admitting an Evo to a match. A second match using the same Evo must be rejected; different Evos from a shared wallet may be used concurrently. Reservations require atomic acquisition, expiring leases, trusted match lifecycle/renewal, crash recovery and revalidation after unlink or ownership change. Client-side checks or a local wallet preference cannot enforce this. Evo XP must follow the NFT identity, while player XP remains on the trainer.

No reservation or NFT game endpoint is implemented by wallet linking. Future gameplay authorization must fail closed if the association, ownership or reservation cannot be verified. Production also needs TLS, reviewed service authorization, durable hosted storage, key custody/rotation, recovery and separate release approval.
