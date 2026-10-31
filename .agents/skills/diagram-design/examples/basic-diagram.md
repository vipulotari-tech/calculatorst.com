# Example: generate a basic architecture diagram

This walkthrough shows how to ask an AI coding agent to produce one clean,
self-contained architecture diagram. It is a minimal path — no import, no
animation, no brand onboarding beyond the default skin.

## What you will end up with

A single `.html` file (for example `my-architecture.html`) that:

- opens offline in any browser,
- has inline SVG + inline CSS and no external dependencies,
- follows the editorial design system in `references/style-guide.md`,
- passes the optional `self_check.py` contract.

## Step 1 — point the agent at the skill

Make sure `SKILL.md`, `references/`, `assets/` and `scripts/` are visible to
your agent (see the README's "Using with AI coding agents"). Then ask the agent:

> "Read SKILL.md, then create an architecture diagram for my system. Keep it
> under 9 nodes."

The agent should state a short plan before drawing: the chosen visual type
(`Architecture`), the size preset, and what the complexity budget will cut.

## Step 2 — start from a real template, not a blank page

Tell the agent to base the file on one of the bundled starters rather than
inventing markup from scratch:

- `assets/template.html` — minimal light (default, screenshot-ready),
- `assets/template-dark.html` — minimal dark,
- `assets/template-full.html` — full editorial with cards.

A close finished example already exists at `assets/example-architecture.html`;
the agent may study it for layout and composition, but must take colors and
tokens from `references/style-guide.md`, not copy the example's hex values.

## Step 3 — give the agent the content

Describe the components and relationships in plain language, for example:

> "A web frontend, an API gateway, a PostgreSQL database, and an object store.
> The frontend calls the gateway over HTTPS; the gateway reads and writes the
> database; the gateway uploads to the object store asynchronously."

The agent keeps the diagram under the per-type budget (max 9 nodes, max 12
connectors) and uses `accent` on at most 1–2 focal nodes.

## Step 4 — write the file as one self-contained HTML

The output must be one `.html` file:

- inline SVG only, no external images,
- inline CSS only, no external stylesheet,
- no `<script>` at all (static by default),
- an accessible figure: `<svg role="img" aria-labelledby="...">` with a first-child
  `<title>` and a `<desc>`, IDs prefixed by the file slug.

Save it next to your project, e.g. `my-architecture.html`.

## Step 5 — optionally run the self-check

From the repo root, validate the generated file:

```bash
python3 scripts/self_check.py my-architecture.html
```

On Windows, use `python` if `python3` is not on PATH:

```powershell
python scripts/self_check.py my-architecture.html
```

A passing run prints an `OK ...` line. This is optional — it checks the
accessible-SVG contract, single-file safety and animation basics. If it reports
a violation, open the file and fix the named issue, then re-run.

## Step 6 — open it

Double-click `my-architecture.html` (or open it in a browser). It renders fully
offline. If the layout needs trimming, ask the agent to remove nodes, merge
nodes that always travel together, or split into an overview + detail diagram.
