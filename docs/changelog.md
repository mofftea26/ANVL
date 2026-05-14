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

## 2026-05-14 — Runtime client interfaces and seed/localStorage adapters
- Summary: Introduced `SeoClient` and `SiteSettingsClient`, moved SEO off `CmsClient`, and added `createRuntimeClients({ isServer })` so SSR uses deterministic seed adapters while the browser uses localStorage-backed admin services. Shop index route demonstrates `runtimeClients.seo` in the loader. Removed legacy `cmsClient.mock` / `commerceClient.mock` modules. Updated architecture, drops CMS, SEO docs, and README.
- Files changed: `src/app/config/clients.ts`, `src/app/config/runtime.ts`, `src/features/cms/api/*` (seed snapshots, `resolveSeoByPath`, CMS/SEO/site-settings seed + localStorage adapters), `src/features/products/api/commerceClient.seed.ts`, `src/features/products/api/commerceClient.localStorage.ts`, `src/features/admin/drops/DropsAdminList.tsx` (build stub), `src/routes/shop/index.tsx`, removed mock commerce/CMS clients, `docs/architecture.md`, `docs/features/drops-cms.md`, `docs/features/seo.md`, `README.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm typecheck`, `pnpm build`, `pnpm vitest run --passWithNoTests` (no unit tests in repo yet); manual: `/shop` document title and meta description align with `SeoClient` output on full page load and client navigation.
- Notes/debt: Analytics and payment clients remain mocks; other routes can adopt `SeoClient` incrementally; `runtimeClients.siteSettings` is ready for future header/footer loader refactors. Minimal `DropsAdminList` stub added because `origin/cms` imported the module without shipping the implementation (unblocks `pnpm build`).

## 2026-05-14 — Add project documentation and agent prompts
- Summary: Added `AGENTS.md` at the repository root, populated `docs/` with core and feature documentation, and added the numbered Cursor prompt library under `docs/prompts/` per the documentation index.
- Files changed: `AGENTS.md`, `docs/README.md`, `docs/*.md` (core docs), `docs/features/*.md`, `docs/prompts/*.md`, `README.md`, `docs/changelog.md`
- Tests/manual checks: Verified file tree under `docs/` and `AGENTS.md` presence; no application code changes.
- Notes/debt: Brand PDF/DOCX assets were already present under `docs/`; new markdown files sit alongside them.
