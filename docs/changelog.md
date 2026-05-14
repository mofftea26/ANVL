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

## 2026-05-14 — Add project documentation and agent prompts
- Summary: Added `AGENTS.md` at the repository root, populated `docs/` with core and feature documentation, and added the numbered Cursor prompt library under `docs/prompts/` per the documentation index.
- Files changed: `AGENTS.md`, `docs/README.md`, `docs/*.md` (core docs), `docs/features/*.md`, `docs/prompts/*.md`, `README.md`, `docs/changelog.md`
- Tests/manual checks: Verified file tree under `docs/` and `AGENTS.md` presence; no application code changes.
- Notes/debt: Brand PDF/DOCX assets were already present under `docs/`; new markdown files sit alongside them.

## 2026-05-14 — Drop editor shell (prompt 06)
- Summary: Scrollable drop editor shell with Basic info, Theme & branding, Acts/Products/SEO placeholders, Save & publish (validation, schedule, activate-after-save, modal, success flash), and preview placeholder. Added `scheduled` status and `scheduledActivationAt` on `Drop` with merge persistence.
- Files changed: `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/admin/drops/drops.editor.validation.ts`, `src/features/admin/drops/drops.types.ts`, `src/features/admin/drops/drops.service.ts`, `docs/features/drops-cms.md`, `docs/changelog.md`
- Tests/manual checks: `npm run typecheck` (no errors in drop editor paths); manual: `/admin/drops/$id` — invalid save shows errors; confirm save shows toast; schedule persists ISO in localStorage.
- Notes/debt: Acts builder, product assignment, and SEO forms are placeholders per prompt.

