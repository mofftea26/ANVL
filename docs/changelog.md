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

## 2026-05-14 — Active drop page + dynamic nav (Prompt 10)
- Summary: Finished wiring the public drop experience: root layout injects sanitized active-drop palette CSS on SSR for public routes, `/drop/:slug` uses `runtimeClients.cms.getActiveDrop()` with slug redirect, `DropActivePageView` (hero backdrop, release countdown, product cards to PDP), and route head passes `ogTitle` / `ogDescription` into `buildSeoMeta`. Drop editor adds optional release datetime and hero backdrop fields.
- Files changed: `src/routes/__root.tsx`, `src/routes/drop/$slug.tsx`, `src/features/admin/drops/DropEditorRoute.tsx`, `docs/features/drops-cms.md`, `docs/features/seo.md`, `docs/changelog.md` (plus existing Prompt 10 building blocks already on branch: `dropPaletteStyle.ts`, `DropActivePageView.tsx`, `DropReleaseSection.tsx`, `drops.compose.ts` nav labels, `meta.ts`, `ActiveDropThemeBridge.tsx`, `cms.types.ts`).
- Tests/manual checks: `pnpm typecheck`, `pnpm build`; `pnpm test` (no spec files, Vitest exits 1). Manual: `/drop/the-oath` (active slug), nav label matches `drop.title`, view page source for `#anvl-active-drop-theme-ssr` outside `/admin`, product cards open PDPs.
- Notes/debt: `getStorefrontProductsForDropSlug` remains synchronous; only the CMS active-drop read is awaited in the route loader.

## 2026-05-14 — Public landing page act renderers (Prompt 09)
- Summary: Replaced hard-coded homepage sections with `PublicLandingActs`, driven by `landingActs` on `LandingPageCmsContent` synthesized from the active drop's `landingActSequence`. Added `drops.actSequence` plus `acts/landingActs.types` and `acts/landingActs.normalize`, wired compose/defaults/merge, lazy-loaded post-hero acts, unknown-nature fallback, and tablet-or-above + reduced-motion gating for `HeroForgeSequence` GSAP. Aligned admin product seed defaults with `AdminProduct` / `ProductVariantAvailability` (`currency`, `sourceType`, `reservedQuantity`) and expanded drops list status tabs for `scheduled`.
- Files changed: `src/features/admin/drops/drops.types.ts`, `drops.actSequence.ts`, `drops.defaults.ts`, `drops.migrate.ts`, `drops.service.ts`, `drops.compose.ts`, `dropsListUi.store.ts`, `src/features/admin/drops/acts/landingActs.types.ts`, `acts/landingActs.normalize.ts`, `src/features/admin/landing-cms/landingCms.types.ts`, `landingCms.defaults.ts`, `landingCms.merge.ts`, `src/features/marketing/public-landing/PublicLandingActs.tsx`, `src/features/marketing/components/HeroForgeSequence.tsx`, `src/routes/index.tsx`, `src/features/admin/products/products.defaults.ts` (and related product admin files on this branch), `docs/features/drops-cms.md`, `docs/features/acts-builder.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm exec tsc --noEmit`, `pnpm build`; manual: load `/` SSR and client, toggle disabled slots via stored drop JSON if applicable, resize hero across 767px breakpoint, enable prefers-reduced-motion and confirm static hero.
- Notes/debt: `Drop.acts` remains for future rich act rows; the public homepage still reads section copy from existing `LandingPageCmsContent` fields keyed by pipeline order.

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
