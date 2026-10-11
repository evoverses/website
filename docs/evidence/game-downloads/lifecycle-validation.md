# Unpublish and Delete rollout — 2026-10-11

- Worker version: `8954a594-6094-46bd-99b9-7cf0aa25c48d`.
- Player regression suite: 57/57 passed. Tests use synthetic R2 storage and account permissions; no real game file was deleted or unpublished.
- Coverage: withdraw current/pinned links while retaining the ZIP; republish; withdraw an older release without disrupting the current one; active-release deletion protection; required version confirmation; incomplete/cancelled cleanup; repeated delete; tombstones block resurrection; pending deletion retry; stale unpublish and lifecycle lease contention/expiry.
- Production Next build/TypeScript checks and OpenNext packaging succeeded. Existing lint warnings remain.
- Live access checks repeated: anonymous download/admin pages and GET/HEAD restrictions, foreign-origin upload denial, plus same-origin unauthenticated Delete returns 401 before storage mutation.
- R2 conditional lease serialises lifecycle operations. Claim/release writes are spaced to respect R2's per-object write limit; completed cleanup has a separate marker, avoiding rapid repeated writes to the build record.
- No AWS API or account database changes required. Existing files and the published release remain unchanged by rollout.

Next: refresh Manage game downloads. Use Unpublish to withdraw a build temporarily; Publish restores it. Delete is permanent and is disabled for the current published build until it has been unpublished.
