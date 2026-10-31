# Repository structure and maintenance rules

This guide describes the intended ownership of files in CalculatorSt. It is deliberately conservative: organizing the repository must not change calculator behavior, SEO routes, or production Worker behavior.

## Source of truth

- `src/lib/`: calculation functions, domain logic, and shared helpers. Keep formulas here rather than duplicating them in diagrams or page components.
- `src/data/`: calculator registry, metadata, and authored calculator content. Keep route metadata and calculation implementation conceptually separate.
- `src/pages/`: URL and page composition. Preserve current canonical paths and trailing-slash behavior.
- `src/components/`: reusable UI and calculator-specific visuals. Keep each diagram close to the component that renders it; do not move or rename public routes during visual cleanup.
- `src/layouts/`: site-wide layout and shared metadata.
- `src/styles/`: global styles and semantic design tokens.
- `src/utils/`: small general-purpose formatting and unit helpers. Domain-specific math belongs in `src/lib/`.

## Non-runtime support files

- `e2e/`: Playwright end-to-end regression tests.
- `scripts/`: executable audit/maintenance entry points. If a script moves, update every npm script, workflow, documentation link, and script-relative file reference in the same change.
- `audit/`: checked-in, intentional audit reports/reference cases. Temporary screenshots, logs, generated reports, and local crawl evidence should not be committed unless explicitly serving as a baseline.
- `docs/`: maintainer-facing architecture, brand, and process documentation.
- `.github/workflows/`: CI/deployment and scheduled audit automation.
- `.claude/skills/`: intentionally vendored agent skills; the diagram-design skill is a Git submodule and should be initialized with `git submodule update --init --recursive`.
- `public/`: files served as static assets. Do not put source modules or generated build output here.

## Required checks before merging

Run the checks relevant to the changed files, then the complete CI workflow for production-bound changes:

```sh
npm ci
npm test
npx astro check
npm run build
npm run test:seo
npm run audit:seo-content
npm run test:e2e
```

## Cleanup rules

1. Prefer small, reviewable changes over large directory moves.
2. Do not rename routes, calculator IDs, data keys, or exports as part of a cosmetic refactor.
3. Do not change formulas, units, precision, rounding, or fallback behavior during structure-only work.
4. Do not delete tracked audit evidence or vendored skills without checking its purpose and references.
5. Keep package manifest and lockfile metadata synchronized.
6. Keep Cloudflare account/Worker names, route patterns, bindings, and deployment configuration unchanged unless a separately reviewed infrastructure change requires it.
