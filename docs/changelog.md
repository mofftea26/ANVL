# Changelog

Cursor agents must append every completed task here.

## Format
```md
## YYYY-MM-DD ΓÇö Task title
- Summary:
- Files changed:
- Tests/manual checks:
- Notes/debt:
```

## 2026-05-14 — Drop Editor live preview (Prompt 08)
- Summary: Added `DropEditorLivePreview` with mobile/tablet/desktop viewport toggles, scoped `DropPreviewThemeScope` for instant palette CSS variables, and `DropEditorPreviewErrorBoundary` so invalid draft renders surface CMS recovery instead of a blank panel. Preview composes with `useDraftActsPipeline` and `publicLandingActsFromDraftActs` so `Drop.acts` order and enable flags match `PublicLandingActs` immediately; unknown act natures use `cmsPreview` warnings. Moved preview memos before the missing-drop early return to satisfy React hook rules.
- Files changed: `src/features/admin/drops/DropEditorLivePreview.tsx`, `DropEditorRoute.tsx`, `drops.compose.ts`, `acts/landingActs.normalize.ts`, `PublicLandingActs.tsx`, `docs/features/drops-cms.md`, `docs/features/acts-builder.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm typecheck`, `pnpm build`; manual: `/admin/drops/:id` — theme + acts + viewport toggles; unsupported act shows amber CMS notice; Save still persists.
- Notes/debt: Public homepage compose still uses `landingActSequence` only until the published pipeline opts into draft acts.

## 2026-05-14 — Configurable Acts Builder in Drop Editor (Prompt 07)
- Summary: Ship the Drop Editor acts builder (DropActsBuilderPanel) for add/remove/reorder, enable/disable, nature and preset selection, shared copy fields, **act-level media** (ActMedia on LandingAct), **animation controls**, expanded per-nature **content Zod schemas** with compact sub-forms (hero/manifesto/storytelling/drop-reveal/product/material/special-event/lookbook/newsletter/final-CTA), and **product-showcase SKU pickers** fed from the admin catalog. Wired to Drop.acts, landingActSequence, and catalogProducts from DropEditorRoute. Bootstrap rows in landingActs.seed.ts now include default nimation. Extended PublicLandingAct with slotKey and enabled in the normalize pipeline. Drop preview uses composeLandingPageFromDrop with PublicLandingActs; the public homepage skips disabled acts and maps storytelling to the manifesto renderer.
- Files changed: src/features/admin/drops/DropActsBuilderPanel.tsx, DropLandingActsEditor.tsx, DropEditorRoute.tsx, cts/landingActs.types.ts, cts/landingActs.normalize.ts, cts/landingActs.seed.ts, cts/landingActs.zod.ts, src/features/marketing/public-landing/PublicLandingActs.tsx, docs/features/drops-cms.md, docs/features/acts-builder.md, docs/changelog.md
- Tests/manual checks: pnpm typecheck (pass), pnpm build (pass); manual: /admin/drops/:id → Landing acts — edit hero countdown + CTAs in content panel, toggle animation, attach act media, pick SKUs on product showcase, reorder/disable acts, confirm preview; / still renders via PublicLandingActs.
- Notes/debt: Top-level act copy and content fields on Drop.acts are stored but **not yet merged** into DropLandingContent for existing marketing components (public copy still comes from the legacy landing object). productIds on a showcase act are persisted only; the live homepage grid still uses the full drop product list until compose consumes act-level SKUs.


## 2026-05-14 ΓÇö Drop editor shell (prompt 06)
- Summary: Sectioned `/admin/drops/:id` editor with basic info, theme and branding, acts/products/SEO placeholders, save and publish with validation, optional activate-after-save, and schedule fields; `landingActSequence` normalized via `drops.actSequence.ts`.
- Files changed: `DropEditorRoute.tsx`, `drops.editor.validation.ts`, `drops.actSequence.ts`, `drops.types.ts`, `drops.service.ts`, `drops.defaults.ts`, `drops.migrate.ts`, `docs/features/drops-cms.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm typecheck`, `pnpm build`; manual: edit drop, validate slug errors, save with confirmation, schedule datetime.
- Notes/debt: Acts builder, product pickers, SEO fields, and live preview remain placeholders until later prompts.
## 2026-05-14 ΓÇö Drops admin list (CMS shell, prompt 05)
- Summary: Implemented the simplified Drops CMS list at `/admin/drops` with responsive table and card layouts, search and status tabs, columns for release date, scheduled activation, product count, and last edited time, and actions wired through `CmsClient` and TanStack Query. Extended `Drop` with `scheduled` status plus `releaseDate` and `scheduledActivationAt`; the drops service supports duplicate, archive, schedule, and safer active selection when deleting or archiving.
- Files changed: `src/features/admin/drops/drops.types.ts`, `drops.defaults.ts`, `drops.service.ts`, `DropsAdminList.tsx`, `dropsListUi.store.ts`, `useAdminDropsListQuery.ts`, `src/features/cms/types/adminDrops.types.ts`, `src/app/config/clients.ts`, `src/features/cms/api/cmsClient.localStorage.ts`, `src/features/cms/api/cmsClient.seed.ts`, `src/routes/admin/drops/index.tsx`, `DropEditorRoute.tsx`, `docs/features/drops-cms.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm run typecheck`, `pnpm run build`; manual: `/admin/drops` search and tabs, activate with confirmation, schedule, archive, delete, duplicate, mobile card layout.
- Notes/debt: Automatic activation at `scheduledActivationAt` is not implemented (storage and admin UI only). Admin drops APIs live on `CmsClient` (not `SeoClient`) alongside runtime SEO split from prompt 03.
## 2026-05-14 ΓÇö Public layout active drop theme (prompt 04)
- Summary: Added `ActiveDropThemeProvider`, shared `dropPaletteStyle` helpers, `CmsClient.getActiveDrop()`, SSR `<style>` injection on the root route for public pages, and client-side sync when drops change; admin routes skip global theme injection. Removed global `:root` mutation from `AppProviders` / `ActiveDropThemeBridge` in favor of the provider + head pipeline.
- Files changed: `src/app/config/clients.ts`, `src/features/cms/api/cmsClient.localStorage.ts`, `src/features/cms/api/cmsClient.seed.ts`, `src/features/admin/drops/dropPaletteStyle.ts`, `src/app/providers/ActiveDropThemeProvider.tsx`, `src/app/providers/ActiveDropThemeBridge.tsx`, `src/app/providers/AppProviders.tsx`, `src/routes/__root.tsx`, `docs/design-system.md`, `docs/features/drops-cms.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass), `pnpm test` (no test files in repo; exits 1). Manual: load `/` and confirm themed surfaces; open `/admin` and confirm default/base chrome without campaign `:root` override; change active drop in admin and return to storefront to confirm palette updates.
- Notes/debt: Future CMS adapters must implement `getActiveDrop()` with the same SSR-safe semantics as seed/localStorage clients.
## 2026-05-14 ΓÇö Runtime client interfaces and seed/localStorage adapters
- Summary: Introduced `SeoClient` and `SiteSettingsClient`, moved SEO off `CmsClient`, and added `createRuntimeClients({ isServer })` so SSR uses deterministic seed adapters while the browser uses localStorage-backed admin services. Shop index route demonstrates `runtimeClients.seo` in the loader. Removed legacy `cmsClient.mock` / `commerceClient.mock` modules. Updated architecture, drops CMS, SEO docs, and README.
- Files changed: `src/app/config/clients.ts`, `src/app/config/runtime.ts`, `src/features/cms/api/*` (seed snapshots, `resolveSeoByPath`, CMS/SEO/site-settings seed + localStorage adapters), `src/features/products/api/commerceClient.seed.ts`, `src/features/products/api/commerceClient.localStorage.ts`, `src/features/admin/drops/DropsAdminList.tsx` (build stub), `src/routes/shop/index.tsx`, removed mock commerce/CMS clients, `docs/architecture.md`, `docs/features/drops-cms.md`, `docs/features/seo.md`, `README.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm typecheck`, `pnpm build`, `pnpm vitest run --passWithNoTests` (no unit tests in repo yet); manual: `/shop` document title and meta description align with `SeoClient` output on full page load and client navigation.
- Notes/debt: Analytics and payment clients remain mocks; other routes can adopt `SeoClient` incrementally; `runtimeClients.siteSettings` is ready for future header/footer loader refactors. Minimal `DropsAdminList` stub added because `origin/cms` imported the module without shipping the implementation (unblocks `pnpm build`).
## 2026-05-14 ΓÇö Core CMS/catalog Zod schemas and Drop 01 seed
- Summary: Added canonical Zod 4 schemas and inferred TypeScript types for drops, landing acts, catalog commerce products, SEO documents, money/media, navigation, and site settings; added validated seed for Drop 01 ΓÇö The Oath and three catalog placeholders (Oversized Tee, Stringer, Compression Tee) using ANVL brand tokens.
- Files changed: `src/features/drops/**`, `src/features/landing/**`, `src/features/seo/**`, `src/features/products/schemas/commerce.schema.ts`, `src/features/products/types/commerce.types.ts`, `src/shared/schemas/**`, `src/shared/types/**`, `src/content/seed/drop-01-the-oath.seed.ts`, `docs/architecture.md`, `docs/changelog.md`, `docs/features/drops-cms.md`, `docs/features/acts-builder.md`, `docs/features/products-commerce.md`, `docs/features/seo.md`
- Tests/manual checks: `pnpm exec tsc --noEmit` (pass); `pnpm build` (pass). `pnpm test` reports no test files in the repository.
- Notes/debt: Storefront `Product` in `src/features/products/types/product.types.ts` remains the shop presentation model; canonical commerce document is `CatalogProduct` until adapters unify the two.
## 2026-05-14 ΓÇö Prompt 01: Audit current app (architecture map)
- Summary: Documented the as-built folder layout, all public and admin routes, CMS vs hard-coded surfaces, SSR/hydration risks, browser-only touchpoints, GSAP/Lenis/Framer usage, cart-to-checkout flow, a small-task refactor order, and high-risk files. Linked the inventory from `docs/architecture.md`.
- Files changed: `docs/technical-debt.md`, `docs/architecture.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm build` (see task verification).
- Notes/debt: No application code changes; audit reflects TanStack Router tree and `src/` layout at audit time.

## 2026-05-14 ΓÇö Add project documentation and agent prompts
- Summary: Added `AGENTS.md` at the repository root, populated `docs/` with core and feature documentation, and added the numbered Cursor prompt library under `docs/prompts/` per the documentation index.
- Files changed: `AGENTS.md`, `docs/README.md`, `docs/*.md` (core docs), `docs/features/*.md`, `docs/prompts/*.md`, `README.md`, `docs/changelog.md`
- Tests/manual checks: Verified file tree under `docs/` and `AGENTS.md` presence; no application code changes.
- Notes/debt: Brand PDF/DOCX assets were already present under `docs/`; new markdown files sit alongside them.

## 2026-05-14 ΓÇö Runtime client interfaces + seed / browser adapters (prompt 03)
- Summary: Added `SeoClient` and `SiteSettingsClient`, extended `CmsClient` with `getActiveDrop()`, and introduced `createRuntimeClients({ isServer })` so SSR uses deterministic seed adapters while the browser uses localStorage-aligned services. `/shop` now loads SEO via `runtimeClients.seo`. Removed legacy `cmsClient.mock` / `commerceClient.mock` in favor of `*.seed.ts` and `*.localStorage.ts` modules.
- Files changed: `src/app/config/clients.ts`, `src/app/config/runtime.ts`, `src/features/cms/api/*`, `src/features/products/api/commerceClient.*.ts`, `src/routes/shop/index.tsx`, `README.md`, `docs/features/drops-cms.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm typecheck`, `pnpm build`, `pnpm test`; manual: open `/shop`, view page source or devtools for meta title/description/canonical from `getSeoByPath('/shop')`.
- Notes/debt: Analytics and payment remain mocks; `runtimeClients.siteSettings` is ready for future header/footer loader refactors.

## 2026-05-14 ΓÇö Drop editor shell (prompt 06)
- Summary: Scrollable drop editor shell with Basic info, Theme & branding, Acts/Products/SEO placeholders, Save & publish (validation, schedule, activate-after-save, modal, success flash), and preview placeholder. Added `scheduled` status and `scheduledActivationAt` on `Drop` with merge persistence. Added `drops.actSequence` and default `landingActSequence` on seeded/migrated drops so storage merges stay type-safe.
- Files changed: `src/features/admin/drops/DropEditorRoute.tsx`, `src/features/admin/drops/drops.editor.validation.ts`, `src/features/admin/drops/drops.types.ts`, `src/features/admin/drops/drops.service.ts`, `src/features/admin/drops/drops.actSequence.ts`, `src/features/admin/drops/drops.defaults.ts`, `src/features/admin/drops/drops.migrate.ts`, `docs/features/drops-cms.md`, `docs/changelog.md`
- Tests/manual checks: `npm run typecheck` (no errors in drop editor paths); manual: `/admin/drops/$id` ΓÇö invalid save shows errors; confirm save shows toast; schedule persists ISO in localStorage.
- Notes/debt: Acts builder, product assignment, and SEO forms are placeholders per prompt.
