## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Diagram design skill

The `diagram-design` skill is vendored as a Git submodule at `.claude/skills/diagram-design`. Before creating or redesigning diagrams, read its `SKILL.md` and the matching type reference under `references/`. For construction calculators, use the skill's design and accessibility rules, but implement production visuals as responsive, inline SVG/Astro components that integrate with the existing site rather than shipping standalone HTML files as calculator UI.

- Use `docs/diagram-design-calculatorst-brand.md` as the project's brand and engineering-accuracy reference; the live site CSS is the source of truth for semantic colors and fonts.
- Prefer accurate, input-aware engineering illustrations for dimensions, sections, and measurement callouts.
- Keep labels and units consistent with the calculator model and user inputs; do not alter calculation logic just to fit a diagram.
- Never generate sample dimensions, waste percentages, densities, or outputs from a slug/hash. Use actual model values or label any example explicitly as illustrative.
- Include accessible SVG title/description, unique IDs, responsive sizing, and dark-mode compatibility.
- Run math tests, `astro check`, build, SEO tests, browser tests, and the selected-page diagram audit when applicable.
- Audit and repair one calculator page at a time; do not mass-rewrite unrelated pages or deploy unvalidated changes.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
