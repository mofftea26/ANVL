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

## 2026-05-14 — Runtime client interfaces + seed / browser adapters (prompt 03)
- Summary: Added `SeoClient` and `SiteSettingsClient`, extended `CmsClient` with `getActiveDrop()`, and introduced `createRuntimeClients({ isServer })` so SSR uses deterministic seed adapters while the browser uses localStorage-aligned services. `/shop` now loads SEO via `runtimeClients.seo`. Removed legacy `cmsClient.mock` / `commerceClient.mock` in favor of `*.seed.ts` and `*.localStorage.ts` modules.
- Files changed: `src/app/config/clients.ts`, `src/app/config/runtime.ts`, `src/features/cms/api/*`, `src/features/products/api/commerceClient.*.ts`, `src/routes/shop/index.tsx`, `README.md`, `docs/features/drops-cms.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm typecheck`, `pnpm build`, `pnpm test`; manual: open `/shop`, view page source or devtools for meta title/description/canonical from `getSeoByPath('/shop')`.
- Notes/debt: Analytics and payment remain mocks; `runtimeClients.siteSettings` is ready for future header/footer loader refactors.

## 2026-05-14 — Drop editor shell (prompt 06)
- Summary: Scrollable drop editor shell with Basic info, Theme & branding, Acts/Products/SEO placeholders, Save & publish (validation, schedule, activate-after-save, modal, success flash), and preview placeholder. Added `scheduled` status and `scheduledActivationAt` on `Drop` with merge persistence. Added `drops.actSequence` and default `landingActSequence` on seeded/migrated drops so storage merges stay type-safe.
- Files changed: `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/admin/drops/drops.editor.validation.ts`, `src/features/admin/drops/drops.types.ts`, `src/features/admin/drops/drops.service.ts`, `src/features/admin/drops/drops.actSequence.ts`, `src/features/admin/drops/drops.defaults.ts`, `src/features/admin/drops/drops.migrate.ts`, `docs/features/drops-cms.md`, `docs/changelog.md`
- Tests/manual checks: `npm run typecheck` (no errors in drop editor paths); manual: `/admin/drops/$id` — invalid save shows errors; confirm save shows toast; schedule persists ISO in localStorage.
- Notes/debt: Acts builder, product assignment, and SEO forms are placeholders per prompt.
