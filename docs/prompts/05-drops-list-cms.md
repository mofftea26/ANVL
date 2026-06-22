# Prompt 05 â€” Build simplified Drops CMS list

> **DEPRECATED (2026-06) — do not run.** Drop-builder CMS removed. See `docs/prompts/README.md` and `docs/landing-pages.md`.

```txt
Before coding, read AGENTS.md, docs/features/drops-cms.md, docs/design-system.md, docs/cursor-workflow.md.

Task: Build or refactor the admin Drops section into a clean, non-cramped list experience.

Requirements:
- Show drops in cards or table depending on available layout.
- Include search and status tabs.
- Show title, status, release date, scheduled activation, product count, last edited.
- Actions: Create, Edit, Preview, Duplicate, Set Active, Schedule, Archive, Delete.
- Only one drop can be active.
- Make the active drop visually obvious.
- Mobile-friendly admin view.
- Use Zustand only for local UI state.
- Use runtime CMS client for data.

Do not build the full editor in this task; create navigation/action shell and data plumbing.
Update docs/changelog.md.
```
