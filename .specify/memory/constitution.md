# CalculatorSt Constitution
<!-- CalculatorSt Production Constitution -->

## Core Principles

### I. Mathematical Correctness (NON-NEGOTIABLE)

Every calculator must produce defensible, independently verifiable results.

- Formulas must match standard geometry (rectangular prism, cylinder, hollow cylinder, triangular prism, step summation)
- Unit conversions must use exact NIST SP 811 factors (international foot = 0.3048m, avoirdupois pound = 0.45359237kg)
- Weight calculations must use correct density values with authoritative sources cited
- Count calculations must use ceiling-on-count at appropriate boundaries
- Waste factors applied exactly once, after measurement, before discrete rounding
- Cost = quantity × price, never the reverse
- Every calculation function must have at least one independent known-answer test (value NOT derived from production code)
- Metric/imperial conversions must produce equivalent results within tolerance (≤0.1%)
- Placeholder/approximation formulas must be clearly tagged and explained to users
- No fabricated technical standards, manufacturer recommendations, or engineering claims

### II. No Fabricated Information (NON-NEGOTIABLE)

Never invent or assert unsupported claims.

- No fabricated formulas, densities, citations, or technical specifications
- No fake credentials, reviews, ratings, or statistics
- No E-E-A-T declarations without legitimate externally supportable evidence
- Trust must be demonstrated through accuracy, transparency, and content quality, not declared
- All technical references must actually support the calculator they appear on
- When a source cannot be verified, rewrite or remove the statement

### III. Quality Over Quantity (NON-NEGOTIABLE)

Do not create more calculators. Improve existing ones.

- Existing 201 calculators → correctness → usefulness → uniqueness → trust → SEO → AdSense readiness → performance
- No duplicate calculators without genuine search-intent distinction
- Master calculators should support appropriate modes (e.g., Concrete: slab/wall/footing/column/tube/curb)
- Dedicated long-tail pages preserved where search intent genuinely differs
- Every calculator page must provide meaningful value even without ads

### IV. Root-Cause Fixes (NON-NEGOTIABLE)

Fix the source, not the symptom.

- When dozens of pages share the same bug, fix the common component/template/data generator
- Do not manually patch hundreds of pages when one safe shared fix is possible
- But do not force calculator-specific content into one generic template
- Every technical reference on a page must be specific to that calculator's domain

### V. Testing Is Mandatory (NON-NEGOTIABLE)

Every important calculation and shared utility requires regression tests.

- Independent known-answer tests for each calculation function
- Metric/imperial equivalence tests
- Edge case tests: zero, negative, very large, decimal, unit switching
- Formula regression tests compare against independently calculated expected results
- Build must succeed and all tests must pass before commit
- BeyondSEO and AdSense re-audit after major implementation passes

### VI. BeyondSEO Is Mandatory (NON-NEGOTIABLE)

No major SEO decision without the BeyondSEO workflow.

- Search intent alignment verified before content changes
- Technical SEO checked after every structural change
- No keyword stuffing or artificial word count inflation
- Structured data validated against schema.org
- Internal links contextual and workflow-relevant
- Thin/duplicate/templated pages identified and resolved

### VII. AdSense Auditing Is Mandatory (NON-NEGOTIABLE)

No claim of AdSense readiness without execution and resolution.

- `/adsense-site-auditor` executed against every major release
- Pre-flight gate checked: site completeness, publisher identity, minimum content
- Full 73+ requirement audit completed
- Findings converted to implementation tasks with acceptance criteria
- No guarantee of approval promised — only risk reduction through evidence-based fixes

### VIII. Accessibility First (NON-NEGOTIABLE)

Calculator functionality must work for all users.

- Desktop and mobile tested
- Keyboard navigation fully supported
- Semantic HTML before ARIA
- Visible focus indicators on all interactive elements
- Color contrast meets WCAG AA (4.5:1 normal text, 3:1 large text)
- Touch targets ≥ 44x44px
- Form inputs have associated labels
- Error messages associated with inputs
- `prefers-reduced-motion` respected

### IX. Performance by Default (NON-NEGOTIABLE)

Avoid unnecessary overhead.

- Minimal JavaScript — no hydration unless needed
- No unused dependencies
- Fonts loaded non-blocking with display=swap or self-hosted
- No layout shifts (CLS < 0.1)
- Lazy load below-fold content
- Cache static assets aggressively
- No render-blocking resources in critical path

### X. Safe Releases (NON-NEGOTIABLE)

Do not push broken work.

- Production build passes before any commit
- Type checks pass
- All tests pass
- Git diff is intentional and reviewed
- No secrets, API keys, or credentials committed
- Logical commit messages with scope prefix
- Production smoke test after deployment
- Rollback plan exists for each release

## Development Workflow

### Spec-Driven Development

1. Constitution → Specification → Clarification → Plan → Checklist → Tasks → Analyze → Implement → Converge
2. All artifacts stored in `.specify/specs/`
3. Spec-Kit is the central orchestration system
4. BeyondSEO findings become formal Spec-Kit requirements/tasks
5. AdSense findings become formal Spec-Kit issues/tasks
6. No implementation without a spec and plan

### Three-Way Quality Gate

Every major calculator/page must pass all three gates:
- **Gate A**: Product correctness (math + UX + accessibility + tests)
- **Gate B**: BeyondSEO (search intent + technical SEO + uniqueness + information gain)
- **Gate C**: AdSense (content quality + policy/readiness + trust + usability)

A page passing only one or two gates is NOT complete.

### Autonomous Loop

SPEC-KIT → BeyondSEO → AdSense Auditor → Audit → Plan → Implement → Test → Re-Audit → Converge → Fix → Retest → Commit → Push → Deploy → Verify

Repeat until convergence or documented external limitations.

## Content Standards

### Content Uniqueness
- Each calculator page has page-specific explanatory content
- No repeated intros, identical FAQs, duplicated conclusions
- No generic "reviewed" blocks or templated headings
- No synonym replacement — information must be genuinely calculator-specific

### Information Gain
- Transparent calculation breakdown
- Editable assumptions where useful
- Density tables, waste allowance guidance
- Measurement guidance and common mistakes
- Worked examples with real numbers
- Reference tables
- Related calculators with contextual links

### Source Quality Hierarchy
1. Official manufacturer documentation
2. Government agencies (NIST, OSHA, EPA, etc.)
3. Recognized standards organizations (CRSI, ACI, ASTM, etc.)
4. University or extension resources
5. Reputable industry sources

## Internal Linking
- Contextual, workflow-based links (not SEO spam)
- Each calculator links to 2-6 genuinely related calculators
- Related calculators reflect construction workflow adjacency
- Category hubs list all calculators with descriptions
- No orphan pages

## Structured Data
- WebSite + SearchAction on every page
- Organization schema on every page
- WebPage schema per page with dates
- BreadcrumbList on calculator and category pages
- FAQPage where genuinely useful Q&A exists
- No fabricated ratings, reviews, or credentials

## Governance

This constitution supersedes all other development practices for this project.

- All implementation must verify compliance with these principles
- Amendments require documentation, rationale, and approval
- Complexity must be justified against the Quality Over Quantity principle
- The Definition of Done requires evidence for every claim of completeness

**Version**: 1.0.0 | **Ratified**: 2025-09-22 | **Last Amended**: 2025-09-22
