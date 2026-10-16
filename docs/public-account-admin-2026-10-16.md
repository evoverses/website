# Public account administration - 16 October 2026

Deployed website version `af6c85fd-3ef8-4043-aaf3-40e2192633cc` removes the obsolete beta approval/revocation buttons and beta status column. It shows active/suspended account status and preserves administrator-only moderation, role controls and manual rewards. Historical approval audit records remain readable. Retired approval actions are rejected by the website API.

A temporary or uncertain Evoros grant receives one bounded retry with the same request ID and exact payload. Further uncertainty keeps the saved request for manual retry. Authorization and validation failures do not retry. The backend ledger deduplicates grants; the frontend does not invent credits or choose a recipient outside the signed administrator's confirmed request.

23 admin/UI/retry tests and the production Next/OpenNext/Workers checks passed. All 11 public smoke checks passed. Live Stripe, EVO quotes, Epic settings and launcher bindings are preserved. A genuine remote-customer acceptance check remains; the owner confirmed an earlier second grant attempt succeeded.
