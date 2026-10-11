# Game download rollout — 2026-10-11

- Website branch: `dan-dev`.
- Cloudflare Worker: `evoverses-beta`, version `6607c3da-4d47-4ca6-8fe1-4a252d946534`.
- Private Standard R2 bucket: `evoverses-beta-builds`, binding `GAME_BUILDS`.
- Wrangler confirmed r2.dev public access disabled and no custom bucket domains.
- Player regression suite: 50/50 passed, including nine new download/upload tests. Run Windows Node from `apps/website`, setting `EVOVERSES_ACCOUNT_TEST_REPO=D:/documents/GitHub/evoverses` (WSLENV forwards this when invoked from WSL). Without that override, two pre-existing cross-repository tests cannot locate their moved backend fixtures.
- Next production build, TypeScript checking and OpenNext packaging succeeded. Existing lint/bundler warnings remain; no build errors.
- Live anonymous `/download`: 200, sign-in required. Anonymous administrator page: Unauthorised. Admin API and file GET/HEAD: 401/private-no-store. Foreign-origin upload: 403. See `live-access-checks.json`.
- No game ZIP, real tester data changes or account grants were made. Full-size upload/download/resume and game launch remain for the first build upload. Administrator upload controls were compiled and tested with synthetic storage; a real administrator browser upload has not yet been exercised.

Next: administrator uploads the first Windows game ZIP, publishes it, then tests an approved player download and resumed download before sharing the beta download link.
