# CalculatorSt diagram brand reference

This file records the site's actual visual system for the Diagram Design skill. Treat it as a project-specific adaptation guide; do not copy the skill's default palette into production diagrams.

## Source of truth

- Site: https://calculatorst.com/
- CSS source: `src/styles/global.css`
- UI system: Tailwind CSS v4 and shadcn-style semantic tokens
- Font assets: Inter Variable and JetBrains Mono

## Visual direction

Premium, restrained, engineering-focused, editorial. Keep diagrams subordinate to the calculator and use clear measurement callouts, ample whitespace, thin strokes, simple geometry, and a single focal accent. Avoid arbitrary per-slug rainbow colors, decorative 3D effects, photorealism, or claims that a schematic is to scale when it is not.

## Brand tokens

The live stylesheet expresses most colors in OKLCH. Use the semantic CSS custom properties in SVG instead of hard-coded colors so the diagram follows light/dark themes:

- `--color-background`: diagram canvas
- `--color-foreground`: primary labels and strokes
- `--color-card`: shape surfaces
- `--color-muted` / `--color-muted-foreground`: secondary surfaces and labels
- `--color-border`: dimension lines and outlines
- `--color-primary`: focal emphasis
- `--color-chart-1` through `--color-chart-5`: only when multiple data series genuinely need distinction

Do not use pure white for every surface; the site's light background is warm off-white. Preserve dark-mode contrast by using semantic variables rather than copied light-mode hex values.

## Typography

- General text: Inter Variable
- Technical labels, dimensions, formula fragments: JetBrains Mono
- Use compact uppercase eyebrow labels sparingly. Dimension labels must remain readable on mobile and must not collide with geometry.

## Engineering accuracy rules

1. Diagram labels must be sourced from the same calculator fields and units as the page; never fabricate sample dimensions or waste values based on a slug/hash.
2. Draw the correct shape for the selected mode. If a generic schematic cannot represent the selected geometry, explicitly label it as a conceptual schematic rather than implying geometric accuracy.
3. Keep displayed units consistent with unit selectors. Convert only for a documented formula, and make conversion visible when it materially changes interpretation.
4. Distinguish user inputs, computed quantities, allowances, supplier rounding, and planning assumptions.
5. Do not change calculation formulas as part of a diagram-only fix. If a discrepancy reveals a formula issue, record it separately for review.
6. Every inline SVG needs a unique, stable title/description relationship, responsive viewBox sizing, and no clipped labels at 390px viewport.
7. Check light/dark themes, keyboard-visible controls, print/share paths where applicable, and browser console errors.
8. Test zero, missing, negative, boundary, and unit-conversion cases when supported by the calculator model. Never invent material densities or engineering approvals.

## Skill workflow

Before editing diagrams, read `.claude/skills/diagram-design/SKILL.md` and the matching reference. Use its visual hierarchy and accessibility conventions, but implement calculator diagrams as integrated Astro/inline-SVG components, not standalone HTML deliverables. Fix one calculator at a time and run math tests, `astro check`, build, SEO tests, browser tests, and the selected-page diagram audit before considering a repair complete.
