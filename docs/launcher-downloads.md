# Public Windows installer and updates

The owner requested public installer/update downloads on 16 October 2026. Game
account login, admission, Epic sandbox/release settings, starter funds and
payments are separate systems; this adapter changes no account permissions.

The beta Worker wraps the existing download worker with launcher-worker.ts.
Published EXE and update files are public, with GET/HEAD/Range, pinned ETags,
fixed-length streaming and no content transformation. Existing ZIP routes keep
their original policy. No public bucket or new storage credential is required.
The public key in wrangler.beta.jsonc must match the launcher's embedded key.
Only master administrators can access /api/launcher/admin. Open that URL while
signed in, choose the Upload folder produced by the game's
New-BetaInstallerUpload.ps1, upload it, then select Publish explicitly. The
normal /download page offers the current setup EXE after publication.

The signed manifest is verified before draft creation. Every small file is
hashed before storage. Large files use 16 MiB multipart uploads, persisted
receipts, retry protection and a final native streaming SHA-256 check. A failed
checksum discards its upload so it can be retried. Publication verifies all
receipt ETags/sizes and uses a conditional latest pointer; files are installed
locally only after the launcher verifies its own trusted signature and hashes.
No private key is uploaded. The public verification key alone cannot sign updates.

Keep older released objects for interrupted updates and rollback. No automatic
deletion or storage retention rule is introduced. Return to an older signed
release by uploading that same prepared folder and publishing it again. Never
reuse a release ID for different bytes. Root bootstrap changes still need a new
setup installer, as documented in the game repository.

Tests: node --test tests/player/launcher-downloads.test.cjs
Also run the existing downloads and download-worker regressions, TypeScript,
and the credential-free check:cloudflare build. These checks do not deploy,
upload or publish live content. After deployment, verify the actual full setup
hash, a resumed download, and a second release with a changed file from a clean
Windows install before claiming live automatic updates have passed.
