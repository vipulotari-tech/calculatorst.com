# Calculator Street — calculatorst.com

Construction & home improvement calculators — 200+ tools for concrete, gravel, roofing, fencing, pavers, mulch and more.

**Stack:** Astro 7 · React 19 · Tailwind CSS 4 · Vite · Cloudflare Pages

**Site:** https://calculatorst.com

## Quick start

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
npm run preview
npm test         # vitest
```

Requires Node ≥ 22.12.

## Project structure

```
src/
  pages/          # Astro routes + [slug]/ dynamic calculators
  components/     # Astro + React UI (shadcn)
  layouts/        # Layout.astro (SEO, GA4, OG, JSON-LD)
  lib/            # calculator registry, models, math
  data/           # hubCalculators, calculatorDetails
  styles/         # global.css (Tailwind theme)
  utils/          # units, format
public/
  favicon.svg, og.png, _headers, _redirects, ads.txt
scripts/          # generate-200, audit-*
```

## Deployment

Cloudflare Pages via `wrangler.jsonc` (`pages_build_output_dir: ./dist`). Static output, trailing slashes enforced.

## SEO / Ads / Analytics

- `src/pages/sitemap.xml.ts`, `robots.txt.ts`
- GA4 `G-7RX7TP3LKB` in `Layout.astro` (Consent Mode v2)
- `public/ads.txt` for AdSense
- JSON-LD: WebSite, Organization, SoftwareApplication, HowTo, FAQPage, Breadcrumb
