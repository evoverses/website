# Beta game downloads

## Operator workflow

1. Sign in with an administrator account and open **Account administration → Manage game downloads** (`/beta-admin/downloads`).
2. Enter a release version and concise notes. Choose a Windows game ZIP (maximum 5 GiB).
3. Upload. The browser sends 16 MiB chunks; keep this tab open. The Retry button continues completed chunks in this tab. Reloading loses browser retry state: start a new upload. Cancel abandons an unfinished upload.
4. When the status is **Ready**, click **Publish** and confirm. This changes the download offered by Play Now. Upload completion alone does not publish anything.
5. Approved testers open **Play Now**, download, extract and sign in to the game using Epic. An empty bucket displays “No build available yet”.

## Architecture and access

- Private Standard R2 bucket `evoverses-beta-builds`, bound to the existing beta Worker as `GAME_BUILDS`. No public domain, r2.dev access, bucket CORS or additional storage API credentials are required.
- Game files use generated UUID paths. R2 stores upload records, verified part receipts, release pointers and publication audit entries separately from the account PostgreSQL database.
- Every admin request checks the current account-service administrator permission. POST requests require the website origin. Account administrators need not be approved beta testers to upload.
- Every download/HEAD/range request checks the current `/v1/game/access` response, including active session and beta approval. Download permission is not granted by knowing a file URL. All download responses are private/no-store.
- Downloads stream from R2; the Worker never buffers the complete ZIP. Range requests support resume. URLs pin the build ID so publishing a different version cannot mix files during a resumed download.
- Earlier published builds remain downloadable to approved testers and may be republished. Drafts are never available to testers.
- Revocation blocks new download requests; it cannot revoke a file already downloaded or a stream already authorised. The game must independently enforce account approval. Downloaded files can be redistributed.

## Upload integrity and costs

The server generates storage paths from a validated request UUID, fixes expected file/part sizes, checks ZIP signatures, hashes each part, and retrieves multipart completion receipts from R2 instead of trusting browser ETags. Identical retries reuse records; changed retries fail. Publishing uses an R2 conditional write against the expected previous release, avoiding silent concurrent replacement.

Chunk requests stay below the Cloudflare front-door body limit. Administrator authorisation can be rate limited: the UI retries transient 429/503 responses. Chunks are bounded in memory; the full game is never sent through a single Worker request.

Old complete builds are retained; no automatic destructive retention policy is enabled. Monitor R2 usage and remove obsolete builds through reviewed maintenance. At approximately 1.6 GB each, six builds are near the 10 GB-month free Standard storage allowance. Incomplete R2 multipart data uses R2's default expiry; cancelled record metadata remains for traceability. No game data has been imported as part of setup.

## Evidence and remaining checks

`apps/website/tests/player/downloads.test.cjs` covers access denial, origin restrictions, sizes/ranges, repeated start/completion, changed chunk rejection, incomplete publication, private ranged downloads, immediate denial after session revocation, stale publication and cancellation.

Production compilation and live anonymous restrictions are checked before rollout. A real 1.6 GB upload, download/resume and launch must be checked when the release ZIP is available. ZIP validation is a format check, not malware scanning or a code-signing guarantee. Build signing/checksums can be added to release tooling later.
