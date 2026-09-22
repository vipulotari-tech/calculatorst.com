# Feature Specification: Category Page Quality

**Feature Branch**: `004-category-page-quality`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "Improve CalculatorSt construction category pages for usefulness, SEO quality and AdSense readiness. Each construction category page (/construction/[category]/) should provide genuine user value with category-specific content explaining what the category covers, common projects, which calculators to use for which tasks, measurement guidance, material considerations, common mistakes, and contextual links to related calculators. No filler, no keyword stuffing, no duplicated content across categories."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Discover calculators by project type (Priority: P1)

A homeowner planning a concrete patio lands on the construction category pages and finds not just a grid of calculator links, but a brief guide explaining what types of concrete work exist, what measurements they need before using any calculator, and which calculator matches their specific project (slab, footing, column, curb).

**Why this priority**: This is the primary user path — someone with a project in mind needs to find the right tool quickly. Category pages are the bridge between "I need to build something" and "here's the calculator for it."

**Independent Test**: Visit any construction category page (e.g., /construction/concrete/) and verify a user with no prior knowledge of the site can understand what the category covers, identify their project type, and select an appropriate calculator within 30 seconds.

**Acceptance Scenarios**:

1. **Given** a user on /construction/concrete/, **When** they read the page intro, **Then** they understand concrete calculators cover slabs, footings, walls, columns, tubes, and curbs — not just generic "concrete math."
2. **Given** a user on /construction/concrete/, **When** they scan the page, **Then** they find guidance on which calculator to use for their specific project type.
3. **Given** a user on /construction/roofing/, **When** they read the page, **Then** they understand they need pitch, span, and material measurements before using any roofing calculator.

---

### User Story 2 - Avoid wrong calculator selection (Priority: P2)

A user who lands on a category page should be able to distinguish between similar calculators and avoid picking the wrong one. For example, the concrete section should clarify when to use Concrete Calculator vs Concrete Volume Calculator vs Concrete Cost Calculator.

**Why this priority**: Wrong calculator selection leads to wrong estimates, which destroys trust. Preventing this at the category level reduces user frustration.

**Independent Test**: On any category page with 2+ similar calculators, verify that the category intro or calculator descriptions make the distinction clear enough that a user would not reasonably pick the wrong tool.

**Acceptance Scenarios**:

1. **Given** a user on /construction/concrete/ with 3 concrete calculators, **When** they read the intro and card descriptions, **Then** they can identify which calculator fits volume-only needs vs cost estimation vs full project planning.
2. **Given** a user on /construction/deck-fence/ with deck and fence calculators, **When** they scan the page, **Then** they understand deck calculators measure materials while fence calculators estimate posts, rails, and concrete for footings.

---

### User Story 3 - Trust the site's expertise (Priority: P2)

A user evaluating whether to trust Calculator Street's estimates should find evidence of expertise on category pages — references to standards, common measurement mistakes, material considerations.

**Why this priority**: AdSense and E-E-A-T both require visible expertise. Category pages are an underused signal — they currently show zero expertise markers.

**Independent Test**: On any category page, verify at least one reference to a recognized standard (NIST, TxDOT, CPSC, manufacturer data, or common construction practice) and at least one practical tip specific to that trade.

**Acceptance Scenarios**:

1. **Given** a user on /construction/rebar/, **When** they read the page, **Then** they find a note about lap splice rules, bar spacing, or concrete cover requirements — something specific to rebar work.
2. **Given** a user on /construction/foundation/, **When** they read the page, **Then** they find guidance on soil bearing considerations, frost depth, or footing sizing basics.

---

### User Story 4 - Navigate between related categories (Priority: P3)

A user working on a concrete patio needs to know about rebar spacing, gravel base, and possibly fencing around the patio. Category pages should surface related categories and calculators naturally.

**Why this priority**: Internal linking benefits both users and SEO. But links must be contextual, not keyword-stuffed blocks.

**Independent Test**: On any category page, verify that related-category links are contextual (e.g., concrete page links to rebar and gravel, not to flooring or drywall).

**Acceptance Scenarios**:

1. **Given** a user on /construction/concrete/, **When** they look for related work, **Then** they find links to rebar, gravel, and slab calculators — but not to unrelated categories like insulation.
2. **Given** a user on /construction/roofing/, **When** they need related tools, **Then** they find roof pitch and framing calculators, not fence or flooring.

---

### Edge Cases

- A category with only 1-2 calculators still needs a useful intro — not padded with unrelated content.
- Mobile layout must preserve readability of category intros without horizontal scroll or excessive vertical stacking.
- Categories that share calculators with other clusters (e.g., concrete appears in both "concrete" and "slab-patio-driveway") should have distinct page intros reflecting different project contexts.
- No category page should reference a calculator that does not exist in that category's group list.
- If a category has no calculators (empty state), the page should still provide useful project guidance rather than showing an empty grid.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each construction category page MUST include an introductory paragraph (2-4 sentences) explaining what construction work the category covers and when a homeowner or contractor would need these calculators.
- **FR-002**: Each category page MUST include a "Before you calculate" or equivalent section listing the measurements and information the user should gather before using any calculator in that category.
- **FR-003**: Each category page MUST include guidance distinguishing between similar calculators within the category (which tool for which task).
- **FR-004**: Each category page MUST include at least one category-specific practical tip, common mistake, or material consideration.
- **FR-005**: Each category page MUST include contextual links to related calculators within the same category and, where relevant, to calculators in other categories.
- **FR-006**: Content MUST be unique per category — no shared introductory paragraphs, repeated FAQs, or generic conclusions across categories.
- **FR-007**: Category pages MUST NOT contain fabricated technical standards, manufacturer recommendations, or engineering claims. All references must be to publicly available sources or common construction practice.
- **FR-008**: The intro section MUST NOT push the calculator grid below the fold on mobile devices (320px viewport).
- **FR-009**: Category pages MUST maintain existing URL structure, canonical tags, and internal linking to calculator detail pages.
- **FR-010**: Existing calculator pages (individual tool pages) MUST NOT be modified by this feature.

### Key Entities

- **Construction Category Page**: A page at /construction/[category]/ that lists calculators grouped by project type, with category-specific intro content, measurement guidance, and contextual links.
- **Calculator Group**: A sub-section within a category page (e.g., "Concrete Slabs" under the concrete category) that clusters related calculators by project type.
- **Category Intro**: The unique, original content at the top of each category page explaining the trade, common projects, and calculator selection guidance.
- **Related Calculator Link**: A contextual link from one category page to a calculator page (same or different category) that helps users find the right tool for a related task.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every construction category page (16 total) passes a manual review confirming it has unique, category-specific introductory content — no duplicated paragraphs across categories.
- **SC-002**: Every category page with 2+ similar calculators includes user-facing guidance distinguishing them (verifiable by reading the page intro).
- **SC-003**: Every category page includes at least one link to a related calculator in another category where the relationship is construction-logical (e.g., concrete → rebar).
- **SC-004**: No category page intro exceeds 120 words — short enough to keep the calculator grid visible above the fold on mobile.
- **SC-005**: After implementation, the AdSense site auditor reports zero "low-value category page" findings for construction category pages.
- **SC-006**: BeyondSEO reports zero duplicate or template-content findings across category pages.
- **SC-007**: All category pages pass responsive layout testing at 320px, 768px, and 1440px viewport widths with no horizontal overflow.

## Assumptions

- The 16 construction category pages are generated from the shared template at `src/pages/construction/[category]/index.astro` — improvements should be made in that template or through per-category data configuration rather than creating 16 separate files.
- The category intro content is short by design (not an oversight) — the previous pages intentionally kept intros minimal to favor the calculator grid. This spec corrects that balance.
- The "Before you calculate" guidance should be practical, not exhaustive — homeowners gathering measurements is the target use case.
- Related-category linking is based on construction workflow logic (e.g., you pour concrete before installing fence posts) rather than alphabetical or random.
- Calculator card descriptions in the grid already exist and are unique per calculator — this spec does not modify individual calculator cards, only the category page wrapper content.
- The site uses Astro static site generation — all content is baked at build time, no runtime content fetching needed for category pages.
- Google does not require a specific word count for category pages — the success criterion is genuine user value, not hitting an arbitrary number.
