# Feature Specification: Competitor Gap Closure & Calculator Superiority

**Feature Branch**: `005-competitor-gap-closure`

**Created**: 2026-09-22

**Status**: In Progress

**Input**: Mission document: systematically make CalculatorSt's highest-value construction calculators more useful, mathematically reliable, visually clearer, technically stronger, and more competitive than competing calculators.

## User Scenarios & Testing

### User Story 1 - Trust the math (Priority: P0)

A contractor calculating concrete for a 20-yard job needs confidence in the numbers. If the calculator shows wrong bag counts or weight, the project fails.

**Why this priority**: Mathematical errors destroy trust immediately and permanently.

**Acceptance Scenarios**:
1. **Given** a user enters 10ft × 8ft × 0.33ft (4-inch slab), **When** they click Calculate, **Then** volume = 26.4 ft³ = 0.98 yd³, 80-lb bags = 44, weight = 3,960 lb.
2. **Given** a user switches from feet to meters, **When** they recalculate, **Then** results are equivalent within rounding.

### User Story 2 - Visual clarity (Priority: P1)

A homeowner who has never ordered concrete before needs to understand what each input means.

**Why this priority**: Visual diagrams reduce bounce and increase calculator usage.

### User Story 3 - Multiple modes (Priority: P1)

A user with a fence project needs post count and concrete, not just slab volume.

**Why this priority**: Mode selection prevents wrong-calculator selection.

### User Story 4 - Accurate cost estimates (Priority: P2)

A user budgeting a project needs realistic material costs including waste.

**Why this priority**: Cost is a primary conversion metric.

## Requirements

### Functional Requirements

- **FR-001**: Each priority calculator must have independently verified formulas with documented test cases.
- **FR-002**: Concrete Calculator must support: slab, wall, footing, rectangular column, round column, tube modes.
- **FR-002b**: Each mode must have a corresponding SVG dimension diagram.
- **FR-003**: Gravel Calculator must separate compaction % from waste % as distinct parameters.
- **FR-004**: Paint Calculator must support: room dimensions, single wall, known area modes with door/window deductions and multi-coat support.
- **FR-005**: Fence Calculator must support: post spacing, panel width, gate opening, concrete per post, material cost.
- **FR-006**: Roof Pitch Calculator must accept: rise+run, pitch x:12, degrees. Return: all equivalent representations + rafter multiplier.
- **FR-007**: No calculator must contain references to unrelated trades (no QUIKRETE on board foot pages, no TxDOT on non-road pages, etc.).
- **FR-008**: All calculators must handle: zero, blank, negative, very large, and boundary inputs gracefully.
- **FR-009**: All calculators must have: visible formula or calculation breakdown, at least one worked example, practical measurement guidance.
- **FR-010**: All SVG diagrams must be responsive, accessible, and match calculator terminology exactly.

## Success Criteria

- **SC-001**: All 8 priority calculators pass mathematical regression tests with documented edge cases.
- **SC-002**: All 8 priority calculators have SVG dimension diagrams where geometry is involved.
- **SC-003**: Concrete Calculator has at least 5 shape modes with correct volume formulas.
- **SC-004**: Gravel Calculator distinguishes compaction from waste.
- **SC-005**: Paint Calculator handles doors/windows and multiple coats.
- **SC-006**: No inappropriate cross-trade references in any calculator.
- **SC-007**: All calculators pass Playwright smoke tests (input → calculate → verify output → reset → mobile).
- **SC-008**: BeyondSEO reports no major competitor gaps for the 8 priority calculators.
- **SC-009**: AdSense auditor reports zero calculator-specific issues.

## Assumptions

- Existing calculator pages should be improved in-place rather than rebuilt from scratch.
- SVG diagrams use the svg-diagram skill for generation.
- Mathematical formulas are verified against authoritative sources (engineering handbooks, manufacturer specs, government agencies).
- Competitor analysis is informational only — no content copying.
- The 233-page site build and 1063 passing tests are the baseline.
