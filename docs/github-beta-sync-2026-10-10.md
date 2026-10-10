# Beta website GitHub sync - 10 October 2026

This checkpoint saves the local `dan-dev` changes used for the Cloudflare beta website, plus the associated marketplace indexer recovery and infrastructure configuration. The current published Worker version is `b755ef5a-a04f-480a-a0df-57e6c6f65a67`.

Included: hosted Epic account integration, beta account administration, paused purchase/breeding transaction controls, shared wallet linking and liquidity navigation, EVO quote reliability, marketplace query and duplicate-listing safeguards, public SQD Portal indexer migration, landing portal animation, card layout/Back navigation and current-level card HP. Related tests, scripts, assets, evidence and work logs are included.

Local environment files, private database contents, runtime secrets, dependencies and generated builds remain excluded. GitHub stores the source and configuration; Cloudflare runs the published build and retains its separately managed secrets. Pushing this checkpoint does not change DNS, AWS resources, contracts or account records.

Validation: production Next/OpenNext build and six local/live card layout checks passed before this checkpoint. At push preparation, 160 website regression tests passed (71 auth/wallet/marketplace/preview, 21 inventory, 12 game inventory/team/store, 29 store/payment and 27 Nursery/formatting). HP checks cover 68 species at all 100 levels and immediately before unlock thresholds. Test helpers now compile the shared HP module into isolated fixtures. Source whitespace checks passed (the archived migration patch retains the single-space context lines required by unified-diff syntax), and a scan of pending text files found no private-key blocks, AWS access keys, Stripe secret keys, GitHub tokens or long literal values for the known credential variable names.

Recommended next step: continue the beta visual/functional review from this saved source checkpoint. Source changes after this checkpoint still require an explicit build/deployment to reach Cloudflare.
