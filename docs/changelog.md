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
- Files changed: `src/app/config/clients.ts`, `src/features/cms/api/cmsClient.localStorage.ts`, `src/features/cms/api/cmsClient.seed.ts`, `src/features/admin/drops/dropPaletteStyle.ts`, `src/app/providers/ActiveDropThemeProvider.tsx`, `src/app/providers/ActiveDropThemeBridge.tsx`, `src/app/providers/AppProviders.tsx`, `src/routes/__root.tsx`, `docs/design-system.md`, `docs/features/drops-cms.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm typecheck` (pass), `pnpm build` (pass), `pnpm test` (no test files in repo; exits 1). Manual: load `/` and confirm themed surfaces; open `/admin` and confirm default/base chrome without campaign `:root` override; change active drop in admin and return to storefront to confirm palette updates.
- Notes/debt: Future CMS adapters must implement `getActiveDrop()` with the same SSR-safe semantics as seed/localStorage clients.
## 2026-05-14 — Runtime client interfaces and seed/localStorage adapters
- Summary: Introduced `SeoClient` and `SiteSettingsClient`, moved SEO off `CmsClient`, and added `createRuntimeClients({ isServer })` so SSR uses deterministic seed adapters while the browser uses localStorage-backed admin services. Shop index route demonstrates `runtimeClients.seo` in the loader. Removed legacy `cmsClient.mock` / `commerceClient.mock` modules. Updated architecture, drops CMS, SEO docs, and README.
- Files changed: `src/app/config/clients.ts`, `src/app/config/runtime.ts`, `src/features/cms/api/*` (seed snapshots, `resolveSeoByPath`, CMS/SEO/site-settings seed + localStorage adapters), `src/features/products/api/commerceClient.seed.ts`, `src/features/products/api/commerceClient.localStorage.ts`, `src/features/admin/drops/DropsAdminList.tsx` (build stub), `src/routes/shop/index.tsx`, removed mock commerce/CMS clients, `docs/architecture.md`, `docs/features/drops-cms.md`, `docs/features/seo.md`, `README.md`, `docs/changelog.md`
- Tests/manual checks: `pnpm typecheck`, `pnpm build`, `pnpm vitest run --passWithNoTests` (no unit tests in repo yet); manual: `/shop` document title and meta description align with `SeoClient` output on full page load and client navigation.
- Notes/debt: Analytics and payment clients remain mocks; other routes can adopt `SeoClient` incrementally; `runtimeClients.siteSettings` is ready for future header/footer loader refactors. Minimal `DropsAdminList` stub added because `origin/cms` imported the module without shipping the implementation (unblocks `pnpm build`).
## 2026-05-14 — Core CMS/catalog Zod schemas and Drop 01 seed
- Summary: Added canonical Zod 4 schemas and inferred TypeScript types for drops, landing acts, catalog commerce products, SEO documents, money/media, navigation, and site settings; added validated seed for Drop 01 — The Oath and three catalog placeholders (Oversized Tee, Stringer, Compression Tee) using ANVL brand tokens.
- Files changed: `src/features/drops/**`, `src/features/landing/**`, `src/features/seo/**`, `src/features/products/schemas/commerce.schema.ts`, `src/features/products/types/commerce.types.ts`, `src/shared/schemas/**`, `src/shared/types/**`, `src/content/seed/drop-01-the-oath.seed.ts`, `docs/architecture.md`, `docs/changelog.md`, `docs/features/drops-cms.md`, `docs/features/acts-builder.md`, `docs/features/products-commerce.md`, `docs/features/seo.md`
- Tests/manual checks: `pnpm exec tsc --noEmit` (pass); `pnpm build` (pass). `pnpm test` reports no test files in the repository.
- Notes/debt: Storefront `Product` in `src/features/products/types/product.types.ts` remains the shop presentation model; canonical commerce document is `CatalogProduct` until adapters unify the two.
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
