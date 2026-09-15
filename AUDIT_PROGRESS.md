# Calculator audit checkpoint

Updated: 2026-09-15. Status: IN PROGRESS — not a completed 201-calculator certification.

## Authorization and resume

User authorized calculator fixes, commits, and deployment of verified batches. Continue without asking again for the same scope. Read this file and inspect git status/log before resuming. Never call a deployment successful without checking its result.

## Baseline

- Repository: vipulotari-tech/calculatorst.com; main baseline b0c32b6e49dbae56741da826a702942318d28797.
- Working branch: fix/calculator-audit-2026-09-15.
- npm ci completed; baseline npm test: 480 passing tests in 9 files.
- Catalog has 201 entries, but some dedicated routes have inline implementations distinct from the registry tested by the existing suite.
- Production: existing GitHub Actions deploy.yml runs tests, Astro check, build, and Cloudflare Workers deployment on main pushes. Preserve this pipeline.

## Confirmed issues / active batch

- Dynamic pages render stale descriptions, examples and material claims from calculatorDetails, separate from the executable model.
- Generic diagrams select geometry by name and show arbitrary examples, including concrete volumes on fence pages.
- Optional price is labeled twice; required cost fields are described as optional.
- Fence price per unit is actually per panel. Its amount omits posts and needs an explicit label.
- Dedicated FenceCostCalculator still uses hardcoded 8 ft panels and 0.5 concrete bag per post; its inputs are not covered by registry tests.

## Next steps

1. Align generated-page content with actual model inputs, output labels, formula and assumptions; replace misleading diagrams there.
2. Fix shared price labels and fence pricing basis; independently test fence geometry and pricing.
3. Check dedicated calculators separately; record their status honestly.
4. Run unit tests, Astro check and build, inspect rendered pages, commit/push, merge verified batch, monitor deployment.
5. Record calculator-level pending/reviewed status and remaining limitations before stopping.

## Batch 1 implemented and locally verified

- 195 shared pages now use model-aligned output descriptions, fields, instructions, worked examples, FAQ and assumptions. Their old name-selected diagrams were removed from these pages because they displayed unrelated geometry and fabricated example values. Dedicated page content is still pending review.
- Fixed duplicate optional price label, required cost-field required state, Copy Result accessible name, result label truncation and narrow-screen formula wrapping.
- Fence / fence-post / fence-panel now label panel-only pricing explicitly ($/panel or $/ft), with the existing pricing arithmetic preserved.
- 6 fence/gate calculators have targeted independent cases (counts, rounding, metric equivalents, panel costs, pickets, post displacement and gate clearances). This is not exhaustive mathematical certification.
- npm test: 695 pass in 10 files. Astro check: 0 errors, 0 warnings, 19 pre-existing hints. Build: 233 pages. Built fence HTML checked for corrected results and absence of known stale claims.
- Local browser preview rejected with ERR_BLOCKED_BY_CLIENT. Production browser verification pending deployment.
- audit/calculator-status.json records all routes and pending maths/dedicated/browser work.
- Batch 1 merged in PR #1, main merge 3a66fdc. Workflow repair 64118b5 pins Wrangler 4.131.2 with explicit wrangler.jsonc. First deployment failed on old Wrangler; second passed tests/check/build but failed because CLOUDFLARE_API_TOKEN is missing. Live browser still showed old fence page.


## Batch 2 checkpoint

- Fixed validation and stale results across all 10 dedicated handlers, exact dimensional conversions, zero-price handling, flat roof pitch, zero deck gap, zero paver layers, paver order rounding, deck fasteners/stock pricing, and invalid gravel density.
- Fence cost uses entered spacing, explicit equal-run gate layout, hole/post displacement and bag yield; no hardcoded bags per post. Corrected its explanatory page, example and selected-material cost scope.
- Added independent reference cases for every shared model family, dimensional conversion checks for registry calculators, and actual inline-handler tests for all 10 dedicated implementations.
- npm test: 975 passing in 12 files. Astro check: 0 errors, 0 warnings, 19 existing hints. Build: 233 pages.
- audit/calculator-status.json records 205 routes. Family reference cases are not exhaustive certification. Nine dedicated explanatory pages still need content review; browser interaction and visual verification remain pending deployment.
- Deployment blocker: GitHub Actions run 34951065496, missing CLOUDFLARE_API_TOKEN. User must configure a Cloudflare deployment token in repository Actions secrets (do not send secrets in chat). Also verify existing CLOUDFLARE_ACCOUNT_ID. No live deployment claimed.

## Resume from here

1. Inspect git status/log and this checkpoint before editing; preserve existing fixes.
2. Review the nine remaining dedicated explanatory pages against their actual inline handlers, then broaden only concrete uncovered edge cases.
3. Once Cloudflare secret is configured, rerun the latest main deployment workflow and verify production inputs, errors, results, mobile layout and links. No repeated authorization needed for the approved fixes/commits/deployment scope.
4. Work does not automatically resume after a quota/session stop; this committed checkpoint enables continuation on the next active turn.


## Batch 3 — dedicated content review

- Reviewed the nine remaining dedicated explanatory pages against their handlers. Replaced unsupported market-price/installation claims and unavailable feature descriptions with actual formulas, unit definitions, pricing scope and geometric assumptions.
- Corrected gravel worked-example cost ($130.37 from unrounded volume), deck row/fastener descriptions, paver waste rounding, roof-area precision, and pea-gravel density (100 lb/ft³, not 22).
- Removed unrelated example diagrams from these dedicated pages. Corrected bulk mulch with per-bag pricing so an unavailable bag count cannot produce a misleading $0 quote; added regression coverage.
- All 205 route content records are now aligned to their model or dedicated handler. This is not exhaustive engineering certification or production browser verification.
- Batch 2 is merged in PR #2 (f9326ca); deployment run 34952390882 failed. Existing missing Cloudflare secret remains the unresolved deployment blocker.
- Next: after deployment access is restored, run the main workflow and verify production behavior/mobile layout. Continue targeted edge-case work only for concrete findings; do not redo completed content review.

- Batch 3 validation: 977 tests pass; Astro check 0 errors/0 warnings (19 existing hints); build 233 pages. Live browser verification remains pending deployment.
