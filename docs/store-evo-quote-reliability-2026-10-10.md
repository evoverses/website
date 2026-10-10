# Store EVO quote reliability - 10 October 2026

## Problem

The public beta `/api/store/evo-quote` returned HTTP 503 during diagnosis. The quote service had one upstream provider and made an uncached request on every refresh. The client erased its verified quote before fetching a replacement and had no client request deadline, so a failed or stalled refresh could leave no price or an indefinitely disabled refresh control.

## Change

Retain GeckoTerminal as primary; fall back to DexScreener's live pair endpoint for the same known Avalanche EVO/WAVAX pool. Validate the chain, pool, EVO base-token address and positive decimal price before accepting fallback data. Each provider has a five-second timeout. The client has a fifteen-second request deadline and accepts either validated source, displaying the actual provider link.

Coalesce concurrent upstream requests in each warm Worker and reuse a successful observation for thirty seconds without changing its timestamp. No historical/default quote is substituted, and failed fetches do not extend freshness. There is no cross-Worker distributed cache. Keep the last verified client quote during a refresh or failure; it remains eligible for display only until the existing five-minute expiry. Explain refresh failure, label pending refresh, and prevent cancelled older requests from overwriting newer results. Beta purchasing remains disabled.

## Verification

29 Store/payment regression tests pass, including new checks for provider failure and malformed payload fallback, incorrect market rejection, concurrent request sharing, cache timestamp/expiry, retry after failure, last-price retention, stalled-request timeout and cancelled-request ordering. Production build and public release evidence follow below.

Recommended next step: exercise Refresh EVO quote with the connected wallet on beta; monitor failures during ordinary use before enabling any purchases.

## Beta release evidence

Next.js production build and OpenNext packaging passed. Published Worker version `13e73007-9278-4901-80ac-fe93e75a3ba3`. Four consecutive public quote requests returned HTTP 200, using the validated DexScreener fallback. The first completed in 0.61 seconds, subsequent cached responses in 0.09-0.11 seconds, with the original observation timestamp retained. This demonstrates the fallback works from the deployed Worker; it does not guarantee either provider's future availability. Connected-wallet page interaction is available for user review. No purchase, wallet transaction, credential change or database write was made.
