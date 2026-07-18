# Project Map

Complete annotated map of the ANVL Athletics codebase. Update this file when folder structure or key files change.

---

## Root

| File / Folder | Purpose |
|---|---|
| `package.json` | Dependencies, scripts, pnpm config |
| `tsconfig.json` | TypeScript strict config; path aliases `@/` and `#/` → `src/` |
| `vite.config.ts` | Vite + TanStack Start + Tailwind + manual bundle chunks; Cloudflare Workers plugin (always on — dev/preview/build) |
| `wrangler.jsonc` | Cloudflare Workers deploy config (SSR entry, `nodejs_compat`, `NODE_ENV`) — see `docs/deployment.md` |
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

### `migrations/` (chronological — key milestones)

| Migration | What it does |
|---|---|
| `20260518120000_anvl_cms_core.sql` | **Historical:** drop-builder foundation (`anvl_drops`, publish RPC) |
| `20260606051107_drop_builder_teardown.sql` | **Pivot:** drops `anvl_drops`, publish RPC, scheduled-drop cron |
| `20260606052134_cms_settings_landing_pages.sql` | **Current model:** `cms_settings` + `landing_pages`; `active_landing_page_key` on publication |
| `20260607120000_cms_minimal_cleanup.sql` | Drops product tables + legacy publication columns |
| `20260612073914_landing_content_the_forge.sql` | Adds `landing_content` jsonb |
| `20260620100000_storefront_site_drafts.sql` | Adds `media_index` to publication |
| `20260620120000_cms_media_assets.sql` | Media library table |
| `20260620140000_normalize_theme_palette.sql` | Normalizes theme to 15-token palette |
| `20260622120000_flexible_oath_tenets.sql` | Tenet images → `landing_content.tenets.items[].mediaId` |
| `20260626120000_story_tables.sql` | Story saga relational tables |
| `20260626120001_story_media_bucket.sql` | `story-media` bucket |
| `20260627120000_remove_landing_page_theme_assignment.sql` | Removes per-landing theme override |
| `20260627120100_asset_config_pages.sql` | Adds `asset_config.pages` for shop etc. |
| `20260628120000_consolidate_oath_landing_pages.sql` | Merges `the-oath-2` → `the-oath` |

> Full ordered set: `supabase/migrations/`. Drop-builder tables/RPCs are gone from the active app; see MIG-01 in `docs/technical-debt.md` for orphaned post-teardown RPC migrations.

### `functions/` (in repo)

| Function | Purpose |
|---|---|
| `shopify-webhook/` | Verifies Shopify HMAC; ack-only — no DB writes |
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
| `providers/SiteThemeProvider.tsx` | Applies CMS theme CSS vars to `:root` |
| `providers/RouteAnalytics.tsx` | Page view tracking on route changes |
| `seo/meta.ts` | `buildSeoMeta()` — constructs `<head>` metadata per route |

### `src/routes/`

| Route | URL | Notes |
|---|---|---|
| `__root.tsx` | all | Root layout; loads storefront projection from Supabase or fallback; injects SSR theme CSS + landing-entry lock |
| `index.tsx` | `/` | Home — renders the active code-owned landing page via `landingPages` registry (default: The Oath) |
| `shop/index.tsx` | `/shop` | Shop listing with filters |
| `shop/$slug.tsx` | `/shop/:slug` | Product detail page |
| `cart.tsx` | `/cart` | Cart page |
| `checkout/index.tsx` | `/checkout` | Checkout form |
| `checkout/success.tsx` | `/checkout/success` | Order confirmation |
| `story.tsx` | `/story` | Story saga (chapter shelf + deep-linkable book overlay) |
| `about.tsx` | `/about` | About page |
| `size-guide.tsx` | `/size-guide` | Size guide |
| `care-guide.tsx` | `/care-guide` | Care instructions |
| `contact.tsx` | `/contact` | Contact page |
| `privacy.tsx` | `/privacy` | Privacy policy |
| `terms.tsx` | `/terms` | Terms of service |
| `returns.tsx` | `/returns` | Returns policy |
| `admin/route.tsx` | `/admin` | Admin layout shell (lazy) |
| `admin/index.tsx` | `/admin` | Dashboard — active landing-page picker |
| `admin/login.tsx` | `/admin/login` | Admin sign-in |
| `admin/theme.tsx` | `/admin/theme` | Theme & colors editor (15-token palette) |
| `admin/fonts.tsx` | `/admin/fonts` | Fonts editor |
| `admin/assets.tsx` | `/admin/assets` | Media library + asset slot assignments |
| `admin/content.tsx` | `/admin/content` | Landing content (per-scene copy overrides) |
| `admin/story.tsx` | `/admin/story` | Story saga editor (chapters/acts/cast) |
| `admin/gamification.tsx` | `/admin/gamification` | Gamification — ranks, challenges, Forge XP, badges |
| `admin/settings.tsx` | `/admin/settings` | Session + local reset |
| `auth/sign-in.tsx` | `/auth/sign-in` | Sign in (Supabase auth) |
| `auth/sign-up.tsx` | `/auth/sign-up` | Sign up |
| `auth/forgot-password.tsx` | `/auth/forgot-password` | Password reset |
| `account/route.tsx` | `/account` | Account area (guarded) |
| `account/index.tsx` | `/account` | Account overview |
| `account/personal.tsx` | `/account/personal` | Profile editor |
| `account/addresses.tsx` | `/account/addresses` | Addresses |
| `account/orders/` | `/account/orders` | Order history + detail |

> Each heavy admin page is registered lazily via a colocated `-admin*.tsx` sidecar (`PERF-01`). Routes prefixed with `-` are ignored by the route scanner (used for sidecars + route tests).

### `src/features/`

#### `admin/`

Slim CMS admin, split into subfolders. Every page renders inside the wide-screen **workspace shell** (`AdminLayout layout="workspace"` → `AdminWorkspace` = primary column + sticky `AdminRailPanel` rail; `AdminWorkspaceStatusPanel` shows the Supabase-vs-local target):

| Subfolder | Purpose |
|---|---|
| `auth/` | Supabase auth flow, admin session, `ProtectedAdminRoute`, role gate |
| `cmsRemote/` | Supabase write-through (`adminCmsRemoteSync`, `cmsWriteThrough`) → `cms_settings` + `storefront_publication`; media upload |
| `components/` | Admin UI primitives + layout: `AdminLayout`, `AdminWorkspace`, `AdminRailPanel`, `AdminWorkspaceStatusPanel`, `AdminSidebar`, `AdminTopbar`, `AdminButton`, `AdminCard`, etc. |
| `hooks/` | Admin-specific hooks (e.g. `useSaveSuccessFlash`) |
| `landing-picker/` | Dashboard control to pick the active code-owned landing page (Supabase `landing_pages` ∩ registry) |
| `landing-content/` | Landing Content editor (`/admin/content`): RHF form over The Oath's content schema, code defaults as placeholders (`sections/Oath*Fields`) |
| `lib/` | Admin datetime helpers (`adminDateTime.ts`), local reset |
| `media/` | Media library: upload zone, asset grid, picker, `useMediaAssetsQuery` |
| `site-theme/` | Theme editor (15-token palette) + WCAG contrast report + preview rail |
| `site-font/` | Fonts editor + font families service |
| `site-assets/` | Assets editor (media library + general/per-drop slot assignment) |
| `story/` | Story saga editor: chapters, acts, cast, book colors, story media service |

#### `landingPages/` — code-owned landing pages (current architecture)

Static, cinematic landing experiences live in code (one folder per page). The CMS only picks which page is active; it no longer composes landing sections. The home route resolves the active key against the registry and renders the matching page, falling back to `the-oath`.

| File / Folder | Purpose |
|---|---|
| `types.ts` | `LandingPageComponentProps`, `LandingPageDefinition`, `LandingPageMeta` |
| `registry.ts` | Single source of truth: lazy page components + `resolveLandingPage`, `resolveActiveLandingPageKey`, `listLandingPages`, `DEFAULT_LANDING_PAGE_KEY` |
| `activeLandingPage.ts` | `getActiveLandingPageKey()` — seam for the CMS `activeLandingPageKey` read |
| `LandingPageRenderer.tsx` | Entry overlay + preload gate; lazy page chunk |
| `assetSlots.ts` | Code-defined asset slots (general + per-drop) the admin Assets editor assigns media to |
| `pages/TheOathLanding/` | Drop 01 — The Oath (the single merged WebGL + GSAP film): `index.tsx` (composition), `theOathAssets.ts` / `theOathAssetSlots.ts` (asset binding + slots), `content/` (Zod schema + designed defaults + `resolveOathContent`), `components/` (OathHero, OathManifesto, OathTenets, ProductRevealSequence, OathFinale, OathCursor, OathProgressRail, OathCtaLink, OathMediaFallback, OathCmsMark), `motion/` (`oathMotionState` bridge, per-scene `buildOath*` builders, spotlight, SplitText wrapper, magnetics), `hooks/` (scroll timeline, pointer), `webgl/` (canvas gate, lazy `OathCanvas`, `Monolith`/`AnvlOath3D`/`DustMotes`, dust shader, brand colors) |
| `__tests__/registry.test.ts` | Registry resolution + fallback behavior |

| `LandingEntryContext.tsx` / `landingEntryLoad.ts` | Landing entry-lock context + load coordination (prevents flash before the cinematic page hydrates) |

> The legacy act/drop-builder landing system (`marketing/act-presets`, `marketing/public-landing`, `cms/landing`, and the `drops` feature) has been **removed**. The public home route renders only the code-owned `landingPages` registry.

#### `cms/`

Storefront-safe CMS reads:

| File / Folder | Purpose |
|---|---|
| `api/` | CMS read adapters + projection: `cmsClient.seed.ts`, `cmsClient.localStorage.ts`, `publicStorefrontPublication.ts`, `loadStorefrontProjection.ts`, `siteSettingsClient.*`, `supabaseStorefrontReaders.ts`, `seoClient.*`, `storefrontProjectionHead.ts` |
| `config/` | Theme/font config + **15-token palette source of truth**: `cmsSiteConfig.zod.ts` (`themePaletteSchema`, `themeConfigToCssVars`), `cmsSiteConfig.settings.ts`, `themePresets.ts`, `themeLibrary.ts`, `themeTokens.ts`, `fontLibrary.ts` |
| `assets/` | `resolvePublishedAssets.ts`, `storefrontPageSlots.ts` — merge asset_config + media_index → landing props |
| `data/cms.mock.ts` | Mock CMS data for development |
| `hooks/` | `useActiveLandingPageKey`, `useStorefrontPublication`, `useSiteHomepageMode`, `useWebsiteNavigation`, `invalidateStorefrontPublication` |
| `landingPageActiveKey.settings.ts` | Local store + parse + loader/sync for the active landing-page key |
| `landingContent/` | Landing content envelope: Zod parse (`landingContent.zod.ts`) + local store/sync (`landingContent.settings.ts`) for per-landing-key copy blobs |
| `comingSoon/` | Coming Soon site-mode config: `comingSoon.zod.ts` (flat schema, `.catch` defaults, master `enabled` toggle) + `comingSoon.settings.ts` (local store `anvl.comingSoon.v1` + write-through) |
| `layout/` | `websiteLayout.defaults.ts` / `websiteLayout.types.ts` — code-owned nav/footer defaults (not CMS-editable) |
| `navigation/` | `staticWebsiteNavigation.ts`, `navigation.types.ts` — storefront nav/footer code defaults |
| `seoMeta.ts` / `siteSeo.local.ts` / `siteHomepage.settings.ts` | SEO meta builders + storefront SEO/homepage defaults (read models; editor UIs removed) |
| `types/` | `cms.types.ts` |

> The standalone `drops/` feature, `cms/landing`, `cms/read`, `cms/runtime`, and `cms/theme/dropPaletteStyle.ts` were removed — there is one global CMS theme and no per-drop palette/acts.

#### `comingSoon/`

Pre-launch reveal page — replaces every public route while `coming_soon.enabled` is on (gate in `src/routes/__root.tsx`; admin exempt; `?anvl-preview=live` bypass):

| File / Folder | Purpose |
|---|---|
| `ComingSoonExperience.tsx` | One-screen centered composition (no scroll, safe-area aware, vh-clamped type) |
| `content/resolveComingSoonContent.ts` | CMS blob → render model: blank→designed defaults, media-id→URL, social href sanitizing, countdown target resolution |
| `scene/` | The WebGL forge: `ComingSoonScene.tsx` (Canvas, drift embers, ground glow, pointer/strike rig), `EmberAnvil.tsx` (anvil GLB surface-sampled into GPU ember particles), `emberForgeShaders.ts` |
| `components/` | `ComingSoonStage` (WebGL mount gate), `ComingSoonCountdown` (rolling digits, strike-reactive), `ComingSoonEmailCapture` (underline input + honeypot), `ComingSoonSocials` (magnetic icon buttons), `ComingSoonEnvironment` (image layers + vignette + grain) |
| `hooks/` | `useComingSoonEntrance` (GSAP entrance, matchMedia-gated), `useCountdown` (1s tick, hydration-safe) |
| `lib/` | `countdownTarget.ts` (wall-clock+IANA→UTC, DST-safe), `comingSoonGate.ts` (exempt paths + preview bypass) |
| `api/subscribeComingSoon.ts` | Anon insert into `coming_soon_subscribers`; duplicate → friendly success |

#### `marketing/`

Storefront marketing surfaces (the act-preset / cinematic-hero / public-landing system was removed; landing pages are code-owned under `landingPages/`):

| Subfolder | Purpose |
|---|---|
| `home/` | Homepage strips: `CampaignCardsSection`, `LookbookStripSection` (**not mounted on home route** — home is landing-only) |

#### `products/`

Commerce adapters + catalog:

| File / Folder | Purpose |
|---|---|
| `api/commerceClient.seed.ts` | Static seed products (no backend) |
| `api/commerceClient.localStorage.ts` | Admin-edited products via localStorage |
| `api/commerceClient.shopify.ts` | Shopify Storefront API adapter |
| `api/commerceClient.supabase.ts` | Legacy name; commerce uses Shopify or seed/localStorage (no CMS products) |
| `api/createCommerceClient.ts` | Factory — picks the right adapter |
| `catalog/storefrontCatalog.ts` | Public catalog read facade |
| `hooks/` | `useProducts`, `useHomeProducts`, `useTrackProductView` |
| `schemas/` | `commerce.schema.ts`, `product.schema.ts` |
| `shop/` | `ShopFiltersForm`, `shopUrlSearch` (URL state for filters) |
| `types/` | `product.types.ts`, `commerce.types.ts`, `catalogProduct.types.ts` |

#### `search/`

Storefront global search — nav-owned, covers products, story, About, PDP editorial copy, and static pages:

| File / Folder | Purpose |
|---|---|
| `types/search.types.ts` | `SearchDocument`/`SearchResult`/`GroupedResults` — index-agnostic contract |
| `lib/matchEngine.ts` | Fuse.js wrapper (`createSearchIndex`/`runSearch`) — no `runtimeClients`/CMS knowledge, reusable by a future admin search variant |
| `lib/searchCorpus.ts` | `buildSearchCorpus()` — reshapes existing `runtimeClients`/`loadStorefrontProjection` reads into `SearchDocument[]`, no new fetching |
| `hooks/useSearchCorpusQuery.ts` | Lazy `useQuery` wrapper (5 min `staleTime`, `enabled` on first interaction) |
| `hooks/useGlobalSearch.ts` | Core hook — debounced query, memoized index, grouped results, `navigateToResult` per doc type |
| `components/GlobalSearchBar.tsx` | Nav-mounted entry point (icon trigger <1024px, inline+dropdown ≥1024px, `drawer` variant for `PremiumNavMobile`) |
| `components/GlobalSearchDropdown.tsx` | Compact categorized results panel |
| `components/GlobalSearchOverlay.tsx` | Full-screen cinematic overlay (lazy-loaded) |
| `components/SearchResultRow.tsx` | One result row with highlighted match spans |

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
| `schemas/` | Shared Zod schemas: media, money, navigation (scaffolding for future REST/BFF; not all wired yet) |
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
