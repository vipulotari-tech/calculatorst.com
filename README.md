# CalculatorSt — calculatorst.com

Construction and home-improvement calculators for concrete, gravel, roofing, fencing, pavers, mulch, and related projects.

- **Production site:** https://calculatorst.com
- **Stack:** Astro 7, React 19, Tailwind CSS 4, Vite, Cloudflare Workers Static Assets
- **Runtime:** Node.js `>=22.12.0`

## Quick start

```sh
npm ci
npm run dev
npm test
npx astro check
npm run build
npm run test:seo
npm run audit:seo-content
npm run test:e2e
```

The development server runs at `http://localhost:4321`.

## Repository map

See [docs/repository-structure.md](docs/repository-structure.md) for the directory ownership map and rules for keeping the repository maintainable.

| Path | Responsibility |
| --- | --- |
| `src/pages/` | Astro routes, dynamic calculator routes, sitemap and robots endpoints |
| `src/components/` | Shared UI and calculator-specific diagrams |
| `src/data/` | Calculator registry and page content/data |
| `src/lib/` | Calculation logic and shared domain helpers |
| `src/layouts/` | Shared page layout and metadata |
| `src/styles/` | Global CSS and design tokens |
| `src/utils/` | Formatting and unit helpers |
| `public/` | Static assets, headers/redirects, and ads.txt |
| `e2e/` | Playwright browser regression tests |
| `scripts/` | Auditing and maintenance scripts invoked by npm or CI |
| `audit/` | Intentionally tracked audit evidence and reference cases |
| `docs/` | Maintainer documentation |
| `.github/workflows/` | CI, production deployment, and diagram audit automation |

## Build and deployment

Astro builds static output to `dist/`. `wrangler.jsonc` configures the Cloudflare Worker and serves that output through Workers Static Assets; `worker.js` and `functions/_middleware.js` are runtime integration points. Production deployment is performed by the `Validate and deploy calculatorst.com` GitHub Actions workflow after validation succeeds on `main`.

Do not deploy unvalidated changes or alter Worker routes/configuration as part of unrelated cleanup.

## Calculator correctness and design

Calculation logic in `src/lib/` is the source of truth. Keep formulas, units, rounding, and edge-case behavior covered by tests. Diagrams must reflect actual calculator inputs and outputs, remain accessible and responsive, and must not introduce made-up engineering values. See `AGENTS.md` and `docs/diagram-design-calculatorst-brand.md`.
