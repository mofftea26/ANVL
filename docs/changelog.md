# Changelog

Cursor agents must append every completed task here.

## Format
```md
## YYYY-MM-DD — Task title
- Summary:
- Files changed:
- Tests/manual checks:
- Notes/debt:
```

## 2026-05-14 — Prompt 01: Audit current app (architecture map)
- Summary: Documented the as-built folder layout, all public and admin routes, CMS vs hard-coded surfaces, SSR/hydration risks, browser-only touchpoints, GSAP/Lenis/Framer usage, cart-to-checkout flow, a small-task refactor order, and high-risk files. Linked the inventory from `docs/architecture.md`.
- Files changed: `docs/technical-debt.md`, `docs/architecture.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm build` (see task verification).
- Notes/debt: No application code changes; audit reflects TanStack Router tree and `src/` layout at audit time.

## 2026-05-14 — Add project documentation and agent prompts
- Summary: Added `AGENTS.md` at the repository root, populated `docs/` with core and feature documentation, and added the numbered Cursor prompt library under `docs/prompts/` per the documentation index.
- Files changed: `AGENTS.md`, `docs/README.md`, `docs/*.md` (core docs), `docs/features/*.md`, `docs/prompts/*.md`, `README.md`, `docs/changelog.md`
- Tests/manual checks: Verified file tree under `docs/` and `AGENTS.md` presence; no application code changes.
- Notes/debt: Brand PDF/DOCX assets were already present under `docs/`; new markdown files sit alongside them.
