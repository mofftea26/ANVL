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

## 2026-05-14 — Public layout active drop theme (prompt 04)
- Summary: Added `ActiveDropThemeProvider`, shared `dropPaletteStyle` helpers, `CmsClient.getActiveDrop()`, SSR `<style>` injection on the root route for public pages, and client-side sync when drops change; admin routes skip global theme injection. Removed global `:root` mutation from `AppProviders` / `ActiveDropThemeBridge` in favor of the provider + head pipeline.
- Files changed: `src/app/config/clients.ts`, `src/features/cms/api/cmsClient.mock.ts`, `src/features/admin/drops/dropPaletteStyle.ts`, `src/app/providers/ActiveDropThemeProvider.tsx`, `src/app/providers/ActiveDropThemeBridge.tsx`, `src/app/providers/AppProviders.tsx`, `src/routes/__root.tsx`, `docs/design-system.md`, `docs/features/drops-cms.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass), `pnpm test` (no test files in repo; exits 1). Manual: load `/` and confirm themed surfaces; open `/admin` and confirm default/base chrome without campaign `:root` override; change active drop in admin and return to storefront to confirm palette updates.
- Notes/debt: Future CMS adapters must implement `getActiveDrop()` with the same SSR-safe semantics as the mock client.

## 2026-05-14 — Add project documentation and agent prompts
- Summary: Added `AGENTS.md` at the repository root, populated `docs/` with core and feature documentation, and added the numbered Cursor prompt library under `docs/prompts/` per the documentation index.
- Files changed: `AGENTS.md`, `docs/README.md`, `docs/*.md` (core docs), `docs/features/*.md`, `docs/prompts/*.md`, `README.md`, `docs/changelog.md`
- Tests/manual checks: Verified file tree under `docs/` and `AGENTS.md` presence; no application code changes.
- Notes/debt: Brand PDF/DOCX assets were already present under `docs/`; new markdown files sit alongside them.
