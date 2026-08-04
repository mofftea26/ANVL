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

| Function | Deployed? | Purpose |
|---|---|---|
| `shopify-webhook/` | Yes | Verifies Shopify HMAC; ack-only — no DB writes |
| `techpack-ai/` | Yes (`verify_jwt: true`) | Techpack ingestion AI parsing for `/admin/techpacks` |
| `medusa-webhook-stub/` | No — never deployed | Stub for future Medusa commerce backend |

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

57 files in `src/routes/**` (excluding `-`-prefixed sidecars and `__tests__/`): 53 resolve to a distinct URL, plus the root layout (`__root.tsx`), 2 pathless layouts (`account/route.tsx`, `admin/route.tsx`), and 1 non-route helper (`storefrontMainLayout.ts`). Rebuilt 2026-07-29 by listing `src/routes/**` directly.

| Route | URL | Notes |
|---|---|---|
| `__root.tsx` | all | Root layout; loads storefront projection from Supabase or fallback; injects SSR theme CSS + landing-entry lock; gates every public route behind Coming Soon when enabled |
| `storefrontMainLayout.ts` | — | Helper (not a route) — `getStorefrontMainClassName()` used by `__root.tsx` |
| `index.tsx` | `/` | Home — renders the active code-owned landing page via `landingPages` registry (default: The Oath) |
| `shop/index.tsx` | `/shop` | Shop listing with filters |
| `shop/$slug.tsx` | `/shop/:slug` | Product detail page |
| `cart.tsx` | `/cart` | Cart page |
| `checkout/index.tsx` | `/checkout` | Checkout form |
| `checkout/success.tsx` | `/checkout/success` | Order confirmation |
| `story.tsx` | `/story` | Story saga (chapter shelf + deep-linkable book overlay) |
| `about.tsx` | `/about` | About page — renders `<AboutExperience>` (desktop Forge Altar / mobile normal page) |
| `p/$token.tsx` | `/p/:token` | Product passport — claim flow / owner dossier / public authenticity view (noindex); also serves the admin live-preview host |
| `armory/$handle.tsx` | `/armory/:handle` | Public read-only Armory view for an owner's shared handle (`get_public_armory`) |
| `size-guide.tsx` | `/size-guide` | Size guide |
| `care-guide.tsx` | `/care-guide` | Care instructions |
| `contact.tsx` | `/contact` | Contact page |
| `faq.tsx` | `/faq` | FAQ — "The Forge Seam" answer stack (`FaqForge`) under the shared `PageMasthead` |
| `shipping.tsx` | `/shipping` | Shipping info (support content sections) |
| `returns.tsx` | `/returns` | Returns policy (support content sections) |
| `privacy.tsx` | `/privacy` | Privacy policy (`LegalDocumentRoute`) |
| `terms.tsx` | `/terms` | Terms of service (`LegalDocumentRoute`) |
| `cookie-policy.tsx` | `/cookie-policy` | Cookie policy (`LegalDocumentRoute`) |
| `accessibility.tsx` | `/accessibility` | Accessibility statement (`LegalDocumentRoute`) |
| `api/csp-report.ts` | `/api/csp-report` | Server-only `POST` handler — logs `Content-Security-Policy-Report-Only` violation reports to console (no persistence); see `src/start.ts`. Rate-limited per IP via `src/rateLimit.server.ts` (fails open when the binding is absent) |
| `auth/sign-in.tsx` | `/auth/sign-in` | Sign in (Supabase auth) |
| `auth/sign-up.tsx` | `/auth/sign-up` | Sign up |
| `auth/forgot-password.tsx` | `/auth/forgot-password` | Password reset request |
| `auth/reset-password.tsx` | `/auth/reset-password` | Set new password (reached from reset-password email link) |
| `auth/verify-email.tsx` | `/auth/verify-email` | Resend/confirm email verification |
| `auth/callback.tsx` | `/auth/callback` | OAuth/email-confirmation redirect landing — resolves session, redirects to destination |
| `account/route.tsx` | — | Pathless layout — renders `<AccountShellLayout>` for every `/account/*` route |
| `account/index.tsx` | `/account` | Account overview |
| `account/personal.tsx` | `/account/personal` | Profile editor |
| `account/addresses.tsx` | `/account/addresses` | Addresses |
| `account/settings.tsx` | `/account/settings` | Redirect-only shim → `/account?tab=settings` |
| `account/orders/index.tsx` | `/account/orders` | Order history |
| `account/orders/$orderId.tsx` | `/account/orders/:orderId` | Order detail |
| `admin/route.tsx` | — | Pathless layout — persistent shell (sidebar + topbar + preview panel), lazy-loaded, never in the storefront entry chunk (PERF-01) |
| `admin/index.tsx` | `/admin` | Dashboard — one-screen control room: active landing-page picker, status strip, setup wizards |
| `admin/login.tsx` | `/admin/login` | Admin sign-in |
| `admin/category.$categoryKey.tsx` | `/admin/category/:categoryKey` | Category landing page (nav-only grouping from `adminNav.ts`) |
| `admin/theme.tsx` | `/admin/theme` | Theme & colors editor (15-token palette) |
| `admin/fonts.tsx` | `/admin/fonts` | Fonts editor |
| `admin/assets.tsx` | `/admin/assets` | Media library + asset slot assignments |
| `admin/content.tsx` | `/admin/content` | Landing content (per-scene copy overrides) |
| `admin/about.tsx` | `/admin/about` | About page editor — hero, orbs, marquee |
| `admin/coming-soon.tsx` | `/admin/coming-soon` | Coming Soon site mode — master toggle + reveal-page copy/countdown/assets/SEO |
| `admin/legal.tsx` | `/admin/legal` | Legal pages editor (privacy/terms/cookies/accessibility) |
| `admin/support.tsx` | `/admin/support` | Support pages editor (FAQ/contact/shipping/returns/care/size guide) |
| `admin/shop.tsx` | `/admin/shop` | Shop Experience editor (`shop_config`, incl. PDP section toggles) |
| `admin/products.tsx` | `/admin/products` | Per-product PDP editorial content editor (`pdp_content`) |
| `admin/techpacks.tsx` | `/admin/techpacks` | Techpack ingestion — upload supplier PDFs, review parsed output, publish images |
| `admin/passports.tsx` | `/admin/passports` | Product passports — QR codes tab + Passport content tab |
| `admin/passports_.content.$slug.tsx` | `/admin/passports/content/:slug` | Per-product passport content wizard (trailing `_` opts out of nesting under `passports.tsx`) |
| `admin/story.tsx` | `/admin/story` | Story saga editor (chapters/acts/cast) |
| `admin/gamification.tsx` | `/admin/gamification` | Gamification — ranks, challenges, Forge XP, badges |
| `admin/analytics.tsx` | `/admin/analytics` | Analytics & SEO editor (`site_seo`) |
| `admin/settings.tsx` | `/admin/settings` | Session + local reset |

> Each heavy admin page is registered lazily via a colocated `-admin*.tsx` sidecar (`PERF-01`) — e.g. `admin/techpacks.tsx` → `admin/-adminTechpacks.tsx`. Files prefixed `-` (and `__tests__/`) are ignored by the route scanner — they are route-adjacent components/tests, not routes. `route.tsx` files are **pathless layouts** (no own URL segment) wrapping their directory's child routes.

### `src/features/`

#### `admin/`

Slim CMS admin, split into subfolders. Every page renders inside the wide-screen **workspace shell** (`AdminLayout layout="workspace"` → `AdminWorkspace` = primary column + sticky `AdminRailPanel` rail; `AdminWorkspaceStatusPanel` shows the Supabase-vs-local target):

| Subfolder | Purpose |
|---|---|
| `auth/` | Supabase auth flow, admin session, `ProtectedAdminRoute`, role gate |
| `cmsRemote/` | Supabase write-through (`adminCmsRemoteSync`, `cmsWriteThrough`) → `cms_settings` + `storefront_publication`; media upload |
| `components/` | Admin UI primitives + layout: `AdminLayout`, `AdminWorkspace`, `AdminRailPanel`, `AdminWorkspaceStatusPanel`, `AdminSidebar` (+ `AdminSidebarNavLink.tsx`, `adminSidebarActive.ts`, `useAdminSidebarExpandedCats.ts` — extracted from `AdminSidebar.tsx` to stay under the 500-line hard limit), `AdminTopbar`, `AdminButton`, `AdminCard`, etc. |
| `hooks/` | Admin-specific hooks (e.g. `useSaveSuccessFlash`) |
| `landing-picker/` | Dashboard control to pick the active code-owned landing page (Supabase `landing_pages` ∩ registry) |
| `landing-content/` | Landing Content editor (`/admin/content`): RHF form over The Oath's content schema, code defaults as placeholders (`sections/Oath*Fields`) |
| `lib/` | Admin datetime helpers (`adminDateTime.ts`), local reset |
| `media/` | Media library: upload zone, asset grid, picker, `useMediaAssetsQuery` |
| `site-theme/` | Theme editor (15-token palette) + WCAG contrast report + preview rail |
| `site-font/` | Fonts editor + font families service |
| `site-assets/` | Assets editor (media library + general/per-drop slot assignment) |
| `story/` | Story saga editor: chapters, acts, cast, book colors, story media service |
| `support/` | `/admin/support` editor (`SupportEditor.tsx`, tabbed: FAQ, contact, shipping, returns, care guide, size guide, **Measurements**, **Care symbols**): `FaqListField`, `PerProductCareField`, `PerProductSizeField` (garment-type select per product slug), `MeasurementsField` (per-garment-type reorderable measurement-point list, honors CMS order via `resolveGarmentPoints`), `CareLegendField` (26 care-symbol `{label, meaning}` overrides) |

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

#### `experience/`

Centralized experience system — the **only** place experience variants (header/footer/product-card/button chrome, animation preset, background, page transition, typography) are selected. Keyed 1:1 to the active landing key so no scattered `key === 'the-oath'` conditionals leak into components:

| File / Folder | Purpose |
|---|---|
| `experience.types.ts` | `ExperienceKey`, `ExperienceConfig`, and every variant union (`HeaderVariant`, `FooterVariant`, `ProductCardVariant`, `ButtonVariant`, `AnimationPreset`, `BackgroundPreset`, `PageTransition`, `TypographyPreset`) |
| `experienceRegistry.ts` | `EXPERIENCES` map + `DEFAULT_EXPERIENCE_KEY` (`the-oath` — classic variants everywhere, so selecting it keeps the storefront pixel-for-pixel unchanged), `resolveExperience`/`resolveExperienceKey`, `isExperienceKey` |
| `ExperienceProvider.tsx` | React context provider + `useExperience()` — resolves the active landing key to its `ExperienceConfig` |
| `useExperienceVariant.ts` | The structural variant seam — components read one named variant field instead of branching on the landing key |
| `chrome/ExperiencePageTransition.tsx` | Page-transition wrapper driven by the active experience's `pageTransition` |
| `index.ts` | Public exports |
| `__tests__/` | Registry resolution + variant hook tests |

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
| `support/` | `support_content` read model, split into an acyclic module family (each under the 300/500-line limits): `supportContent.shared.zod.ts` (FAQ/contact/shipping/returns primitives), `supportContent.care.zod.ts` (care-guide sections + `legend` — 26 `CareIconKey` overrides + per-product care entries), `supportContent.size.zod.ts` (size-guide `note` + `measure` "Where we measure" garment-type point sets + per-product size entries, incl. `GARMENT_TYPE_KEYS`/`GarmentTypeKey`), `supportContent.zod.ts` (root `SupportContentConfig`, composes the three above), `parseUtils.ts` (shared tolerant deep-pick helpers), `supportContent.defaults.ts` (the full designed copy, incl. the 26 legend entries and all 5 garment types' point sets), `supportContent.convert.ts`, `supportContent.settings.ts` (local store + Supabase write-through), `carePresets.ts`, `resolveSupportContent.ts` (`resolveSupportContent`/`resolveCareLegend`/`resolveMeasurePoints` — CMS-over-defaults merge, per field) |

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

#### `about/`

The About page: a desktop non-scrollable 3D "Forge Altar" (grabbable anvil + orbiting content orbs + hammer-strike modals) and a normal scrolling mobile page — both CMS-driven from the same content model. **Not** registered in `landingPages/registry.ts` — About is a fixed page, not a swappable drop.

| File / Folder | Purpose |
|---|---|
| `index.tsx` | `AboutExperience` — chooses desktop altar vs. mobile page (`useAboutViewMode`) |
| `aboutBreakpoints.ts` | The altar/mobile breakpoint contract (mirrors `oathBreakpoints.ts`) |
| `content/aboutContent.schema.ts` | Zod schema for hero + marquee + the free-form **orbs** array (label/color/copy/lines/points/stats/CTAs/`mediaId`) |
| `content/aboutContent.defaults.ts` | Designed default copy for every field |
| `content/resolveAboutContent.ts` | CMS blob → render model, code defaults fill every gap |
| `hooks/useAboutViewMode.ts` | Resolves desktop-altar vs. mobile-page at the current viewport |
| `components/AboutHeader.tsx`, `AboutMarquee.tsx`, `AboutCtaLink.tsx`, `AboutMediaFallback.tsx` | Shared chrome between the desktop altar and mobile page |
| `components/AboutOrbContent.tsx`, `AboutOrbLayouts.tsx` | Renders one orb's content — reused inside altar hammer-strike modals and stacked mobile sections |
| `components/aboutWorldMap.ts` | World-origin map data reused by an orb type |
| `altar/AboutAltar.tsx` | Desktop composition root — mounts the WebGL stage + orb ring + modal layer |
| `altar/AltarScene.tsx` | `@react-three/fiber` canvas: anvil, aurora backdrop, orbiting orbs |
| `altar/AltarAnvil.tsx`, `AltarHammer.tsx` | The grabbable 3D anvil + hammer GLB meshes (assets assigned on `/admin/assets`) |
| `altar/AltarAurora.tsx` | Aurora backdrop shader mesh (`shaders/aurora.ts`) |
| `altar/AltarOrb.tsx` | One orbiting content orb (per-color) |
| `altar/AboutOrbModal.tsx`, `AltarModalForge.tsx` | Hammer-strike explosion → modal reveal for the struck orb's content |
| `altar/altarState.ts` | Altar interaction/motion state bridge |
| `altar/altarOrbs.ts` | Orb layout/ring math |
| `altar/altarEmberHandoff.ts` | Hands the strike-burst embers off to the shared `lib/forge/emberForge.ts` engine |
| `altar/altarForgeTiming.ts` | Choreography-clock constants for the strike → modal sequence |
| `altar/useFittedGltf.ts` | Loads + scales/centers a GLB to fit its target bounds |
| `altar/shaders/aurora.ts`, `shaders/palantir.ts` | GLSL shader sources for the aurora backdrop + orb surface |
| `altar/__tests__/` | Ember hand-off + forge-timing unit tests |
| `mobile/AboutMobilePage.tsx` | Normal scrolling mobile page — orbs render as stacked sections |
| `webgl/aboutBrandColors.ts` | Reads the shared theme token vars for the altar's WebGL materials |
| `__tests__/` | Orb content + content-resolver tests |

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

#### `share/`

The single share surface, opened from a passport, the Armory panel, or any feat row. Its own feature (not `shared/**`) because it reads passport types; storefront-safe throughout. Replaced the old `storefront-account/account/panels/armory/armoryShare.ts` + `ArmoryShareModal.tsx` studio (2026-08-03):

| File / Folder | Purpose |
|---|---|
| `types.ts` | `ShareContext` (url + owner + stats + **piece as context** + chosen feat), formats, preset keys, `ShareCanvas` (the exact `CanvasRenderingContext2D` subset presets may touch), `ShareCapabilities`, `ShareRoute` |
| `targets.ts` | Send-to registry + `resolveShareRoute()` — the pure decision of what a tile does on this device |
| `captions.ts` | Caption / title / filename / display-host derivation |
| `shareActions.ts` | The side effects: download, clipboard, `navigator.share({ files })`, `runShareRoute()` |
| `useShareCapabilities.ts` | Post-mount detection of `navigator.share` / `canShare({ files })` / coarse pointer |
| `useImagePick.ts` | Gallery/camera seam — objectURL → `decode()` → downscaled offscreen canvas held in a ref; visible error on undecodable files |
| `useShareData.ts` | Assembles raw data from existing queries; pure `buildShareContext()` + `featsForPiece()` |
| `useShareLauncher.ts` | Open/close + mints the armory handle on first share |
| `ShareButton.tsx` / `ShareModal.tsx` | The share icon and the 3-tab sheet (Image · Link · QR); the modal mounts only while open |
| `tabs/` | `ShareImageTab` (preview, format, preset, photo, feat picker, send-to), `ShareLinkTab`, `ShareQrTab` |
| `SendToGrid.tsx` / `socialIcons.tsx` | The app tiles and their inline brand glyphs |
| `image/` | `drawKit.ts` (fit/wrap/rounded-box helpers + the http-only `crossOrigin` rule), `layout.ts` (the composition frame), `shareImage.ts` (format table, preset dispatch, PNG encode), `presets/` — one file per look, plus the shared `stage.ts` / `hudParts.ts` |
| `qr/anvlQr.ts` | The branded QR: neighbour-aware rounded modules, deliberately **dark** finder eyes (champagne binarises as light and the locators vanish), crest knockout, plus pure `qrGeometry`/`isFinderModule`/`knockoutBounds` helpers |
| `__tests__/` | Route matrix, QR geometry, context/caption derivation, preset output via a recording canvas, modal behaviour |

**Seven presets, one family.** `bottom-rail` (default), `modern`, `minimal`, `premium`, `luxe`, `game`, `jarvis` — every one of them carries the piece thumbnail and the selected feat, and every one works with or without a photo. A preset describes ARRANGEMENT only; what it composes over is THE STAGE (`presets/stage.ts`), which resolves itself — the athlete's photo when there is one, the piece's own product render over brand atmosphere when there is not. Adding or removing a photo swaps the hero and nothing else, so the chosen look is never silently substituted.

#### `support/`

Storefront support-page UI, consumed by `/size-guide`, `/care-guide`, `/faq`, `/contact`, `/shipping`, `/returns` (each thin route delegates to these components):

| File / Folder | Purpose |
|---|---|
| `components/GuideSectionHeader.tsx`, `SupportSectionList.tsx`, `ProseBody.tsx`, `DocFooterCta.tsx`, `ContactPanel.tsx` | Shared doc-page chrome (sections, contact, foot CTAs). The masthead is no longer here — every doc page uses `shared/components/premium/PageMasthead` |
| `components/FaqAccordion.tsx` | Thin re-export of the FAQ forge — kept so the route + JSON-LD helper import paths are stable |
| `components/faq/` | **"The Forge Seam"** — the `/faq` answer stack (its masthead is the shared `PageMasthead`). `FaqForge.tsx` (the section: instant search, one-open-at-a-time state, roving arrow-key nav, hash deep-links, FAQPage JSON-LD built from the *unfiltered* items), `FaqSeamRow.tsx` (one forged plate: pointer-tracked heat-scan, molten seam that splits from the strike point, GSAP spark burst + staggered answer wipe at `≥768px` + no-reduced-motion), `FaqSearchField.tsx`, `FaqHighlightedText.tsx`, `faqSearch.ts` (normalized substring match + highlight segmentation), `faqPageJsonLd.ts`, `useFaqRailHeat.ts` (the molten conduit's travelling heat blob — transform-only, `ResizeObserver`-tracked). Styles live in the `FAQ · "The Forge Seam"` block in `src/styles.css` |
| `components/MeasureExplorer.tsx` | "Where we measure" garment-type tab strip + the active type's `MeasurementFigure` — one tab per garment type the catalogue's `sizeGuide.perProduct[slug].garmentType` values actually use (`tee` always included as the fallback) |
| `components/GarmentTypeTabs.tsx` | The tab strip itself — one `GarmentSilhouette` per type, framed to that type's outline bounds |
| `components/MeasurementFigure.tsx` | The lettered measurement schematic for one garment type (badges keyed by `SizeTableRowKey`, not list position) |
| `components/garments/` | Per-garment-type schematic geometry: `tee.ts`, `stringer.ts`, `hoodie.ts`, `joggers.ts`, `shorts.ts` (outline + detail paths + badge anchors), `registry.ts` (`getGarmentSchematic`), `outlineBounds.ts` (`getGarmentOutlineViewBox`), `types.ts` |
| `components/GarmentSchematicSvg.tsx` | Renders one schematic's outline/detail/dimension strokes + badges |
| `components/SizeDiagram.tsx`, `SizeTable.tsx` | Per-product size table rendering (structured fixed grid, legacy free-form fallback) |
| `components/CareSymbolGrid.tsx`, `CareSymbolTable.tsx`, `CareSymbolLegend.tsx`, `CareSymbolPopover.tsx`, `careSymbols.tsx`, `careIcons.ts` | The 26-symbol care legend: searchable grid/table + hover/pinned popover detail |
| `components/CareLines.tsx` | Per-product care notes (structured items, legacy line fallback) |
| `hooks/useCareSymbolSearch.ts` | Debounced (≥250ms) search/filter over the 26 legend entries |
| `hooks/useSchematicDrawIn.ts` | GSAP stroke draw-in for the active schematic (`≥768px` + no reduced motion; `gsap.matchMedia` dual gate; see the `contextSafe` gotcha in `docs/animation-guidelines.md`) |
| `lib/garmentTypes.ts` | `resolveGarmentTypeKeys()` — which tabs `MeasureExplorer` shows, derived from the catalogue's actually-used garment types |
| `lib/resolveProductNames.ts` | Orders/labels per-product entries by real commerce product name |

#### `legal/`

Storefront legal-page UI, consumed by `/privacy`, `/terms`, `/cookie-policy`, `/accessibility`:

| File / Folder | Purpose |
|---|---|
| `components/LegalDocument.tsx` | Hero + sticky table-of-contents + reorderable sections renderer for one legal page |
| `components/LegalDocumentRoute.tsx` | Route-facing wrapper — resolves `cms/legal`'s published/preview content for a given `pageKey` and renders `LegalDocument` |
| `components/index.ts` | Public exports |
| `components/__tests__/legalDocument.test.tsx` | Rendering/behavior tests |

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
| `config/internalCheckout.ts` | `isInternalCheckoutEnabled()` — the single gate keeping the **mock** payment gateway unreachable in production. Returns true only when Shopify is unconfigured **and** `import.meta.env.DEV`. Consulted by the `/checkout` route guard and by both cart checkout handlers, which surface an error instead of falling back when it returns false |
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
| `components/premium/` | Layout primitives: SectionShell, PageHero, ContentPanel, SectionEyebrow, CTAGroup, BrandBadge, ForgeAtmosphere, **PageMasthead** |
| `components/premium/PageMasthead.tsx` | **The one storefront doc-page header** — used by `/faq`, `/care-guide`, `/size-guide`, `/contact`, `/shipping`, `/returns` and all four legal pages (via `LegalDocument`). Eyebrow on a hairline; title two-tone like Story's "The Forged / **Kingdom**" (lead words bone, final word in the shared `.anvl-foil-text` champagne foil — `splitTitleForFoil`); molten strike rule; optional "Last updated" stamp; intro. Behind it: `ForgeAtmosphere` masked at both ends (fades in under the site header, out into the page body) and a colossal **solid** ghost word entering from the right edge and dissolving leftward under a directional mask, auto-derived from the title (`deriveWatermark`: "Size guide" → SIZE). Owns **no** action slot — CTAs belong in `DocFooterCta` at the page foot. Exports `formatDocDate`. Styles: the `PageMasthead` block in `src/styles.css`. Replaced the former `support/components/DocHero.tsx` and `support/components/faq/FaqHero.tsx`, both deleted |
| `components/seo/` | JsonLd, MarketingToolsHead, structuredData helpers |
| `components/ui/` | Core UI: Button, Input, Modal, Drawer, Select, Badge, Skeleton, SafeLink, etc. |
| `constants/brand.ts` | Brand color constants + palette |
| `constants/brandLogos.ts` | Logo file path constants |
| `data/countryDialCodes.ts` | Country dial-code presets (used by `PhoneInput` / passport country presets) |
| `devPreview/DesignSystemPreviewProvider.tsx` | Dev-only design-system/component preview provider |
| `hooks/useDialogFocusTrap.ts` | Focus trap for modals/drawers |
| `hooks/useLenisScroll.ts` | Lenis smooth scroll (desktop, no reduced motion) |
| `hooks/useReducedMotion.ts` | `prefers-reduced-motion` detector |
| `hooks/useStickyHeader.ts` | Sticky header scroll state |
| `hooks/useContainedMediaRect.ts` | Computes the rendered (letterboxed) rect of an `object-fit: contain` media element — used where overlay UI must align to the visible image, not its box |
| `icons/index.tsx` | The Phosphor icon seam — every UI icon is re-exported from here under stable names (named imports only; never import `@phosphor-icons/react` directly). Global duotone weight via `IconContext`; the `Anvil` glyph is inlined because Phosphor has none |
| `lib/cn.ts` | `cn()` = clsx + tailwind-merge |
| `lib/gsap.ts` | Registers GSAP + ScrollTrigger + useGSAP (SSR-safe) |
| `lib/iconSize.ts` | Shared icon size-token → pixel-size resolver for `icons/` consumers |
| `lib/forge/emberForge.ts`, `lib/forge/forgeSurface.ts` | The shared canvas-2D ember-forge engine (maths + surface sizing) backing `Modal`, the toast layer, and the About altar's ember hand-off — see `docs/animation-guidelines.md` |
| `components/ui/ForgeEmberCanvas.tsx` | React shell for `lib/forge/emberForge.ts` — sizes/positions the canvas to the swarm's own bounding box, rAF loop, reduced-motion gate |
| `lib/url.ts` | `sanitizeHref()` — validates CMS-driven hrefs |
| `lib/stripAngleBracketTags.ts` | Strips HTML tags from plain text fields |
| `lib/color.ts` | Color manipulation utilities |
| `lib/storage/createJsonStore.ts` | Generic Zod-validated localStorage store factory |
| `lib/storage/createLocalStorageChannel.ts` | Cross-tab event channel for storage changes |
| `schemas/media.schema.ts` | Shared media Zod schema |
| `schemas/stringList.ts` | Shared Zod helper for CMS string-list fields |
| `webgl/DustField.tsx` | The site-wide cursor dust field — one shared instance mounted globally |
| `webgl/SiteDustGate.tsx` | Gates `DustField` to capable devices/routes — excludes `/` and `/about`, which integrate dust in-canvas themselves |
| `webgl/SiteDustLayer.tsx` | Fixed-position layer hosting the gated `DustField` |
| `webgl/dustShaders.ts` | Vertex/fragment shaders for the dust particle field |
| `webgl/particleShapes.ts` | Particle silhouette/shape sampling helpers shared by dust + forge WebGL surfaces |
| `webgl/siteDustState.ts` | Mutable motion-state bridge for the shared dust field |
| `webgl/isWebglAvailable.ts` | WebGL capability/device gate check |
| `webgl/canvasTeardownGuard.ts` | Guards against double-teardown/leaks when a WebGL canvas unmounts |
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
