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

## 2026-05-14 — Drops admin list (CMS shell)
- Summary: Implemented the simplified Drops CMS list at `/admin/drops` with responsive table and card layouts, search and status tabs, columns for release date, scheduled activation, product count, and last edited time, and actions wired through `CmsClient` and TanStack Query. Extended `Drop` with `scheduled` status plus `releaseDate` and `scheduledActivationAt`; the drops service supports duplicate, archive, schedule, and safer active selection when deleting or archiving.
- Files changed: `src/features/admin/drops/drops.types.ts`, `drops.defaults.ts`, `drops.service.ts`, `DropsAdminList.tsx`, `dropsListUi.store.ts`, `useAdminDropsListQuery.ts`, `src/features/cms/types/adminDrops.types.ts`, `src/app/config/clients.ts`, `src/features/cms/api/cmsClient.mock.ts`, `src/routes/admin/drops/index.tsx`, `DropEditorRoute.tsx`, `docs/features/drops-cms.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm run typecheck`, `pnpm run test` (no test files in repo; Vitest exits with code 1), `pnpm run build`; manual: `/admin/drops` search and tabs, activate with confirmation, schedule, archive, delete, duplicate, mobile card layout.
- Notes/debt: Automatic activation at `scheduledActivationAt` is not implemented (storage and admin UI only).

## 2026-05-14 — Add project documentation and agent prompts
- Summary: Added `AGENTS.md` at the repository root, populated `docs/` with core and feature documentation, and added the numbered Cursor prompt library under `docs/prompts/` per the documentation index.
- Files changed: `AGENTS.md`, `docs/README.md`, `docs/*.md` (core docs), `docs/features/*.md`, `docs/prompts/*.md`, `README.md`, `docs/changelog.md`
- Tests/manual checks: Verified file tree under `docs/` and `AGENTS.md` presence; no application code changes.
- Notes/debt: Brand PDF/DOCX assets were already present under `docs/`; new markdown files sit alongside them.
