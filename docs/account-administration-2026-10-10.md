# Account administration - 10 October 2026

Administration is a persistent account role, independent of beta tester approval. Revoking beta approval leaves login and administration intact. The management screen is `/beta-admin`; server-side session and role verification occurs before rendering account data or controls. Other visitors see **Unauthorised**.

The table supports account-name search, server-side sorting, and pages of 100 accounts. Columns show Epic display name, tester status, player XP, ordinary/master administrator status and Evoros balance. Explicit confirmation dialogs cover tester changes, making/revoking ordinary administrators, Evoros grants and item/pack rewards. Grants use immutable, idempotent receipts; uncertain retries retain the request ID and payload. Existing balances remain visible while refreshing.

Master membership is pinned through a private operator job against a unique verified Epic identity and scope. Danmancs is the approved first master; the second account has not been supplied. Browser requests cannot assign master privileges. Ordinary administrators cannot revoke a master, and the final active administrator cannot be revoked. Role changes do not grant currency, award XP or alter tester status. Tester approval retains its separate once-only 5,000-Evoros grant.

Schema 014 adds retained membership revocation/master fields and a narrowly guarded SQL function. The runtime database role retains no direct membership write privileges. Shared/exclusive transaction locks keep access checks and revocations consistent. The pre-existing NFT metadata database is untouched.

Docs and About are hidden in desktop/mobile navigation; their pages are retained. Payments and breeding transaction gates remain disabled.

Verification: native PostgreSQL 44/44; focused administration service 21/21; website administration 8/8; production Next build and OpenNext Worker adaptation passed. Native tests exercised the restricted application role, master protection, non-admin denial, ordinary role changes and the private identity-pinning job. Live publication evidence is appended after deployment.

## Hosted release evidence

AWS migration task applied only schema 014 successfully. The private operator inspection uniquely matched DanMancs to verified player `9d6a70e4-d887-41ad-a7c3-f7e2656cf9bd`; activation returned `administrator: true`, `masterAdministrator: true`. Tester status remained pending, Evoros 0 and XP 0; no reward was implicitly issued. Runtime image is pinned to digest `sha256:dada6876818466eb87751e10469cfa6835c2d4b2f9f42da1b3a78e4f3bd5bc49`, API task revision 3.

Cloudflare Worker version `c7ef6a2b-34dd-4c63-9248-ed902bd17d00` is published at beta.evoverses.com. Anonymous administration renders only Unauthorised (HTTP 200) and its API refuses access (401). Store and Nursery return 200, checkout remains 403 PURCHASES_PAUSED, and Docs/About navigation links are absent. The live EVO quote endpoint returned a valid quote; the user confirmed its price display works again. No quote changes were needed.

Next: sign in as DanMancs and review `/beta-admin`, then explicitly approve testers or grant rewards as required. Supply the second master's verified account identity when ready. These changes are deployed; source remains on the existing local branches pending a separate GitHub backup.
