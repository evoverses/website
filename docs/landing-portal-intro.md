# Landing portal intro - 10 October 2026

Replaced the landing page's three-video YouTube carousel and duplicate logo with one responsive portal/logo hero. The supplied `Evoverses_no_portal_trimmed.png` is copied unchanged to `public/landing/evoverses-logo.png`; `Evoverses_3.png` was inspected as the blue/purple portal reference.

The 2.8-second SVG/CSS sequence opens a glowing portal, rotates turbulent spiral currents like a plasma-water whirlpool, brings the logo forward, then collapses the portal behind it. Animation runs once and holds the exact logo. No video player, GIF decoder, autoplay sound, third-party embed or client timer is needed. Reduced-motion visitors see the static logo immediately. The reserved aspect ratio prevents layout shifts; the existing tagline, social links and Pro marketplace link remain.

Visual check evidence is in `docs/evidence/portal-intro/`: 600ms opening, 1300ms emergence, 2800ms settled screenshots and a 375px mobile screenshot. Headless Edge confirmed zero horizontal overflow, portal opacity 0 and logo opacity 1 at completion, and zero animations under reduced motion. The standalone fixture uses the same authored paths/styles; final deployment checks also inspect the real page.

Next: review the animation on the beta landing page for pacing and similarity to the game's portal. This does not alter game assets, wallet/account behaviour, payments or Nursery transaction gates.

## Portal shape refinement

The user's reference requires a donut with an open centre, rough/broken edges and a less defined outline. Removed the smooth rim and solid centre, masked the swirling currents into an annulus, increased liquid displacement and softened the blue/purple glow. Updated visual fixtures show the hollow, irregular portal. The artwork is now a static `public/landing/portal-flow.svg` asset animated by CSS, reducing server-rendered markup and eliminating per-request path generation.

The initial live browser check confirmed the logo settled and portal disappeared, but also encountered intermittent Cloudflare "Worker exceeded resources" responses. Curl page checks returned 200. This is recorded as a hosting limit rather than a verified animation defect; the static-artwork release is rechecked after publication. An unrelated third-party iframe remains; the acceptance check counts YouTube embeds specifically.

## 1102 investigation and release checkpoint

The live trace confirmed `exceededCpu` at 10ms on Home, Sign-in and Store. Rolled back to pre-animation Worker 207dcf39-bc43-4833-906e-632e339edb5e; Home/Sign-in returned 200. Built and published the lighter static-SVG donut version 10bf495b-44bf-44d8-809e-fecdac1d68b0 for comparison. Successful warm requests still consumed 63ms (Sign-in) and 79ms (Store), with much higher cold/page-rendering requests. This is not evidence that the 10ms issue is fixed.

The static SVG retains the hollow centre, broken rough edges and whirlpool motion; desktop/mobile/reduced-motion checks pass. The updated Worker requires a suitable CPU allowance for reliable operation. Cloudflare's official limits specify 10ms per request on Free; Workers Paid starts at US$5/month and includes 10 million requests and 30 million CPU milliseconds per month. The user approved Workers Paid at US$5/month plus excess usage. Browser-control access failed before opening the billing screen, so enabling the subscription is awaiting a dashboard action by the user; no subscription change is claimed. A 3,000ms per-request cap is prepared in Wrangler configuration but has not been deployed or used to change subscription/billing. It is a single-request cap, not a monthly spending limit. AWS accounts/database and existing credentials remain unchanged.

## Workers Paid release - 10 October 2026

The user confirmed Workers Paid was enabled in Cloudflare. Published Worker version `73912b3f-4718-425a-a8f4-a019218f9729`; the deployed version API confirms `limits.cpu_ms: 3000`. No credentials, AWS resources or transaction gates were changed. This request-level limit does not cap monthly billing.

Checks ran without an active Wrangler log tail: Home, Sign-in, Store, Bertha and Hermann all returned HTTP 200. Headless Edge passed the live desktop/mobile animation checks: no YouTube embed, no horizontal overflow, portal hidden and logo visible after 2.8 seconds. Evidence screenshots and `live-check.json` were refreshed. Python urllib probes were rejected with HTTP 403; curl and a real browser passed, so those probes were not treated as application failures. No 1102 appeared in these checks; continued reliability is not established by a short smoke test.

Recommended next step: review the portal pacing on the beta site and watch normal beta traffic for further resource errors.
