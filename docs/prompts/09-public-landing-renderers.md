# Prompt 09 â€” Refactor public landing page to render active drop acts

> **DEPRECATED (2026-06) — do not run.** Drop-builder CMS removed. See `docs/prompts/README.md` and `docs/landing-pages.md`.

```txt
Before coding, read AGENTS.md, docs/features/acts-builder.md, docs/features/drops-cms.md, docs/design-system.md, docs/performance-accessibility-security.md.

Task: Replace hard-coded landing sections with active-drop act rendering while preserving the premium ANVL identity and existing animation quality.

Requirements:
- Landing page gets active drop from route loader/runtime CMS client.
- Render acts by nature + preset.
- Preserve the current six-act visual direction as initial presets/seed data.
- Unknown act types fail gracefully.
- Heavy renderers lazy-load where appropriate.
- GSAP animations load only on client and only for tablet/desktop or when allowed.
- Mobile must be low-animation and fast.
- Respect prefers-reduced-motion.

Update docs/changelog.md.
```
