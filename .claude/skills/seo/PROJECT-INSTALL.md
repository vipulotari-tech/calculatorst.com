# Claude SEO project-local install

Source: https://github.com/AgriciDaniel/claude-seo
Release: v2.4.1
Upstream commit: ff87fcee0734845d3f59128c8c905799ee2298da
Installed into this repository on 2026-09-30.

This is the project-local equivalent of the upstream manual installer. Skill and agent files are tracked under `.claude/skills/` and `.claude/agents/`. Generated Python virtual environments, caches, credentials, and Playwright browser binaries are intentionally not committed.

Markdown runtime references were adapted from the plugin root to this repository's project-local paths. Run the bundled launcher from the repository when setup is explicitly desired:

```bash
"$CLAUDE_PROJECT_DIR/.claude/skills/seo/scripts/claude-seo" setup
```

The upstream MIT license is retained at `.claude/skills/seo/LICENSE`.
