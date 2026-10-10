# Marketplace beta data loading - 10 October 2026

## Diagnosis

Headless Edge reproduced the beta Marketplace failure: browser POST preflight to `https://api.evoverses.com/graphql` had no `Access-Control-Allow-Origin` for `https://beta.evoverses.com`. A direct POST with that Origin returned HTTP 500. The same authored query without a browser Origin returned HTTP 200, total 5,108 Evos and two requested items. The data was available; this was a browser-origin integration problem, not an empty collection.

## Changes

Browser-side Squid reads now use `/api/marketplace/query` on the website's own origin. Server-side reads retain the configured metadata service directly. The endpoint sends only three fixed, authored read operations (Evo list/filter/pagination, Evo details, Marketplace summary) to a fixed upstream. It validates variables, bounds pages, page size, wallet count, attribute values and request-body size, rejects arbitrary queries/mutations/URLs, applies a twelve-second upstream timeout, and forwards no cookies, credentials or browser Origin. No CORS or infrastructure changes were made to the existing metadata service.

Marketplace errors now show a retry action instead of “No items found”. Previously displayed data remains visible on a background failure. Added wallet addresses to the owned-items query key so switching the connected wallet refreshes that filter. The header no longer renders NaN while totals are zero/unavailable. Existing genuine empty-filter results retain the empty-state display.

## Verification

Three tests pass: allowed public reads; rejection of forged operations/queries/variables, excessive limits and oversized bodies; and safe handling of upstream HTTP/JSON/GraphQL errors. Run `test:marketplace` from the website package. Applied the React best-practices checklist: hooks remain unconditional, query keys include inputs, errors have an accessible alert, retry is a real button with a pending state, and independent summary/list requests remain parallel. Production build and public browser evidence follow below.

Recommended next step: check Listed and Owned By You with the connected wallet on beta. This change reads public marketplace data; it does not execute purchases or listings.

## Published verification

Next.js build and OpenNext packaging passed. Published Worker `6e8e1d55-4a1a-4d86-a103-d37e9776e6a4`. A live same-origin request returned HTTP 200 with total 5,108 and two requested assets. Headless Edge loaded the Marketplace summary and its first 25 assets through the beta endpoint, with no direct browser calls to the external metadata host. Visible Evo cards rendered; screenshot and JSON evidence are in `docs/evidence/marketplace/`.

In a separate clean browser context, simulated an unavailable list endpoint and confirmed the retry button appeared without “No items found”. Restored the endpoint, clicked Retry, and confirmed cards returned. The first failure-check attempt used a reloaded context with cached data and did not trigger the simulated failure; the clean-context test corrects that fixture issue. No wallet approval, listing, offer, purchase or other blockchain transaction was performed. Existing trading controls remain connected to real Avalanche contracts; completed trading is not certified by these read-only checks.

## Banner theme correction

Removed the visible collection name/description from the left of the banner; retained a screen-reader heading for page semantics. The right-side statistics now have explicit white values and pale slate labels on a translucent black backdrop, independent of theme variables. Removed the banner's forced dark class. Production and two-theme browser checks follow below.

Published banner correction as Worker `de1834ee-44ea-471f-8331-2cee64d4d7d6`. Build and OpenNext packaging passed. Headless Edge checked light and dark modes on the live site: all five stat labels, all five values and their backdrop have identical computed colours across themes; the left description is absent and the page heading is visually hidden. Screenshots (`banner-light.png`, `banner-dark.png`) and `banner-check.json` are saved in the Marketplace evidence folder. Both screenshots were visually reviewed.
