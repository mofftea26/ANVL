# Prompt 08 â€” Build live preview for Drop Editor

> **DEPRECATED (2026-06) — do not run.** Drop-builder CMS removed. See `docs/prompts/README.md` and `docs/landing-pages.md`.

```txt
Before coding, read AGENTS.md, docs/features/drops-cms.md, docs/features/acts-builder.md, docs/design-system.md, docs/performance-accessibility-security.md.

Task: Implement live preview in the Drop Editor.

Requirements:
- Preview reflects draft drop data instantly.
- Desktop/tablet/mobile preview toggles.
- Theme palette changes update preview instantly through CSS variables.
- Act order and enable/disable update instantly.
- Preview must use the same renderer components as the public landing page where possible.
- Invalid draft acts show a clear CMS-only warning but do not crash.
- Preview must not save/publish until user clicks Save.

Keep performance in mind: memoize preview data and avoid re-rendering the whole editor unnecessarily.
Update docs/changelog.md.
```
