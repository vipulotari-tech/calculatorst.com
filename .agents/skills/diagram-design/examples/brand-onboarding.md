# Example: onboard brand tokens (skin-on-demand theming)

The skill ships with a neutral default skin: paper `#f5f5f5`, ink `#2d3142`,
accent `#eb6c36` (atomic-tangerine), with Geist / Geist Mono / Instrument Serif
typography. For branded work you replace those tokens once, in one place, and
every diagram follows.

## Where the tokens live

The single source of truth is `references/style-guide.md`. It defines semantic
roles — `paper`, `paper-2`, `ink`, `muted`, `soft`, `rule`, `rule-solid`,
`accent`, `accent-tint`, `link` — not raw hex scattered across files. When
templates and type references say "accent", they mean whatever hex is currently
in that file.

## The onboarding gate

On the first diagram in a new project, if tokens are still the shipped defaults,
the skill pauses and asks whether to customize. This is by design — it stops
default-skinned diagrams from silently landing in a branded project. Once the
style guide has been customized (or the user explicitly opts for the default),
the gate is skipped on later runs.

## How to onboard a brand

The methods below are described in detail in `references/onboarding.md`. Pick
one:

1. **From a website URL** — give the agent a URL and let it extract brand tokens
   (palette, type families) from the site. Do this only when the user explicitly
   requests it; the skill never browses the web for inspiration on its own.
2. **From a local design-system folder** — point the agent at a local directory
   that holds your design tokens or styles, and let it read them.
3. **Paste tokens by hand** — give the agent your brand hex values and font
   names directly.
4. **Proceed with the default** — explicitly accept the shipped neutral skin.

After onboarding, the skill offers to save the result as a named client profile
(see `references/profiles.md`) so future projects can load it by name.

## Apply the skin to a diagram

1. Confirm the active tokens in `references/style-guide.md` match your brand.
2. Have the agent start a diagram from `assets/template.html` (or the dark /
   full-editorial variant).
3. The agent pulls colors and type families from `style-guide.md` — **not** from
   the example HTML in `assets/`. Those examples are layout references only.

## Style gates that still apply

Changing tokens does not relax the editorial rules:

- `accent` still marks at most 1–2 focal nodes per diagram.
- Connectors stay rounded right-angle with the six mandatory connector rules.
- The 4px grid and the per-type complexity budget still hold.
- Fonts must be locally available or bundled; output stays fully offline — the
  skin never pulls web fonts at render time.

## Verify

```bash
python3 scripts/self_check.py my-branded-diagram.html
```

This confirms the file remains a single self-contained HTML and keeps the
accessible-SVG contract. Brand fidelity itself is a visual check: open the file
and confirm the palette and typography match the onboarded tokens.
