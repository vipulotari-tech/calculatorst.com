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
- Next immediate action: commit/push verified batch; merge through existing main deployment pipeline; inspect Actions result and live fence page. Then audit dedicated inline calculators and remaining formula families.
