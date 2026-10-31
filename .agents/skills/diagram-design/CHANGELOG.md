# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.6.0] - 2026-09-17

### Added

- Initial public release. Forty self-contained, accessible HTML/SVG diagram types
  spanning architecture, flow, data, chart, software-engineering and strategy
  visualizations, each produced as a single offline `.html` file with inline SVG
  and CSS and no external dependencies.
- Redraw support for existing sources: draw.io (`.drawio` / `.drawio.png` /
  `.drawio.svg`), Mermaid (`.mmd` or a fenced `mermaid` block), and Excalidraw
  (`.excalidraw`), via `scripts/drawio_extract.py`, `scripts/mermaid_extract.py`
  and `scripts/excalidraw_extract.py`.
- Skin-on-demand theming: brand tokens onboarded from a website URL, a local
  design-system folder, or pasted by hand, with a single token source in
  `references/style-guide.md`.
- Semantic patterns, editorial callouts, accessible (reduced-motion-safe)
  animation, sketchy/hand-drawn styling and a terminal-style variant.
- `scripts/self_check.py`, an optional validator for the accessible-SVG
  contract, single-file safety and animation basics of a generated diagram.
