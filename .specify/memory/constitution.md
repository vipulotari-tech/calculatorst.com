# CalculatorST Constitution

## Core Principles

### I. Mathematical Correctness Before Cosmetics
Construction calculators produce numbers people use for real spending decisions. Formula errors, unit conversion bugs, or edge-case failures are P0 regardless of how polished the UI is. Every calculator formula must be independently verified against known-answer cases before any content, SEO, or styling work is considered complete.

### II. Library-First Architecture
Calculation logic, unit conversion, and validation live in independently testable library modules under `src/lib/calculations/`. Each calculation module is pure TypeScript — no Astro, no React, no DOM. Presentation components import and call these modules. This separation allows formula tests to run without a browser and allows calculators to share validated logic.

### III. Test-First (NON-NEGOTIABLE)
Every new or modified calculation must have automated tests before it is considered complete. Tests use independently derived expected values — never values computed by the same production function under test. Regression tests protect existing calculators from shared-library changes. A calculator passes only when its tests pass.

### IV. Content Originality and Specificity
Each calculator page must contain information specific to that calculation type — not shared template text dressed up with synonyms. Content must explain the construction domain context relevant to that specific calculator. Template contamination (e.g. concrete references on a paint page) is a P2 defect. References must support the associated claims and be relevant to the calculator's domain.

### V. Technical SEO Truthfulness
Metadata, structured data, and sitemap entries must be accurate and never deceptive. No fabricated freshness signals (e.g. fake `<lastmod>`), no fabricated ratings/reviews, no unsupported trust claims ("100% accurate", "expert verified"). Canonical tags must be correct. Internal linking must be contextual and based on real construction workflows, not mechanical duplication.

### VI. Safe Git and Deployment Practices
Work happens on feature branches. Commits are descriptive and reference real changes. No force-push, no destructive resets. Deployment is never the validation mechanism — tests, build, and regression checks must pass first. Live verification follows every deploy. Known-broken work is never deployed.

### VII. Progressive Convergence
Work proceeds in bounded batches: implement → test → converge → identify gaps → next batch. A workstream converges when its acceptance criteria pass, no P0/P1 issues remain, formulas are independently verified, tests pass, build succeeds, and live production verification succeeds. Perfect is not the goal; correct and verified is.

## Governance

The Constitution supersedes all other practices. Amendments require documentation and must maintain mathematical correctness as the highest priority. All work batches must verify compliance with the relevant principles before marking tasks complete.

**Version**: 1.0.0 | **Ratified**: 2026-09-19 | **Last Amended**: 2026-09-19
