# Project Map

Complete annotated map of the ANVL Athletics codebase. Update this file when folder structure or key files change.

---

## Root

| File / Folder | Purpose |
|---|---|
| `package.json` | Dependencies, scripts, pnpm config |
| `tsconfig.json` | TypeScript strict config; path aliases `@/` and `#/` → `src/` |
| `vite.config.ts` | Vite + TanStack Start + Tailwind + manual bundle chunks |
| `vitest.config.ts` | Vitest config (jsdom, test setup, aliases, coverage) |
| `CLAUDE.md` | Primary guide for Claude Code agents |
| `AGENTS.md` | Project rules: brand, engineering non-negotiables, definition of done |
| `README.md` | Quick-start, route map, tech stack overview |
| `.env.example` | Env var reference — never real secrets |
| `scripts/` | Utility scripts run at build/dev time |
| `public/brand/` | Raster exports: logos, OG image, placeholder product |
| `supabase/` | Database migrations + Edge Functions |
| `docs/` | Architecture docs, feature specs, audit, changelog |

---

## `scripts/`

| File | Purpose |
|---|---|
| `repatch-admin-route-tree.mjs` | Patches auto-generated `routeTree.gen.ts` for admin lazy routes (runs before dev/build/typecheck) |
| `strip-brand-logo-bg.mjs` | CLI utility to strip backgrounds from brand SVG/PNG exports |

---

## `supabase/`

### `migrations/` (chronological)

| Migration | What it does |
|---|---|
| `20260518120000_anvl_cms_core.sql` | Core tables: `cms_profiles`, `anvl_drops`, `storefront_publication`, `cms_admin_products`; RLS; `cms_publish_drop()` RPC |
| `20260518120001_anvl_cms_storage.sql` | Supabase Storage bucket + policies |
| `20260518140000_storefront_publication_catalog.sql` | Adds catalog snapshot column to `storefront_publication` |
| `20260518220000_anvl_drops_client_id_admin_rls.sql` | Client ID tracking + admin RLS hardening |
| `20260519120000_revoke_anon_cms_publish_drop.sql` | Revokes anon access to publish function |
| `20260519140000_shopify_product_links.sql` | Shopify product ID columns |
| `20260519230000_cms_publish_drop_client_drop_ids.sql` | Client drop ID tracking in publish RPC |
| `20260524120000_drop_status_cleanup.sql` | Status enum constraint cleanup |
| `20260524180000_cms_act_natures_layouts.sql` | Act nature/layout constraints |
| `20260524190000_cron_scheduled_drops_note.sql` | pg_cron comment for scheduled drop activation |
| `20260531120000_storefront_site_homepage.sql` | Adds `site_homepage` column to `storefront_publication` |
| `20260602120000_cinematic_hero_layouts.sql` | Cinematic hero layout constants |
| `20260620100000_storefront_site_drafts.sql` | Site-level draft fields |
| `20260620120000_cms_media_assets.sql` | `cms_media_assets` table for media library |
| `20260620130000_cms_scheduled_activation.sql` | Scheduled drop activation infrastructure |
| `20260624120000_fix_publish_drop_body_column.sql` | Fix column reference in publish RPC |
| `20260625120000_cron_process_scheduled_drops_direct.sql` | pg_cron direct function call for scheduled drops |
| `20260626120000_cms_settings_landing_pages.sql` | **New model:** `cms_settings` + `landing_pages` tables (RLS), `storefront_publication.active_landing_page_key` column |

### `teardown/` (manual, prerequisite-gated — NOT auto-applied)

| Script | What it does |
|---|---|
| `2026_drop_builder_teardown.sql` | DESTRUCTIVE: drops `anvl_drops`, `cms_publish_drop`, scheduled-drops cron + RPCs, drop columns on `storefront_publication`. Apply only after drop-builder code removal — see `docs/cms-teardown-plan.md` |

### `functions/`

| Function | Purpose |
|---|---|
| `publish-storefront/` | Called by admin on publish — updates `storefront_publication` |
| `process-scheduled-drops/` | Activates drops at their `scheduled_activation_at` time |
| `shopify-webhook/` | Handles Shopify product sync via webhook |
| `medusa-webhook-stub/` | Stub for future Medusa commerce backend |

---

## `src/`

### `src/app/`

| File / Folder | Purpose |
|---|---|
| `config/clients.ts` | **Interface contracts** for all runtime adapters |
| `config/runtime.ts` | `createRuntimeClients({ isServer })` — wires the right adapter |
| `config/publicEnv.ts` | Zod validation for `VITE_*` env vars |
| `config/accountContracts.ts` | Customer/order type contracts |
| `config/accountMock.ts` | Mock account client |
| `config/accountSession.ts` | Session handling stubs |
| `components/AppErrorBoundary.tsx` | Storefront-wide error boundary |
| `components/AdminErrorBoundary.tsx` | Admin-specific error boundary |
| `providers/AppProviders.tsx` | Root React context providers |
| `providers/ActiveDropThemeProvider.tsx` | Applies active drop CSS theme to `:root` |
| `providers/ActiveDropThemeBridge.tsx` | Bridges localStorage drop changes to the theme |
| `providers/RouteAnalytics.tsx` | Page view tracking on route changes |
| `seo/meta.ts` | `buildSeoMeta()` — constructs `<head>` metadata per route |

### `src/routes/`

| Route | URL | Notes |
|---|---|---|
| `__root.tsx` | all | Root layout; loads storefront projection from Supabase or fallback |
| `index.tsx` | `/` | Home — renders the active code-owned landing page via `landingPages` registry (default: The Oath) |
| `shop/index.tsx` | `/shop` | Shop listing with filters |
| `shop/$slug.tsx` | `/shop/:slug` | Product detail page |
| `drop/$slug.tsx` | `/drop/:slug` | Active drop page |
| `cart.tsx` | `/cart` | Cart page |
| `checkout/index.tsx` | `/checkout` | Checkout form |
| `checkout/success.tsx` | `/checkout/success` | Order confirmation |
| `about.tsx` | `/about` | About page |
| `size-guide.tsx` | `/size-guide` | Size guide |
| `care-guide.tsx` | `/care-guide` | Care instructions |
| `contact.tsx` | `/contact` | Contact page |
| `privacy.tsx` | `/privacy` | Privacy policy |
| `terms.tsx` | `/terms` | Terms of service |
| `returns.tsx` | `/returns` | Returns policy |
| `admin-preview.tsx` | `/admin-preview` | Gated by `VITE_ADMIN_PREVIEW_ENABLED` |
| `admin/route.tsx` | `/admin` | Admin layout (lazy) |
| `admin/index.tsx` | `/admin` | Dashboard |
| `admin/drops/*` | `/admin/drops` | Drop editor and list |
| `admin/products/*` | `/admin/products` | Product editor |
| `admin/seo.tsx` | `/admin/seo` | SEO editor |
| `admin/theme.tsx` | `/admin/theme` | Theme editor |
| `admin/website-layout.tsx` | `/admin/website-layout` | Nav/footer layout editor |
| `admin/media.tsx` | `/admin/media` | Media library |
| `admin/settings.tsx` | `/admin/settings` | Site settings |
| `auth/sign-in.tsx` | `/auth/sign-in` | Sign in (Supabase auth) |
| `auth/sign-up.tsx` | `/auth/sign-up` | Sign up |
| `auth/forgot-password.tsx` | `/auth/forgot-password` | Password reset |
| `account/route.tsx` | `/account` | Account area (guarded) |
| `account/index.tsx` | `/account` | Account overview |
| `account/personal.tsx` | `/account/personal` | Profile editor |
| `account/addresses.tsx` | `/account/addresses` | Addresses |
| `account/orders/` | `/account/orders` | Order history + detail |

### `src/features/`

#### `admin/`

Heavy CMS editor split into subfolders:

| Subfolder | Purpose |
|---|---|
| `auth/` | Supabase auth flow, admin session, `ProtectedAdminRoute`, `useAdminAuth` |
| `cmsRemote/` | Supabase write-through: publish drop, sync drops list, insert, hydration |
| `components/` | Admin UI primitives: `AdminButton`, `AdminCard`, `AdminLayout`, `AdminSidebar`, `AdminTopbar`, etc. |
| `drops/` | Drop editor: `DropActsBuilderPanel`, `DropEditorRoute`, acts builder, palette card, theme presets |
| `drops/act-editor/` | Act animation panel |
| `drops/acts/` | Act type normalizers, seed data, Zod schemas |
| `drops/cinematic/` | Cinematic hero CMS editor forms |
| `global-brand/` | Global brand settings (logo, colors) editor |
| `hooks/` | Admin-specific hooks (e.g. `useSaveSuccessFlash`) |
| `landing-cms/` | Landing CMS service + storage (admin side) — **deprecated** (drop-builder) |
| `landing-picker/` | **New model:** `LandingPagePickerCard` — Dashboard control to pick the active code-owned landing page |
| `lib/` | Admin datetime helpers |
| `media/` | Media library: upload zone, asset grid, picker modal, `useMediaAssetsQuery` |
| `products/` | Product editor: `ProductEditorRoute`, service, mapper, persistence Zod |
| `seo/` | `SeoCmsHub` — per-page SEO editor |
| `site-home/` | Site homepage mode editor |
| `site-layout/` | Site layout editor (nav links, footer) |
| `landing-content/` | Landing Content editor (`/admin/content`): RHF form over each page's content schema, defaults as placeholders |
| `site-seo/` | Global site SEO editor, marketing tools |
| `site-theme/` | Site theme editor |
| `website-layout/` | Website layout service + storage (nav + footer JSON) |

#### `landingPages/` — code-owned landing pages (current architecture)

Static, cinematic landing experiences live in code (one folder per page). The CMS only picks which page is active; it no longer composes landing sections. The home route resolves the active key against the registry and renders the matching page, falling back to `the-oath`.

| File / Folder | Purpose |
|---|---|
| `types.ts` | `LandingPageComponentProps`, `LandingPageDefinition`, `LandingPageMeta` |
| `registry.ts` | Single source of truth: lazy page components + `resolveLandingPage`, `resolveActiveLandingPageKey`, `listLandingPages`, `DEFAULT_LANDING_PAGE_KEY` |
| `activeLandingPage.ts` | `getActiveLandingPageKey()` — seam for the CMS `activeLandingPageKey` read |
| `LandingPageRenderer.tsx` | Suspense + branded fallback; renders the active page's lazy chunk |
| `assetSlots.ts` | Code-defined asset slots (general + per-drop) the admin Assets editor assigns media to |
| `pages/TheOathLanding/` | Drop 01 — The Oath (the single merged WebGL + GSAP film): `index.tsx` (composition), `theOathAssets.ts` / `theOathAssetSlots.ts` (asset binding + slots), `content/` (Zod schema + designed defaults + `resolveOathContent`), `components/` (OathHero, OathManifesto, OathTenets, ProductRevealSequence, OathFinale, OathCursor, OathProgressRail, OathCtaLink, OathMediaFallback, OathCmsMark), `motion/` (`oathMotionState` bridge, per-scene `buildOath*` builders, spotlight, SplitText wrapper, magnetics), `hooks/` (scroll timeline, pointer), `webgl/` (canvas gate, lazy `OathCanvas`, `Monolith`/`AnvlOath3D`/`DustMotes`, dust shader, brand colors) |
| `__tests__/registry.test.ts` | Registry resolution + fallback behavior |

> The legacy act/drop-builder landing system (`marketing/act-presets`, `marketing/public-landing`, `cms/landing`) is still present for the admin drop editor and is slated for removal in the CMS-cleanup phase. The public home route no longer uses it.

#### `cms/`

Storefront-safe CMS reads:

| File / Folder | Purpose |
|---|---|
| `api/` | CMS adapters: `cmsClient.seed.ts`, `cmsClient.localStorage.ts`, Supabase readers |
| `data/cms.mock.ts` | Mock CMS data for development |
| `hooks/` | `useLandingCms`, `useStorefrontActiveDrop`, `useSiteHomepageMode`, `useStorefrontPublication`, `useActiveLandingPageKey` (new model) |
| `landingPageActiveKey.settings.ts` | **New model:** local store + parse + loader/sync for the active landing-page key |
| `landingContent/` | Landing content envelope: Zod parse (`landingContent.zod.ts`) + local store/sync (`landingContent.settings.ts`) for per-landing-key copy blobs |
| `landing/` | `composeLandingPageFromDrop`, `landingCmsRead`, `landingActs.normalize`, `landingActs.types`, constants |
| `layout/websiteLayout.types.ts` | Website layout type (nav, footer, announcement) |
| `read/` | Thin read facades: `dropRuntime`, `landingCmsRuntime`, `cmsSubscriptions` |
| `runtime/` | `storefrontCmsSync`, `storefrontReadFallback` |
| `theme/dropPaletteStyle.ts` | CSS var serialization for drop theme palette |
| `types/` | `cms.types.ts`, `adminDrops.types.ts` |

#### `drops/`

Drop document foundation:

| File | Purpose |
|---|---|
| `drop.types.ts` | Drop type (canonical) |
| `types/drop.types.ts` | Drop type (feature folder copy — prefer importing from here) |
| `schemas/drop.schema.ts` | Zod schema for Drop |
| `drops.actSequence.ts` | Default act slot ordering |
| `hooks/useActiveDrop.ts` | Hook to read the active drop |
| `public/DropActivePageView.tsx` | Storefront drop page view |
| `public/DropReleaseSection.tsx` | Drop release date section |
| `theme/dropThemePalette.types.ts` | Drop theme palette types |

#### `marketing/`

Storefront marketing surfaces:

| Subfolder | Purpose |
|---|---|
| `act-presets/` | All act preset components, organized by nature (hero, manifesto, etc.) |
| `act-presets/registry.ts` | Lazy-loads act presets; maps `nature:preset` to component |
| `act-presets/shared/` | Shared act utilities: `ActPresetShell`, `ActVisualFrame`, animation helpers |
| `cinematic-hero/` | Full cinematic scroll hero: GSAP timeline, sections, nav modes, config types |
| `components/` | Standalone marketing components: `HeroForgeSequence`, `PiecesGrid`, `WaitlistSection`, etc. |
| `default-landing/` | Default cinematic landing (fallback when no active drop) |
| `home/` | Homepage sections: campaign cards, lookbook strip |
| `hooks/useWaitlistForm.ts` | Waitlist form logic |
| `public-landing/PublicLandingActs.tsx` | Renders ordered acts for the storefront |

#### `products/`

Commerce adapters + catalog:

| File / Folder | Purpose |
|---|---|
| `api/commerceClient.seed.ts` | Static seed products (no backend) |
| `api/commerceClient.localStorage.ts` | Admin-edited products via localStorage |
| `api/commerceClient.shopify.ts` | Shopify Storefront API adapter |
| `api/commerceClient.supabase.ts` | Supabase CMS products adapter |
| `api/createCommerceClient.ts` | Factory — picks the right adapter |
| `catalog/storefrontCatalog.ts` | Public catalog read facade |
| `hooks/` | `useProducts`, `useHomeProducts`, `useTrackProductView` |
| `schemas/` | `commerce.schema.ts`, `product.schema.ts` |
| `shop/` | `ShopFiltersForm`, `shopUrlSearch` (URL state for filters) |
| `types/` | `product.types.ts`, `commerce.types.ts`, `catalogProduct.types.ts` |

#### `cart/`

| File | Purpose |
|---|---|
| `store/cart.store.ts` | Zustand cart store with persistence |
| `hooks/useCart.ts` | Cart hook (add, remove, update, clear) |
| `types/cart.types.ts` | CartLine, CartState types |

#### `checkout/`

| File | Purpose |
|---|---|
| `api/paymentGateway.mock.ts` | Mock payment adapters: COD, Whish, card |
| `api/paymentGateway.types.ts` | PaymentClient interface |
| `config/checkoutPayments.config.ts` | Lebanon COD/Whish + international card config |
| `hooks/useCheckoutForm.ts` | Checkout form state + submission |
| `schemas/checkout.schema.ts` | Zod checkout schema |

#### `shopify/`

| File | Purpose |
|---|---|
| `api/shopifyStorefrontClient.ts` | Shopify Storefront API GraphQL client |
| `config/shopifyPublicEnv.ts` | Reads and validates `VITE_SHOPIFY_*` env vars |
| `mappers/shopifyProductToStorefront.ts` | Maps Shopify product to internal `Product` type |

### `src/shared/`

Framework-agnostic primitives — no feature imports allowed here.

| Path | Purpose |
|---|---|
| `api/contracts/` | Typed DTOs for future REST/BFF APIs |
| `assets/brand/` | Inline SVG logo components (AnvlWordmark, AnvlCrest, AnvlFullLockup, etc.) |
| `components/brand/` | Logo image wrapper, campaign mark, spinning mark |
| `components/layout/` | PremiumNav (storefront chrome), SiteFooter, AnnouncementBar/Rail, StickyHeader |
| `components/motion/` | AnimatedText, RevealOnScroll |
| `components/premium/` | Layout primitives: SectionShell, PageHero, ContentPanel, SectionEyebrow, CTAGroup, BrandBadge |
| `components/seo/` | JsonLd, MarketingToolsHead, structuredData helpers |
| `components/ui/` | Core UI: Button, Input, Modal, Drawer, Select, Badge, Skeleton, SafeLink, etc. |
| `constants/brand.ts` | Brand color constants + palette |
| `constants/brandLogos.ts` | Logo file path constants |
| `hooks/useDialogFocusTrap.ts` | Focus trap for modals/drawers |
| `hooks/useLenisScroll.ts` | Lenis smooth scroll (desktop, no reduced motion) |
| `hooks/useReducedMotion.ts` | `prefers-reduced-motion` detector |
| `hooks/useStickyHeader.ts` | Sticky header scroll state |
| `lib/cn.ts` | `cn()` = clsx + tailwind-merge |
| `lib/gsap.ts` | Registers GSAP + ScrollTrigger + useGSAP (SSR-safe) |
| `lib/url.ts` | `sanitizeHref()` — validates CMS-driven hrefs |
| `lib/stripAngleBracketTags.ts` | Strips HTML tags from plain text fields |
| `lib/color.ts` | Color manipulation utilities |
| `lib/storage/createJsonStore.ts` | Generic Zod-validated localStorage store factory |
| `lib/storage/createLocalStorageChannel.ts` | Cross-tab event channel for storage changes |
| `schemas/` | Shared Zod schemas: media, money, navigation, site-settings |
| `types/` | Types inferred from shared schemas |

---

## `docs/`

| File | Purpose |
|---|---|
| `README.md` | Docs index |
| `architecture.md` | 3-layer architecture, state rules, SSR rules, migration path |
| `audit-2026-05-17.md` | Active audit finding IDs (SEC-*, PERF-*, MAINT-*, etc.), phase tracker |
| `changelog.md` | Running changelog — append an entry after every task |
| `technical-debt.md` | Known compromises and risks |
| `cursor-workflow.md` | Workflow guidelines for Cursor agents |
| `design-system.md` | Brand tokens, theme model, mobile-first rules, PremiumNav |
| `performance-accessibility-security.md` | Cross-cutting guidelines |
| `backend-medusa-roadmap.md` | Future Medusa commerce integration plan |
| `backend-shopify-roadmap.md` | Shopify integration roadmap |
| `project-map.md` | This file |
| `next-steps.md` | Prioritized next tasks |
| `brand-guidelines.md` | Brand identity + design rules |
| `animation-guidelines.md` | Animation conventions and GSAP patterns |
| `cms-architecture.md` | CMS data flow, Supabase schema, adapter pattern |
| `performance-guidelines.md` | Performance rules + bundle strategy |
| `responsive-design-guidelines.md` | Responsive design patterns |
| `backend-guidelines.md` | Supabase, Edge Functions, migrations |
| `frontend-architecture.md` | Frontend layers, patterns, feature boundaries |
| `features/` | Per-feature specs |
| `contracts/` | API contract specs |
| `plans/` | Implementation plans |
| `prompts/` | Reusable task prompts |
| `tooling/` | Tooling docs (router repatch, etc.) |
