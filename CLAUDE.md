# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**ANVL Athletics** is a premium bodybuilding gymwear brand based in Lebanon. The website is a production-ready SSR storefront + admin CMS built on TanStack Start (React 19, Vite, TypeScript). The first drop is **Drop 01 — The Oath**.

The current phase uses local/mock adapters where a real backend does not yet exist. The architecture is designed so adapters can be swapped (to Supabase, Shopify, Medusa) without rewriting UI or route code.

---

## Brand Identity

- **Brand:** ANVL Athletics
- **Tagline:** Forged Under Pressure
- **Drop 01:** The Oath
- **Meaning:** a body forged through pressure, repetition, discipline, and heat
- **Visual identity:** premium, industrial, cinematic, warrior-inspired, dark, disciplined, powerful, elegant
- **Avoid:** cheap gaming/neon aesthetics, generic fitness templates, childish gym vibes, costume-like design
- **Core palette:**
  - `--anvl-black: #0B0B0C`
  - `--anvl-dark-steel-grey: #1D1F21`
  - `--anvl-washed-charcoal: #34373A`
  - `--anvl-graphite: #5B5E61`
  - `--anvl-bone: #E7E4DF`
- **Fonts:** Anton (headings — heavy condensed uppercase), Sora (body — clean modern sans), Cinzel (heraldic display accent)
- **Themes:** `oath-dark` (default), `bone-light` (future editorial mode) — driven by `data-theme` on `:root`
- The global ANVL logo (header/footer) must never change per drop. Campaign logos/emblems are drop-section-only visuals.

---

## Current Stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start (SSR) + TanStack Router (file-based) |
| Language | TypeScript (strict mode) |
| UI | React 19 |
| Styling | Tailwind CSS v4 + CSS variable tokens |
| State — server | TanStack Query v5 |
| State — local | Zustand v5 |
| Forms | React Hook Form + Zod v4 |
| Animation | GSAP 3 + `@gsap/react` useGSAP + ScrollTrigger |
| Motion (lightweight) | **No library** — `RevealOnScroll` uses IntersectionObserver + a CSS transition. `framer-motion` was removed; do not reintroduce it for simple reveals |
| 3D / WebGL | three.js + `@react-three/fiber` v9 + `@react-three/drei` v10 — The Oath landing emblem, Story chapter book, the About Forge Altar (anvil/hammer GLBs + aurora), and the site-wide cursor dust (`src/shared/webgl/DustField`, one shared field mounted globally via `SiteDustGate` and inside scene canvases) — all lazy `vendor-three`, gated to capable devices |
| Smooth scroll | Lenis |
| Icons | **`@phosphor-icons/react`**, consumed *only* through the `@/shared/icons` seam (`src/shared/icons/index.tsx`), which re-exports Phosphor under the historical lucide names so call sites never import the vendor directly. Global weight is **duotone** via `IconContext` (`PHOSPHOR_ICON_WEIGHT` — one line to change it). `Anvil` is an inlined SVG path (Phosphor has no anvil; path from lucide, ISC). Sizes come from the `ICON_SIZE` buckets in `src/shared/lib/iconSize.ts`, never raw numbers. **`lucide-react` was removed 2026-07-17** — do not reintroduce it |
| Toasts | sonner |
| PDF parsing | `pdfjs-dist` (pinned exact) — techpack ingestion only, browser-side, lazy `vendor-pdfjs`; never in the SSR graph (it cannot load on `workerd`) |
| Build | Vite v8 |
| Test | Vitest v4 + @testing-library/react v16 + jsdom |
| Component workbench | Storybook v10 (`@storybook/react-vite`) — 23 `*.stories.tsx` across the shared UI kit; `.storybook/main.ts` strips the TanStack Start plugins out of the shared Vite config (they assume a full SSR build) and `.storybook/preview.tsx` wraps stories in `DesignSystemPreviewProvider` for theming |
| Fuzzy search | `fuse.js` — the global search matching engine (`src/features/search/lib/matchEngine.ts`) |
| QR codes | `qrcode` — the **branded** renderer in `src/features/share/qr/anvlQr.ts` uses `QRCode.create()` for the raw module matrix and draws it itself: neighbour-aware rounded modules, deliberately **DARK** finder eyes (champagne binarises as light and the locators vanish — see the comment on `drawFinder`), and an `AnvlCrest` knockout centred on the plate by `fitCrestBox` at level-H correction. Both surfaces use it: the storefront share sheet (`renderAnvlQr`, one code + a Blob for `navigator.share`) and the admin passport print sheet (`renderAnvlQrBatch` + `PRINT_QR_COLORS`, one scratch canvas for up to 500 codes, paper white / K-only black, never theme tokens) |
| Virtualization | `@tanstack/react-virtual` — admin media library grid (`src/features/admin/media/MediaAssetGrid.tsx`) |
| PDF parsing | `pdfjs-dist` — techpack ingestion, browser-only + lazy, SSR-guarded; split into the `vendor-pdfjs` chunk. Only `techpacks/parse/pdfExtract.ts` imports the package |
| Package manager | pnpm (pinned) |
| Backend / DB | Supabase (auth, postgres, storage, edge functions) |
| Commerce (optional) | Shopify Storefront API (when `VITE_SHOPIFY_*` are set) |
| UI primitives | Custom (`src/shared/components/ui/`) — **not shadcn/ui** |
| CSS utility helpers | clsx + tailwind-merge (`src/shared/lib/cn.ts`) |
| Schema validation | Zod (all external/CMS data) |
| Hosting / SSR runtime | **Cloudflare Workers** (`workerd`) via `@cloudflare/vite-plugin` + `wrangler` — see `docs/deployment.md` |
| Node version | **≥ 22.15** for all commands (Node 24 LTS recommended) |

> **Note:** shadcn/ui is **not installed**. The project has its own branded UI component system under `src/shared/components/ui/`. Do not install shadcn/ui without explicit approval.

> **Deploy note:** `@cloudflare/vite-plugin` is a standard static plugin in `vite.config.ts` (always on for dev/preview/build, bound to the `ssr` vite environment), so `pnpm dev` runs SSR on `workerd` too — full dev↔prod parity. It requires **Node ≥ 22.15** (uses `node:module.registerHooks`), so every command does. `NODE_ENV` still resolves to `development` in dev (Vite replaces it per-mode). Full setup, env split, and custom-domain steps live in `docs/deployment.md`.

---

## Architecture Map

### Three-Layer Model

```
Storefront/UI layer        → src/routes/** + src/shared/components/**
Domain / Application layer → src/features/**/hooks, services, stores, schemas
Data / Runtime layer       → src/app/config/runtime.ts + adapter files
```

### Client Abstraction (Dependency Inversion)

All interface contracts live in `src/app/config/clients.ts`:
- `CommerceClient`, `SeoClient`, `StoryClient`, `AnalyticsClient`, `PaymentClient`, `AccountClient` — six. (`CmsClient` and `SiteSettingsClient` were deleted 2026-08-05: zero call sites, and their "Supabase readers" only ever returned code defaults.)

Runtime wiring via `createRuntimeClients({ isServer })` in `src/app/config/runtime.ts`:
- **Server:** seed adapters (no `localStorage`, SSR-safe)
- **Browser:** `localStorage`-backed adapters
- **With Supabase env:** published CMS projection replaces seed/local on both server and browser
- **With Shopify env:** Shopify Storefront API replaces local/seed commerce

### Feature Boundaries (STRICT)

```
src/features/admin/**          → admin UI + mutations only — NEVER imported by storefront
src/features/cms/**            → shared CMS read models, theme/font/asset config, hooks — storefront-safe
src/features/experience/**     → centralized experience system (registry, provider, variant seam) — storefront-safe; the ONLY place experience variants are selected (no scattered key conditionals)
src/features/landingPages/**   → code-owned landing pages (registry, renderer, asset slots, TheOathLanding)
src/features/marketing/**      → storefront home sections (home/: campaign cards, lookbook strip)
src/features/passport/**       → product passports: /p/$token claim flow (teaser → onboarding → GSAP claim ceremony → passport dossier), RPC clients (passport + armory), Armory life (ranks/badges, Forge XP + challenges, wear journal, Feats, Hall of Honor, public armory /armory/$handle, verified-owner reviews) — storefront-safe
src/features/about/**          → About page: desktop "Forge Altar" (non-scrollable 3D anvil + orbiting content orbs + hammer-strike modals) + normal mobile page — not registered in landingPages/registry.ts (About is a fixed page, not a swappable drop)
src/features/techpacks/**      → Techpack ingestion domain: Zod document model, disclosure policy, and the coordinate-driven PDF parsers. PURE — no React, no Supabase, so every parser is testable from small JSON fixtures. Only `parse/pdfExtract.ts` + `parse/pdfImages.ts` touch pdfjs-dist, and they are browser-only
src/features/share/**          → THE share surface (Image / Link / QR sheet) used by the passport, the Armory panel and every feat row. Pure routing + caption + preset + QR-geometry logic, a canvas image engine (one file per preset), and the branded QR renderer — storefront-safe. A feature rather than shared/** because it reads passport types
src/features/story/**          → Story saga: schemas, clients, 3D shelf + book overlay
src/features/products/**       → product catalog, commerce adapters, shop components
src/features/cart/**           → cart store + hooks (Zustand)
src/features/checkout/**       → checkout forms, schemas, payment adapters
src/features/analytics/**      → analytics client abstraction + hooks
src/features/shopify/**        → Shopify Storefront API client + mappers
src/shared/**                  → framework-agnostic primitives — NO imports from features or routes
src/routes/**                  → ONLY place that imports from both features and shared
src/app/**                     → providers, config, error boundaries, SEO meta
```

### Landing Page System (code-owned)

Landing pages are **static, code-owned React components** registered in `src/features/landingPages/registry.ts`. The CMS does **not** compose landing sections; it only picks which coded page is active, assigns media to code-defined asset slots, and supplies per-scene copy overrides. The old drop-builder "acts" system (`marketing/act-presets`, `cinematic-hero`, `public-landing`) has been removed.

The reference (and currently only) page is **`TheOathLanding`** (`key: 'the-oath'`) — the single merged Drop 01 cinematic film (the former The Oath I + II were merged 2026-06-20). It is one continuous pinned/scrubbed GSAP scroll timeline (`hooks/useTheOathScrollTimeline.ts` composing `motion/buildOath*.ts`) over a fixed transparent WebGL canvas (3D monolith emblem + dust). The home route resolves the active key against the registry (fallback `the-oath`) and renders `<LandingPageRenderer>`.

---

## Folder Structure

```
src/
  app/
    config/          clients.ts (interfaces), runtime.ts (wiring), publicEnv.ts (env validation)
    components/      AppErrorBoundary, AdminErrorBoundary
    providers/       AppProviders, SiteThemeProvider, RouteAnalytics
    seo/             meta.ts (buildSeoMeta)
  content/           seed data + mocks
  features/
    admin/           Slim CMS — dashboard (one-screen control room + setup/ wizard hub), theme, fonts, assets, shop, products, landing content, about, coming-soon, banner, legal, support (FaqListField, PerProductCareField, PerProductSizeField, MeasurementsField, CareLegendField), passports (+ techpacks/ techpack ingestion & import), story, gamification, analytics, settings (+ auth). Shell: **AdminRootShell** (the `/admin` branch of `__root.tsx`, reached via `lazy()` so the admin auth/theme stack never enters the storefront's static graph — F-06) → AdminLayout → AdminShell (persistent categorized sidebar — components/AdminSidebar.tsx + AdminSidebarNavLink.tsx/adminSidebarActive.ts/useAdminSidebarExpandedCats.ts — + topbar Preview toggle) / AdminWorkspace / AdminRailPanel; preview/ (live-preview panel — drag-resizable split — + draft/hover channels), components/wizard/ (generic AdminWizard), setup/ (six guided setup wizards + live status reads), hooks/useSortableList (native DnD reorder)
    analytics/       Analytics client mock + hooks
    about/           About page: content schema/defaults/resolver (CMS-driven orbs = sections) + altar/ (desktop Forge Altar — grabbable 3D anvil, aurora, per-color orbiting orbs, hammer-strike explosion → modal) + mobile/ (normal scrolling page; orbs render as stacked sections)
    cart/            Zustand cart store + hooks
    checkout/        Forms, schemas, payment config + mock adapters. `config/internalCheckout.ts` is the gate that keeps the MOCK gateway unreachable in production (Shopify-unconfigured AND dev only) — the `/checkout` route and both cart handlers consult it
    cms/             Storefront-safe CMS reads: theme/font/asset config (cmsSiteConfig), landing content envelope, coming-soon config, banner/ (banner_config + SiteBannerRail above the topbar), legal/ + support/ (legal_content/support_content blobs + resolvers with full code-default copy; support/'s Zod schema is split into an acyclic module family — supportContent.shared/.care/.size.zod.ts + parseUtils.ts, composed by supportContent.zod.ts — incl. the care-symbol legend and per-garment-type "Where we measure" point sets), publication readers, navigation + layout defaults, preview/ (admin live-preview bridge: protocol, PreviewDraftProvider, targets/highlight)
    legal/           Storefront legal-page UI: LegalDocument (sticky TOC + sections; its masthead is the shared shared/components/premium/PageMasthead), consumes cms/legal resolver
    support/         Storefront support-page UI: ContactPanel, Size/Care tables, per-product resolvers; consumes cms/support resolver. Page mastheads come from shared/components/premium/PageMasthead (DocHero was removed). faq/ ("The Forge Seam" — the forged-plate answer stack: FaqForge, FaqSeamRow, FaqSearchField, faqSearch, useFaqRailHeat; FaqAccordion.tsx is now a thin re-export). components/garments/ (per-garment-type schematic geometry — tee/stringer/hoodie/joggers/shorts outline+detail+badge anchors, registry, outline-bounds viewBox), MeasureExplorer + GarmentTypeTabs (the size-guide's garment-type tab strip, one tab per type the catalogue's sizeGuide.perProduct entries actually use), MeasurementFigure, CareSymbolGrid/Table/Legend/Popover (the 26-symbol care legend, searchable), lib/garmentTypes.ts (resolveGarmentTypeKeys)
    comingSoon/      Coming Soon reveal page: one-screen CMS-driven experience (backdrop/logo/countdown/email capture), GSAP entrance + pointer parallax, root-layout site-mode gate helpers
    experience/      Centralized experience system: registry (keyed 1:1 to active landing key), ExperienceProvider/useExperience, useExperienceVariant (structural variant seam), data-experience storefront wrapper, ExperiencePageTransition
    landingPages/    Code-owned landing pages: registry, renderer, asset slots, pages/TheOathLanding (the single Drop 01 cinematic landing)
    marketing/       Storefront home sections (home/: campaign cards, lookbook strip)
    passport/        Product passports: Zod schemas, RPC client (get/claim/transfer/visibility), usePassport hooks, ranks lib (3 levels/rank + emblems), country presets + WorldOriginMap, /p/$token experience (teaser, onboarding, ClaimCeremony, PassportPage → console/ ember-card console or scrolling dossier, both from the PASSPORT_SECTIONS registry grouped as Craft/Ritual/Legacy), webgl/ bento-card ember forge, effects/ (per-section signature effects: one lazy registry + PassportSectionEffectLayer host; sections/ has one file per effect incl. the EffectBlueprint WebGL hologram whose CSS .pp-holo is the gated fallback — see docs/animation-guidelines.md "Passport section effects")
    products/        Commerce adapters (localStorage, seed, Shopify), catalog, hooks. `lib/resolveCartVariantId.ts` is THE Shopify variant-GID lookup — it decides whether a cart line can reach hosted checkout, so it must never be re-derived per call site
    search/          Storefront global search: Fuse.js-backed matching engine (types/, lib/matchEngine.ts, index-agnostic), corpus assembly (lib/searchCorpus.ts, reshapes existing runtimeClients/CMS reads), useGlobalSearch hook + GlobalSearchBar/Dropdown/Overlay UI — mounted in PremiumNavTopbar + PremiumNavMobile
    share/           The share sheet: ShareButton + ShareModal (tabs/ Image · Link · QR), targets.ts (send-to registry + pure resolveShareRoute), captions.ts, shareActions.ts, useShareCapabilities/useImagePick/useShareData/useShareLauncher, image/ (drawKit + shareImage + presets/ — one file per look, seven in ONE family: a look is an arrangement, and the self-resolving stage supplies the hero, so every look works with or without a photo), qr/anvlQr.ts (branded QR), socialIcons.tsx
    shopify/         Shopify Storefront API client + mappers
    story/           Story saga: schemas, seed, asset resolver, page components + book overlay, Supabase/seed clients
    storefront-account/ Public account UI stubs. `auth/storefrontAuthEnabled.ts` holds ONLY the env check,
                     deliberately free of any import reaching `storefrontSupabaseClient` — the site-wide nav
                     calls it on every page, so importing the `./auth` barrel here put all of supabase-js on
                     the eager entry graph
  routes/
    __root.tsx       Root layout loader — fetches storefront projection from Supabase or runtime clients
    index.tsx        Home page — renders the active code-owned landing page (default: the-oath)
    shop/            Shop listing + PDP
    cart.tsx
    checkout/
    account/         Customer account (stub)
    p/$token.tsx     Product passport page — QR scan target (claim flow / owner dossier / public authenticity view; noindex)
    story.tsx        Story saga page (chapter shelf + deep-linkable book overlay)
    about.tsx        About page — renders <AboutExperience> (desktop Forge Altar / mobile normal page; CMS-editable copy + assets)
    auth/            Sign in / sign up / forgot password
    admin/           Slim CMS admin routes: dashboard (index), theme, fonts, assets, shop, products, content, about, coming-soon, legal, support, passports (+ passports_.content.$slug), techpacks, story, gamification, analytics, settings, login, category.$categoryKey
  shared/
    api/contracts/   Typed DTOs for future REST/BFF (scaffolding — not yet wired)
    assets/brand/    Inline SVG logo components (AnvlWordmark, AnvlCrest, etc.)
    components/
      brand/         AnvlLogoImage, DropEmblemDecor
      layout/        PremiumNav (+ mobile/topbar), AnnouncementRail, SiteFooter, GrainOverlay
      motion/        RevealOnScroll (IntersectionObserver + CSS — no motion library)
      premium/       PageMasthead (THE shared doc-page header — /faq, /care-guide, /size-guide, /contact, /shipping, /returns + the 4 legal pages; champagne-foil title, derived ghost watermark, no action slot), SectionShell, PageHero, ContentPanel, SectionEyebrow, ForgeAtmosphere, WarBanner
      seo/           JsonLd, MarketingToolsHead, structuredData
      ui/            Button, Input, Modal, Drawer, Select, Skeleton, SafeLink, Switch, DatePicker, PhoneInput, AnvlToaster, ForgeEmberCanvas, ModalForgeEffect, ToastForgeEffect, ThemeTintedMediaMark, etc.
    constants/       brand.ts, brandLogos.ts
    data/            countryDialCodes.ts
    devPreview/      DesignSystemPreviewProvider (Storybook-only theming wrapper)
    hooks/           useDialogFocusTrap, useLenisScroll, useLockPageScroll, useReducedMotion, useContainedMediaRect
    icons/           index.tsx — THE icon seam: @phosphor-icons/react re-exported under stable names + the inlined Anvil glyph. Never import the vendor directly
    lib/             cn.ts, gsap.ts, url.ts, iconSize.ts (ICON_SIZE buckets), stripAngleBracketTags.ts, color.ts, storage/, forge/ (emberForge.ts + forgeSurface.ts — the shared canvas-2D ember-forge engine backing Modal, the toast layer, and the About altar's ember hand-off; components/ui/ForgeEmberCanvas.tsx is its React shell)
    schemas/         media.schema.ts, stringList.ts (the orphaned money/navigation scaffolding was deleted 2026-07-29)
    webgl/           DustField, SiteDustGate, SiteDustLayer, dustShaders, particleShapes, siteDustState, isWebglAvailable, canvasTeardownGuard
  styles.css         Global tokens, themes, scrollbars, reduced-motion rules
  router.tsx         TanStack Router setup
  rateLimit.server.ts Cloudflare Rate Limiting binding wrapper — FAILS OPEN when the binding is absent (local dev / pre-deploy), so a missing binding can never refuse traffic. Used by the admin login server fn + /api/csp-report
  routeTree.gen.ts   AUTO-GENERATED — never edit directly
supabase/
  migrations/        Ordered SQL migration files
  functions/         Edge Functions (shopify-webhook, medusa-webhook-stub)
scripts/
  repatch-admin-route-tree.mjs  Patches routeTree.gen.ts for admin segment (runs before dev/build/typecheck)
  check-dynamic-import-entry.mjs  Fails the build if any chunk dynamically imports the ENTRY chunk — the
                                signature of a silent Rolldown bug where `await import(...)` resolves to a
                                namespace missing its bindings (see the chunk pins in vite.config.ts)
public/brand/        Raster + downloadable logo/asset exports
docs/                Architecture, feature specs, audit, changelog, brand, animation docs
```

---

## Important Commands

```bash
pnpm install                    # Install dependencies
pnpm dev                        # Dev server on port 3000 (repatch runs first)
pnpm test                       # Vitest single run
pnpm test:watch                 # TDD loop
pnpm test:coverage              # Coverage report (v8 provider → dist/coverage)
pnpm test src/features/cart     # Run one feature's tests
pnpm typecheck                  # tsc --noEmit (repatch runs first)
pnpm build                      # Production build (client + workerd SSR bundle → dist/) + dynamic-import-entry guard
pnpm preview                    # Serve the built Worker locally in workerd
pnpm run deploy                 # pnpm build && wrangler deploy → Cloudflare Workers
pnpm cf-typegen                 # wrangler types → worker-configuration.d.ts (gitignored, regenerable)
pnpm verify                     # typecheck + test + build (definition of done gate)
pnpm analyze                    # Bundle treemap → dist/stats.html (ANVL_ANALYZE=1)
pnpm storybook                  # Component workbench on port 6006
pnpm build-storybook            # Static Storybook build
pnpm docs:check                 # Doc-freshness gate (which docs this change set still owes)
node scripts/compress-glb-textures.mjs public/about/*.glb   # Re-encode embedded GLB textures (--check to report only)
pnpm hooks:install              # Point git at .githooks (one-time, per clone)
```

> No ESLint is configured. `pnpm typecheck` is the static analysis gate.
> Cloudflare Workers deployment: see `docs/deployment.md`. All commands require **Node ≥22.15** (Node 24 LTS recommended) — the Cloudflare vite plugin is always on, so `dev` also runs on `workerd`.

---

## Environment Variables Rules

- `VITE_*` vars are **inlined into the client bundle** by Vite. Only public, non-secret config may use this prefix.
- **Never** put secrets, service role keys, admin tokens, or private API keys into `VITE_*` vars.
- Allowed `VITE_*` vars (public, safe in browser):
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase project URL + anon/publishable key
  - `VITE_SHOPIFY_STORE_DOMAIN`, `VITE_SHOPIFY_STOREFRONT_API_VERSION`, `VITE_SHOPIFY_STOREFRONT_PUBLIC_TOKEN`
  - `VITE_CANONICAL_BASE_URL`, `VITE_ANVL_INTERNATIONAL_CHECKOUT`
- Server-only / Edge (never `VITE_*`): `SUPABASE_SERVICE_ROLE_KEY`, `SHOPIFY_ADMIN_API_ACCESS_TOKEN`, `SHOPIFY_API_SECRET_KEY`, `ANVL_ADMIN_SESSION_SECRET` (seals the HttpOnly `/admin` session cookie — see `src/features/admin/auth/adminAuthSession.server.ts`; 32+ chars, rotating it signs out all admin sessions)
- `.env.example` must have placeholder values only — never real credentials.
- Browser env vars are validated **per-consumer**, not in one place: `VITE_ANVL_INTERNATIONAL_CHECKOUT` via Zod in `src/app/config/publicEnv.ts`; the Supabase URL/key via hand-rolled checks in `src/features/cms/api/supabasePublicEnv.ts` (`getSupabaseEnvIssue` / `isUsableSupabasePublicKey`). The `VITE_SHOPIFY_*` vars are presence-checked only. Adding a new `VITE_*` var means picking one of these paths deliberately.
- **Cloudflare Workers split (see `docs/deployment.md`):** `VITE_*` vars are **build-time** — they must be present when `vite build`/`pnpm deploy` runs (local `.env` or CI), **not** Worker secrets. Server runtime vars live on the Worker: `NODE_ENV=production` in `wrangler.jsonc` `vars` (Cloudflare doesn't set it automatically; the admin/CSRF cookies' `Secure` flag depends on it), and `ANVL_ADMIN_SESSION_SECRET` via `wrangler secret put` (never committed). `nodejs_compat` is required for request-time `process.env` reads.

---

## Supabase Rules

### Schema (key tables)

| Table | Purpose | RLS |
|---|---|---|
| `public.cms_profiles` | Links `auth.users` to CMS role (`viewer\|editor\|admin`) | Read own row |
| `public.cms_settings` | Singleton: active drop key, theme, fonts, asset slot map, landing content blobs | **CMS-role read** (`viewer\|editor\|admin` — there is no anon SELECT), editor/admin update |
| `public.landing_pages` | Picker metadata (keys must match code registry) | Public read available rows |
| `public.storefront_publication` | Anon-readable mirror: theme, fonts, assets, media_index, active key | Public read, **admin** update (policy is `role = 'admin'`, not editor) |
| `public.cms_media_assets` | Media library + asset assignments | CMS roles only |
| `cms_settings.shop_config` / `storefront_publication.shop_config` | Shop Experience config blob (jsonb) — `/shop` layout/behavior/copy; mirrors `landing_content` flow | Public read, editor update |
| `cms_settings.coming_soon` / `storefront_publication.coming_soon` | Coming Soon site-mode blob (jsonb) — `enabled` toggle + reveal-page copy/countdown/assets/SEO; mirrors `shop_config` flow | Public read, editor update |
| `cms_settings.banner_config` / `storefront_publication.banner_config` | Storefront announcement banner blob (jsonb) — enabled, message, optional href/label/image, colors, optional schedule; mirrors `coming_soon` flow | Public read, editor update |
| `cms_settings.legal_content` / `storefront_publication.legal_content` | Legal pages blob (jsonb) — privacy/terms/cookies/accessibility copy (title, updatedAt, intro, sections); mirrors `banner_config` flow | Public read, editor update |
| `cms_settings.support_content` / `storefront_publication.support_content` | Support pages blob (jsonb) — faq/contact/shipping/returns/care/size copy + per-product care lines & size tables keyed by slug; mirrors `banner_config` flow | Public read, editor update |
| `cms_settings.site_seo` / `storefront_publication.site_seo` | Site-wide SEO + analytics blob (jsonb) — global SEO defaults, per-page SEO, technical (robots/sitemap), and marketing/analytics tags (GA4/GTM/Meta Pixel/Hotjar/verification/custom script); authored at `/admin/analytics`, injected by `MarketingToolsHead`; mirrors `banner_config` flow | Public read, editor update |
| `public.coming_soon_subscribers` | Early-access emails from the Coming Soon page (write-only mailbox, unique lower(email)) | Anon INSERT only; admin SELECT |
| `cms_settings.pdp_content` / `storefront_publication.pdp_content` | Per-product PDP editorial content (jsonb `{ [slug]: {...} }`) — bento copy + per-product assets; commerce data stays on the product | Public read, editor update |
| `public.product_passports` | Per-unit QR registration tokens + one-time transfer codes + owner `is_public` visibility + Armory life (`wear_count`/`last_worn_at`, `featured_slot` 1-3 for Hall of Honor). **No public SELECT** (token enumeration); reads via `get_passport_by_token` RPC (privacy-aware: owner name/date only when public, owner, or holding a live transfer code), atomic first-claim via `claim_passport`, hand-over via `initiate/cancel/accept_passport_transfer`, visibility via `set_passport_visibility`, wear via `log_passport_wear`, pin via `set_passport_featured` (all SECURITY DEFINER). **Serials are internal-only — never shown to customers** | Owner reads own claimed rows; CMS read all; editor write |
| `public.armory_feats` | Owner-authored achievement log ("Deadlift PR — 240 kg"), each with a per-entry `is_public`. No anon SELECT; public entries surface only via `get_public_armory` | Own-row CRUD |
| `public.product_reviews` | PDP reviews, one per owner per product; write gated on holding a registered passport for the product (`submit_product_review` verifies ownership). Anon read via `get_product_reviews` (name/content only, `is_mine` for the signed-in owner) | Owner read/delete own; RPC-gated write |
| `public.passport_transfers` | Passport ownership hand-over log (written by the accept RPC). Since `20260804174508`, `accept_passport_transfer` **resets the receiving owner's Armory state** (`wear_count`, `last_worn_at`, `featured_slot`, `is_public`) — without that the transfer could hard-fail on the `(claimed_by, featured_slot)` partial unique index | Participants read own rows; CMS read all |
| `cms_settings.passport_content` / `storefront_publication.passport_content` | Per-product passport section content (jsonb `{ [slug]: {...} }`) — identity/piece/material/**blueprint**/care/details/origin copy + assets, authored in the passports wizard; mirrors `pdp_content` flow | Public read, editor update |
| `public.techpacks` | One row per uploaded supplier techpack PDF; `document` jsonb holds the parsed `TechpackDocument`, `ai_document` holds optional AI suggestions (never merged into `document`). Partial unique index enforces at most one `is_final` per `product_slug` — set it via `set_techpack_final()`, never client-side, or the two-statement swap races the index and can leave zero finals. **No anon policy** | CMS roles read, editor write |
| `public.techpack_images` | Images extracted from a pack, stored in the PRIVATE `techpacks` bucket. `promoted_media_id → cms_media_assets` (ON DELETE SET NULL) records the one deliberate act that lets an image reach the storefront. **No anon policy** | CMS roles read, editor write |
| `public.story_chapters` | Story "books" (`product_slug` = Shopify handle); **multiple chapters may share a product_slug** — PDP/passport embed the first by `sort_order`; grouped by `drop_label`/`drop_slug`; acts are its pages | Public read published; editor write |
| `public.story_acts` | Ordered story beats (book pages) within a chapter | Public read (parent published); editor write |
| `public.story_cast` | CMS-authored characters (army roster) | Public read (parent published); editor write |
| `public.gamification_settings` / `gamification_ranks` / `gamification_rank_levels` / `gamification_challenges` / `gamification_badges` | The Armory's editable gamification rules (Forge XP constants + level curve; **4 seeded** rank keys with per-level AND-combined thresholds + optional `emblem_url` override — the `CHECK` constraint pinning the key set was dropped in `20260720120000_gamification_rank_keys.sql`, so admins can create and delete ranks and `ArmoryRankKey` is a free string with code-owned fallback artwork; challenges/badges as declarative `metric ∈ {registrations, total_wears, max_wears, feat_count, full_drops, honor_pinned}` + target). Seeded == code defaults (`DEFAULT_GAMIFICATION_RULES`), so pre-migration behavior is identical. Storefront reads via anon fetch (`useGamificationRules`, React Query, defaults as placeholder); rules resolvers in `passport/lib/{ranks,challenges,forgeXp}.ts` take rules with default fallback | Public SELECT; editor/admin write |
| `public.storefront_profiles` | Customer identity/profile — name, email, `phone`, `addresses` (jsonb), notification prefs; `armory_public` + minted-once `armory_handle` for the shareable read-only armory (`/armory/$handle` via `get_public_armory`, toggled by `set_armory_share`); auto-created on signup | Read/update own row |
| `public.orders` | Shopify order mirror (written by `shopify-webhook` Edge Fn) for account order history | Read own (by id or email claim); service-role write only |

### Rules

- **Row Level Security is always on.** Never disable RLS on a table.
- Only users with `cms_profiles.role = 'admin'` may access `/admin` UI (editors/viewers rejected at login). DB RLS allows `editor`/`admin` CMS writes.
- `storefront_publication` is the **primary** Supabase read for storefront SSR (anon-safe). `cms_settings` is the editor source of truth.
- Admin Supabase client uses browser storage key `anvl.supabase.admin.v1`.
- `SUPABASE_SERVICE_ROLE_KEY` is **never** bundled in client code. It is for migrations and privileged server scripts only.
- All CMS JSON writes must pass Zod validation (`cmsSiteConfig.zod.ts`) before Supabase upsert.
- Before any schema change: document current schema → target schema → migration steps → risks → rollback plan.
- Published storefront state flows: admin edits local working copy → `adminCmsRemoteSync` → **`publish_cms_settings()`** → `cms_settings` + `storefront_publication`, in **ONE transaction** (F-19). Never write those two tables as separate UPDATEs: postgrest-js does not reject on a transport failure, so a `Promise.all` pair half-succeeds silently and the split is invisible (hydration reads `cms_settings` only). The RPC gates on **`admin`** — the stricter of the two tables — and treats a JSON `null` as absent, since every jsonb column is `NOT NULL` but a JSON null is a legal jsonb value the constraint will not catch.

### Edge Functions

| Function | Purpose | Deploy state (verified 2026-07-29) |
|---|---|---|
| `shopify-webhook` | Verifies Shopify HMAC. For `orders/*` topics it upserts a denormalized copy into `public.orders` (service role), linking to `storefront_profiles` by email; all other topics are acknowledged without writes | **Deployed** (v4, ACTIVE) |
| `techpack-ai` | Optional AI rewrite overlay for a parsed techpack — writes only `techpacks.ai_document`, never `techpacks.document`. Returns `not_configured` until `ANTHROPIC_API_KEY` is set as a Supabase secret | **Deployed** (v3, ACTIVE, `verify_jwt: true`) |
| `medusa-webhook-stub` | Placeholder for future Medusa sync | **In repo, never deployed** |

> Publish/scheduled-drop Edge Functions were removed. Admin sync writes directly via `adminCmsRemoteSync`. See MIG-01 in `docs/technical-debt.md` for migration drift.

### Storage buckets

| Bucket | Public | Limit | Purpose |
|---|---|---|---|
| `cms-media` | Yes | 50 MB | General CMS media library (images/fonts/video/GLB) — live since 2026-05-18 |
| `story-media` | Yes | 500 MB | Story saga chapter/act media — live since 2026-06-09 |
| `techpacks` | **No** | 100 MB | Private techpack PDFs + extracted images; SELECT is RLS-gated, reads go through `createSignedUrl` |

---

## CMS Rules

### Architecture

The CMS is split into two surfaces:
1. **Admin CMS** (`src/features/admin/`) — Seven editors: active drop (dashboard), theme & colors, fonts, assets, landing content, about, story (+ settings). Every page renders inside the wide-screen **workspace shell** (`AdminLayout layout="workspace"` → `AdminWorkspace` = primary editing column + sticky contextual `AdminRailPanel` rail; collapses to one column below `xl`).
2. **Storefront CMS reads** (`src/features/cms/`) — Read-only projection: theme, fonts, assets, active landing key, landing content

**Flow:** `admin edits → adminCmsRemoteSync → cms_settings + storefront_publication mirror → SSR reads projection`

Storefront never reads admin draft data directly. Landing page **content** is code-owned; CMS only picks which page is active and overrides theme/fonts/asset slots.

### Admin routes

| Route | Purpose |
|---|---|
| `/admin` | Active drop picker (Supabase `landing_pages` ∩ registry) |
| `/admin/theme` | Palette + `dataTheme` mode |
| `/admin/fonts` | `--font-sans`, `--font-heading`, `--font-display` family names |
| `/admin/assets` | Media library + general/per-drop slot assignments |
| `/admin/shop` | Shop Experience editor — shop layout, product cards, filters, sort, toggles, state copy **and the Product-detail (PDP) section toggles + related count + animation** (`shop_config`, incl. `shop_config.pdp`) |
| `/admin/products` | Per-product PDP editorial content — pick a product (commerce catalog / Shopify), author its bento story/material/care/details + editorial assets (`pdp_content`, keyed by slug) |
| `/admin/techpacks` | Techpacks — upload a supplier techpack PDF, parse it **in the browser** (pdf.js) into a normalized `TechpackDocument`, review the extracted fields + parser issues, promote extracted images into the media library one at a time, and **Import from techpack** into `passport_content` / `support_content.sizeGuide` / `pdp_content`. Many packs per product, exactly one `is_final` (relational: `techpacks` + `techpack_images`, private `techpacks` bucket) |
| `/admin/content` | Landing content editor — per-scene copy overrides with code-default fallbacks |
| `/admin/about` | About page editor — hero, the **orbs** (add/edit/remove free-form sections: label, color, copy, lines, points, stats, CTAs, image), marquee (`landing_content.about`); anvil/hammer GLBs + page imagery assign on `/admin/assets` |
| `/admin/coming-soon` | Coming Soon site mode — master toggle + reveal-page copy, countdown, early-access capture, assets, SEO (`coming_soon`) |
| *(dashboard modal)* | Storefront announcement banner — managed from the dashboard's drop-status modal (`BannerCustomizeModal`: live mini-preview, message/link/image, solid-or-gradient colors, idle-animation presets, optional schedule + manual switch; `banner_config`); renders above the topbar via `SiteBannerRail`. The standalone `/admin/banner` page was removed 2026-07-22 |
| `/admin/legal` | Legal pages editor — tabbed (privacy, terms, cookies, accessibility): title, updated-date, intro, reorderable sections (`legal_content`) |
| `/admin/support` | Support pages editor — tabbed (FAQ, contact, shipping, returns, care guide, size guide, **Measurements**, **Care symbols**) incl. per-product care lines + size tables keyed by slug, the "Where we measure" per-garment-type point sets (`sizeGuide.measure`, CMS-reorderable), and the 26-entry care-symbol legend (`careGuide.legend`) (`support_content`) |
| `/admin/passports` | Product passports, two tabs: **QR codes** (generate per-unit batches, claimed/unclaimed ledger, unassign/delete, printable QR sheet — relational CRUD via `product_passports`) and **Passport content** (a product picker that opens `/admin/passports/content/$slug` — an 11-tab per-product editor: identity, piece, material, blueprint, specs, care, fit, hotspots, forgeNotes, details, origin — each tab its own copy + assets, saved to `passport_content`) |
| `/admin/techpacks` | Techpack ingestion — upload supplier PDFs (parsed client-side via pdf.js into a `TechpackDocument`), review the blueprint/specs/sizing/care extraction plus the issues queue, selectively import facts into `passport_content` / `support_content` / `pdp_content`, promote extracted images into the media library, optional AI-rewrite overlay (`techpacks` + `techpack_images` tables, private `techpacks` storage bucket) |
| `/admin/story` | Story saga editor — chapters, acts, cast (relational; Supabase CRUD) |
| `/admin/gamification` | Gamification — the Armory's rules in four tabs: **Ranks** (4 seeded identities + create/delete; copy/emblem/per-level thresholds), **Challenges** (drag-reorder, metric+target, active toggle, create/delete), **Forge XP** (4 constants + level-curve factor with preview), **Badges** (metric+target milestones). Relational CRUD on the `gamification_*` tables |
| `/admin/analytics` | Analytics & SEO — the site-wide `site_seo` blob: analytics/marketing tags (GA4, GTM, Meta Pixel, Hotjar, Google site verification, custom script — provider + ID + on/off), search-engine visibility (robots/sitemap), global SEO defaults. Storefront injects the published tags via `MarketingToolsHead` |
| `/admin/settings` | Session + local reset |

> **Admin shell (2026-07-18 rework):** persistent categorized sidebar ≥1024px (collapsible to an icon rail, preference in `anvl.adminSidebar.v1`; drawer below `lg`). Categories: Dashboard · Design (theme, fonts) · Content (landing, about, story, coming-soon) · Commerce (shop, products, techpacks) · Passports · Gamification · Media (assets) · Settings — nav-only grouping, `/admin/*` URLs unchanged (`adminNav.ts` is the single IA source; breadcrumbs derive from it). A topbar **Preview** toggle opens the live-preview panel (below).

> **Live preview:** the admin embeds the REAL storefront in a same-origin iframe (`/<route>?anvl-cms-preview=1`) and pushes UNSAVED editor working copies over a Zod-validated postMessage bridge (v1: `hello`/`draft`/`focus`/`hover` → `ready`/`located`). The handshake is **bidirectional** (the storefront announces `ready` after hydration; the admin replies + retries `hello`) and requires same-origin framing — `X-Frame-Options: SAMEORIGIN` + `frame-ancestors 'self'` in `src/start.ts` (never DENY/'none' — that kills the preview). Storefront side lives in `src/features/cms/preview/` (SSR-safe, null until post-mount, same-origin-gated); admin side in `src/features/admin/preview/` (draft store, lazy `AdminPreviewPanel` with device switcher — desktop 1280 triggers the real Oath cinematic gate — locate buttons, and **inspection-style hover**: `usePreviewHoverProps` on editor fields rings the matching `data-anvl-preview-target` element while hovered; Oath scenes resolve via their existing `data-scene` contract; About orbs use index-based `about:orb-N` ids). Save still = publish; the preview only covers the pre-save gap.

> **The ANVL Studio identity:** `/admin/*` does NOT wear the storefront theme — `AdminThemeProvider` (`src/features/admin/theme/`) applies a fixed dark "forge control room" palette (graphite `#15171A`, bone text, molten-copper `#D96C2C` accent — warmer/lighter than the storefront's near-black) built through `themeConfigToCssVars`, so shared components/portals re-skin wholesale and the storefront theme restores on exit. The storefront palette appears in the admin only inside the theme editor's scoped preview.

### localStorage Adapter Pattern

Every localStorage-backed adapter uses `createJsonStore<TSchema>({ key, schema, defaults, merge })` from `src/shared/lib/storage/createJsonStore.ts`. This:
- Validates input with Zod before merging (prevents `__proto__` injection, SEC-17)
- Uses `z.strict()` on persistence schemas
- Emits `createLocalStorageChannel` events for cross-tab sync

### CMS Data Flow

```
Admin editor (localStorage working copy)
  → adminCmsRemoteSync → cms_settings + storefront_publication
  → SSR loadStorefrontProjection()
  → SiteThemeProvider (CSS vars) + resolvePublishedAssets → LandingPageRenderer
```

### Rules

- Do **not** import `src/features/admin/**` in storefront/marketing code (runtime code). Type-only imports are discouraged too.
- CMS-driven `href`/`src` values going into the DOM must go through `sanitizeHref()` in `src/shared/lib/url.ts`.
- New `dangerouslySetInnerHTML` requires: justification comment + sanitizer + Vitest test.
- Landing pages are **code-owned** (`src/features/landingPages/`). CMS controls the active key, asset slot overrides, and — for pages that define a content schema (The Oath) — per-scene **copy overrides** via `landing_content`, where every field falls back to designed code defaults when blank.
- Asset slots are defined in code per drop (`assetSlots.ts`); CMS assigns media IDs to slots.
- **Asset naming convention:** every media upload is force-named `[page]-[slot].ext` via the upload naming modal (`MediaUploadNamingModal` — contexts/slots come from the real slot registries; free-purpose contexts still enforce the kebab format). The library's filenames therefore always say where an asset belongs.
- Nav/footer/SEO use code defaults — not CMS-editable.

---

## Landing Page Rules

- Landing pages are **static, code-owned** React components registered in `src/features/landingPages/registry.ts`.
- The home route renders `<LandingPageRenderer>` with `products` + `assets` from the storefront loader.
- Active page key comes from `storefront_publication.active_landing_page_key` (fallback: `the-oath`).
- `TheOathLanding` is the reference implementation — GSAP scroll timeline in `hooks/useTheOathScrollTimeline.ts`.
- Do not hardcode landing content in route files — use the page folder + registry pattern.
- Always support SEO metadata for landing pages (via `buildSeoMeta()` + route loaders).
- Landing page components receive: `{ products, assets }` via `LandingPageComponentProps`.
- **Home is full-bleed under a transparent header.** On the home route `<main>` reserves no header padding (`getStorefrontMainClassName` returns `undefined` for `isHome`) and `PremiumNav` is rendered with `alwaysTransparent` (never turns into a solid scrim bar). The Oath scenes are therefore full screen height (`100svh`, **not** `--anvl-section-h`) and their pinned ScrollTriggers start at `top top`, so each section fills the viewport behind the bar with no header-height gap. A fixed themed void backdrop (top edge = `--color-bg`) sits behind every scene so the strip behind the transparent bar matches the sections. Non-home routes keep the normal transparent→solid-on-scroll header + `--anvl-header-h` main padding.

---

## Styling Rules

- **Tailwind CSS v4** — utility-first, no config file; configured via `@theme` in `src/styles.css`.
- **CSS variable tokens** — all color, spacing, and animation tokens are defined as CSS custom properties in `src/styles.css`. Use them instead of hardcoded values.
- **One normalized theme palette (single source of truth).** The CMS theme editor exposes exactly **15 editable tokens** — `background`, `foreground`, `card`, `cardForeground`, `muted`, `mutedForeground`, `border`, `primary`, `primaryForeground`, `accent`, `accentForeground`, `ring`, `destructive`, `success`, `warning` — defined by `themePaletteSchema` (`THEME_PALETTE_KEYS`) in `src/features/cms/config/cmsSiteConfig.zod.ts`. `themeConfigToCssVars` deterministically derives **all** `--color-*` / `--hero-*` / `--particle-*` / `--scrollbar-*` / brand-alias vars from those 15 tokens, and is the single map feeding SSR first-paint inline CSS, `SiteThemeProvider`, and the editor preview. The storefront, brand graphics, and the WebGL landing emblem/dust all read the **same** vars (`readOathBrandColors()`), so CMS + storefront + WebGL cannot diverge. There is **no per-landing-page palette override**. Legacy palette keys are migrated on read.
- **Shop semantic layer.** `themeConfigToCssVars` also derives a `--shop-*` token block (`--shop-bg`, `--shop-card-bg`, `--shop-card-border`, `--shop-accent`, `--shop-card-glow`, `--shop-card-light`, `--shop-skeleton-*`, `--shop-out-of-stock`, …) from the same 15 palette tokens. The entire `/shop` experience (`src/features/products/shop/**`, the forged `ShopProductCard`, quick-add/quick-view) reads **only** `--shop-*` — never raw palette fields — so it auto-adapts to every CMS theme with no shop-specific colors.
- Theme switching: set `data-theme="oath-dark"` or `data-theme="bone-light"` on `:root`.
- `cn()` from `src/shared/lib/cn.ts` (clsx + tailwind-merge) — use for conditional class merging.
- `cva` (class-variance-authority) — use for component variants (Button sizes, etc.).
- Avoid massive unreadable `className` strings when a component abstraction is better.
- Mobile-first responsive: `sm:`, `md:`, `lg:`, `xl:`, `2xl:` breakpoints.
- Import aliases: `@/` and `#/` both resolve to `src/`.
- Key CSS variables:
  - `--anvl-header-h: 4rem` — sticky header height
  - `--anvl-section-h: calc(100svh - var(--anvl-header-h))` — full viewport minus header
  - `--anvl-content-max: 80rem` — standard content column max-width
  - `--anvl-section-py: 4rem` — section vertical padding

---

## Animation Rules

- Animation must serve the brand. Motion should feel cinematic, premium, forged, and intentional.
- Avoid random decorative animation.
- **Mobile:** simplified or disabled animation. The Oath cinematic (GSAP pins, WebGL) runs at **≥1280px (`xl`)** only; tablet gets static layout.
- **Reduced motion:** always respect `prefers-reduced-motion: reduce`.
- **Two animation systems:**
  - **GSAP** — cinematic desktop sequences (hero pinning, scroll reveals, timelines)
  - **IntersectionObserver + CSS transitions** — lightweight reveals (`RevealOnScroll`), hover states, focus rings. There is no motion library: `framer-motion` was removed once `RevealOnScroll` was rewritten without it. Reach for GSAP or plain CSS, not a new dependency.
- Keep animation logic in dedicated hooks/utilities, not scattered in component render bodies.
- `useReducedMotion()` hook (`src/shared/hooks/useReducedMotion.ts`) — use before creating expensive animations.
- Reference cinematic implementation: `TheOathLanding` — timeline in `hooks/useTheOathScrollTimeline.ts` composing the per-scene `motion/buildOath*.ts` builders, with a DOM⇄WebGL motion bridge (`motion/oathMotionState.ts`).
- **The particle-forge standard is THE quality bar for cinematic surfaces** (Coming Soon ember anvil, The Oath hero product forge, the passport forge). Recipe — fixed particle pool morphed in the vertex shader via `aFrom→aTo` + per-seed stagger, `sampleImageSilhouette()` registering embers 1:1 to real pixels, the uniform vocabulary (`uAssemble`/`uMorph`/`uBurst`/`uReveal`/`uZoom`), a shared choreography-clock constants file per surface, a mutable motion-state bridge, brand-token colors only, lazy `vendor-three` gates with a DOM-only fallback that stands alone — documented in full in `docs/animation-guidelines.md` ("The ANVL particle-forge standard"). New cinematic features must follow it.

---

## GSAP Rules

- All GSAP plugins are registered **once** in `src/shared/lib/gsap.ts` (`ScrollTrigger`, `SplitText`, `Flip`, `useGSAP`). Import from there, never from `gsap` directly in components.
- **Shop grid reflow** uses GSAP **Flip** (`ProductGrid`): snapshot the old layout during render (before React commits the new order), then `Flip.from` in `useGSAP` — gated to `(min-width: 768px) + no-reduced-motion`. The product card (`ShopProductCard`) uses clean CSS-only hover (lift + image zoom) — no pointer-tilt/WebGL.
- **PDP scroll reveals** use `usePdpReveal` (`src/features/products/pdp/hooks/`): one `gsap.matchMedia` + `ScrollTrigger.batch` over `[data-reveal]` elements, gated `≥768px + no-reduced-motion` (snaps visible on mobile/reduced). Honors `shop_config.pdp.animationIntensity` + the global `animationDurationMultiplier`.
- GSAP plugin registration is guarded: `if (typeof window !== 'undefined')` — SSR-safe.
- Always use `useGSAP` from `@gsap/react` — it handles cleanup automatically.
- Always call `mm.revert()` / `ctx.revert()` in the `useGSAP` cleanup return for `gsap.matchMedia`.
- GSAP ScrollTrigger code **must** use `gsap.matchMedia` with **both** gates:
  - **Generic storefront GSAP:** `(min-width: 768px)` + `(prefers-reduced-motion: no-preference)`; mirror branch `(max-width: 767px), (prefers-reduced-motion: reduce)` snaps via `gsap.set`
  - **The Oath landing:** use `oathBreakpoints.ts` — cinematic at **`≥1280px`** (`OATH_DESKTOP_CINEMATIC_MQ`); static at `max-width: 1279.98px` or reduced motion (`OATH_STATIC_MQ`)
- Reference implementation: `src/features/landingPages/pages/TheOathLanding/hooks/useTheOathScrollTimeline.ts`
- Never call `new Lenis()` directly — use `useLenisScroll` hook (`src/shared/hooks/useLenisScroll.ts`).
- Lenis gates at **`≥768px`** + no reduced motion (independent of Oath's 1280px cinematic gate).
- Prefer animating `transform` and `opacity` only. Avoid `width`/`height`/`top`/`left`.
- Refresh ScrollTrigger when layout or images affect measurements (after fonts/images load).
- Avoid scroll-jacking unless explicitly approved.
- `gsap.matchMedia` scope must be reverted on cleanup.
- Use `ScrollTrigger.refresh()` defensively after content changes.

---

## TypeScript Rules

- `strict: true` — no exceptions.
- Never use `any`. If unavoidable, document with a one-line reason comment.
- Prefer `unknown` over `any` for truly unknown types.
- Avoid `as unknown as T` casts — use `z.infer<typeof schema>` or discriminated unions.
- Never duplicate a type that a Zod schema already defines — pick one source of truth, always `z.infer`.
- `verbatimModuleSyntax: true` — type-only imports **must** use `import type`.
- `noUnusedLocals: true` / `noUnusedParameters: true` — clean up unused declarations.
- Type all: Supabase row shapes, insert/update DTOs, service responses, route loaders, hook returns, component props.
- Use discriminated unions for status fields, variants, CMS block types.
- Use literal unions for known values (statuses, roles, landing page keys, theme token keys).
- Keep types close to the domain they describe (feature folder, not a global types folder).

---

## React Rules

- Functional components only.
- Never call hooks conditionally, in loops, or after early returns.
- Custom hooks start with `use`. Keep them focused on one concern.
- Avoid `useEffect` for derived state — compute during render or use `useMemo`.
- Avoid prop drilling when context, route-level data, or Zustand is cleaner.
- Use memoization (`useMemo`, `useCallback`, `React.memo`) only when profiling proves a real problem.
- Keep loading / error / empty / success states explicit.
- Every form uses React Hook Form + Zod schemas.
- Route files are thin — heavy UI lives in feature components imported by routes.
- SSR: never access `window`, `document`, `localStorage`, `matchMedia` at module top-level or during render. Gate inside `useEffect` or check `typeof window !== 'undefined'`.
- Avoid hydration mismatches — anything that differs server/client needs a `useEffect` or `ClientOnly` pattern.
- **Radix `Select.Item` cannot take `value=""`** — Radix reserves the empty string for "cleared, show the placeholder" and *throws*, crashing the whole panel. A select that needs a genuinely selectable "none"/"unassigned"/"assign later" option must swap the empty value for a sentinel at the boundary. `AdminFieldSelect` already does this (`EMPTY_OPTION_SENTINEL`, engaged only when such an option exists), so prefer it over hand-rolling a Radix select; any new wrapper must do the same.

---

## Rules of Hooks

1. Only call hooks at the top level of a React function or custom hook.
2. Never call hooks inside conditions (`if`, `switch`, ternary).
3. Never call hooks inside loops.
4. Never call hooks inside nested functions.
5. Never call hooks after an early return.
6. If a branch needs different hooks, extract it into its own component.
7. Custom hooks must start with `use`.

---

## TanStack Start / Router Rules

- File-based routing in `src/routes/`. Route files match URL segments.
- `src/routeTree.gen.ts` is auto-generated — **never edit it**. Run `pnpm dev` or `pnpm typecheck` to regenerate.
- `scripts/repatch-admin-route-tree.mjs` patches the generated tree for admin lazy routes — it runs automatically.
- Route files export a `Route` created with `createFileRoute` or `createRootRoute`.
- **Route loaders** are for SSR data fetching. Use `Promise.all` for independent fetches. Run redirect guards first, then parallelize.
- Heavy admin routes **must** use `lazyRouteComponent(() => import('...'))` (PERF-01).
- Route files should be thin — delegate rendering to feature components.
- `defaultPreload: 'intent'` is enabled — routes preload on hover.
- `defaultPreloadStaleTime: 30_000` (30s) — data is reused during preloads within that window.
- Keep server/client responsibilities clear — loader runs on server; component runs on client (and server for SSR).
- Use TanStack Query for data that needs caching, refetching, or pagination. Loaders are for initial SSR seed.

---

## shadcn/ui Rules

> **shadcn/ui is NOT installed in this project.**

The project uses its own branded UI system under `src/shared/components/ui/`:
`Button, Input, Modal, Drawer, Select, Skeleton, SafeLink, FormField, IconButton, Badge, Checkbox, ColorSwatch, QuantityStepper, SizeSelector, ProductCard, EmptyState, AccordionDisclosure, Textarea, Container, Section, Switch, DatePicker, PhoneInput, AnvlToaster, ForgeEmberCanvas, ModalForgeEffect, ToastForgeEffect, ThemeTintedMediaMark`

If shadcn/ui is added in the future:
- Customize components to match ANVL brand — do not use default shadcn styles.
- Preserve accessibility.
- Do not create multiple conflicting button/input systems.
- Keep component API consistent with existing patterns.

---

## Shopify Integration Rules

- Shopify is **optional** — it activates when `VITE_SHOPIFY_STORE_DOMAIN`, `VITE_SHOPIFY_STOREFRONT_API_VERSION`, and `VITE_SHOPIFY_STOREFRONT_PUBLIC_TOKEN` are set.
- Commerce client is created via `createCommerceClient(options)` in `src/features/products/api/createCommerceClient.ts` — it picks the right adapter automatically.
- Shopify Storefront API (public token) is safe in browser. Shopify Admin API token is **never** in client code.
- All Shopify code is isolated in `src/features/shopify/` and `src/features/products/api/commerceClient.shopify.ts`.
- The `CommerceClient` interface in `clients.ts` is the contract — swap adapters without touching UI.
- Product data from Shopify is mapped to internal `Product` type via `shopifyProductToStorefront.ts`. Shopify products **must** use option names `Size` and `Color` (the mapper matches them case-insensitively) and the internal `slug` is the Shopify `handle`. The mapper also emits `ProductShopMeta.variantIdByColorAndSize` (variant GID per colorway→size) for checkout.
- **Hosted checkout:** `CommerceClient.startCheckout(lines)` builds a Shopify cart via the Storefront `cartCreate` mutation (`src/features/shopify/api/shopifyCart.ts`) and returns the hosted `checkoutUrl`; the cart line carries the Shopify variant GID (`CartLine.variantId`, resolved in `usePdpVariant`). Seed/local adapters return `null`, so `routes/cart.tsx` falls back to the internal mock `/checkout` when Shopify is unset.
- The Storefront token for this store is minted from the **Headless** sales channel (legacy custom-app dev is migrated to the Dev Dashboard). Products must be **published to the Headless publication** or the Storefront API returns nothing.
- CMS (theme, fonts, assets, landing content, story) stays in Supabase even when Shopify is the commerce backend.
- Edge Function `shopify-webhook` is ack-only (no product snapshot writes).

---

## SOLID Principles

**Single Responsibility:** Each component, hook, service, utility has one clear job. Never create a component that fetches, transforms, manages state, animates, and renders all at once.

**Open/Closed:** Use config-driven patterns (registries) for extension points. The landing-page `registry.ts` (`src/features/landingPages/`) is the model — register a new coded page without modifying the renderer/resolver logic.

**Liskov Substitution:** All `CommerceClient` / `CmsClient` adapters must satisfy their interface contract. Components relying on the interface must not care which adapter runs.

**Interface Segregation:** Keep props interfaces focused. Do not pass a huge god-object when a component only needs two fields. Split `RuntimeClients` into individual clients.

**Dependency Inversion:** UI and routes depend on interfaces (`CmsClient`, `CommerceClient`), not concrete implementations. Swap adapters (seed → Supabase → Shopify) without touching routes or components.

---

## Performance Rules

- Run `pnpm analyze` to inspect bundle size before and after adding heavy dependencies.
- **Admin routes** must use `lazyRouteComponent` — never statically imported from storefront routes.
- Large editor panels (≥600 lines) must be behind a `React.lazy` + `Suspense` boundary.
- Storefront entry chunk must not import `src/features/admin/**` runtime code.
- Heavy vendors are code-split via `vite.config.ts` `manualChunks`. Chunks actually emitted by the client build (verified 2026-08-05): `admin-cms-remote`, `cms-core`, `app-runtime`, `admin-auth`, `storefront-account-client`, `vendor-gsap`, `vendor-lenis`, `vendor-three`, `vendor-pdfjs` (admin techpack parser only), `vendor-zod`, `vendor-fuse`, `vendor-react`, `vendor-sonner`. **`vendor-supabase` and `vendor-tanstack` are requested but never emitted** — Rolldown merges any chunk that is always loaded alongside its importer, so those rules are aspirational, not effective. Do not assume a `manualChunks` name exists just because the rule is there; check `dist/client/assets/`.
- **Any module reached via `await import(...)` must be pinned to a non-entry chunk.** If Rolldown merges it into the entry, it rewrites the dynamic import to target the entry chunk, whose namespace does NOT re-export that module's bindings — the destructure silently yields `undefined` and the call site throws at runtime. Dev is unaffected and tests stay green, so this only shows up in a built bundle. It has shipped **four** times (`@/shared/lib/gsap`, `@/app/config/runtime`, `adminAuth.ts`, `supabaseAccountClient`) plus the historical "n is not a function" save bug. `scripts/check-dynamic-import-entry.mjs` runs as part of `pnpm build` and fails on the signature.
- The landing page registry uses `lazy()` per page, so only the active page's chunk ships.
- Icons import from `@/shared/icons` with **named imports only** (`import { Menu } from '@/shared/icons'`), never `import *` and never straight from `@phosphor-icons/react` — the seam is what keeps the vendor swappable and the global duotone weight applied.
- Images from CMS: must have `width`, `height`, `loading="lazy"` (unless LCP), `decoding="async"`, `alt`.
- Animate `transform`/`opacity` only — never `width`, `height`, `top`, `left`.
- Scroll listeners must be `{ passive: true }`.
- Debounce text inputs driving expensive recomputes (≥250ms — shop search uses 350ms).
- `TanStackDevtools` and `ReactQueryDevtools` must be gated behind `import.meta.env.DEV`.
- Avoid forced layout reads (`getBoundingClientRect`, `offsetTop`) inside scroll/resize handlers — use `ResizeObserver` and cache.

---

## Responsive Design Rules

- **Mobile-first** — base styles are mobile. Use `sm:`, `md:`, `lg:`, `xl:` to enhance.
- Mobile must feel intentionally designed — not a shrunk desktop.
- Test all major breakpoints: 375px, 430px, 768px, 1024px, 1280px, 1440px, 1920px.
- Different layouts per breakpoint are encouraged when needed (e.g. different nav on mobile vs desktop).
- **Type scale:** `text-4xl sm:text-5xl md:text-6xl` for hero/page titles (never raw `text-6xl` on mobile).
- **Touch targets:** ≥44×44px for interactive elements. `h-11 w-11` minimum for icon buttons.
- **Inputs:** `text-base md:text-sm` to prevent iOS zoom-on-focus (16px minimum on touch).
- Sticky bottom bars: include `pb-[max(env(safe-area-inset-bottom),...)]` + page spacer.
- No horizontal scroll on any viewport.
- Grids: never 3+ columns at <360px viewport.
- **The Oath GSAP/WebGL cinematic:** **`≥1280px (xl)`** only. Mobile and tablet get static layout + light reveals.
- **Other GSAP:** gate at `≥768px` + no reduced motion unless page-specific contract says otherwise.
- Admin is desktop-first (≥1024px) but must degrade gracefully: sidebar becomes drawer, tables become cards below 1024px.
- Ultra-wide (≥1920px): content max-width constrained by `--anvl-content-max` / `--anvl-content-max-wide`.

---

## Accessibility Rules

- Semantic HTML: `<button>` for actions, `<a>` for navigation, never `<div onClick>`.
- Heading cascade in order — no skipping levels. Dialog titles use `<h2>`.
- Forms need labels (explicit `<label>` or `aria-label`).
- Every interactive element in the storefront chrome gets the `focus-ring` utility class.
- Dialogs and drawers: wire `useDialogFocusTrap`, initial focus inside, restore focus on close, Escape key support, `aria-modal="true"`, `aria-labelledby` pointing at the visible heading.
- Decorative icons: `aria-hidden="true"`.
- Status indicators must not rely on color alone — include text label or icon.
- Respect `prefers-reduced-motion` — all GSAP animations gate on it.
- Contrast ratio must meet WCAG AA for text and controls.
- Forms used in storefront must be `<form onSubmit>` even as placeholders.

---

## SEO Rules

- Per-route head metadata via `buildSeoMeta()` in `src/app/seo/meta.ts`.
- Organization JSON-LD on home route; Product + Breadcrumb JSON-LD on PDP.
- `JsonLd` component (`src/shared/components/seo/JsonLd.tsx`) escapes `<` → `<` for safe inline JSON.
- Open Graph tags via `MarketingToolsHead`.
- `public/robots.txt` and `public/sitemap.xml` provided.
- `VITE_CANONICAL_BASE_URL` used for absolute URL construction.
- Canonical URLs normalized to HTTPS.
- Do not hide all meaningful content in canvas/video-only experiences — keep text content crawlable.
- Product/drop pages need strong title, description, OG image.

---

## Code Quality Rules

- File size: soft limit 300 lines, hard limit 500 lines. Files >500 lines need a written reason.
- No magic numbers without a named constant or comment.
- No `console.log` in production code.
- No dead/unreachable code.
- No unused imports (TypeScript `noUnusedLocals` catches these).
- No vague TODO comments without context, severity, and owner.
- Functions should do one thing.
- Prefer readable code over clever code.
- Prefer explicit over magic.
- No `any` unless documented.
- No `as unknown as T` unless documented.

---

## Naming Conventions

| Pattern | Convention |
|---|---|
| React hooks | `useXxx` |
| Route file components | `XxxRoute` |
| Services (sync local CRUD) | `*.service.ts` |
| Raw localStorage I/O | `*.storage.ts` |
| DTO conversion | `*.mapper.ts` |
| Commerce aggregate reads | `*.commerce.ts` |
| Canonical Zod schemas | `*.schema.ts` |
| Storage-shaped Zod schemas | `*.persistence.zod.ts` |
| Zustand stores | `*.store.ts` |
| Test files | `__tests__/*.test.ts(x)` |
| Admin components | `Admin*.tsx` |
| Admin pages in route-adjacent files | `-adminXxx.tsx` (prefixed with `-`) |

Import aliases `@/` and `#/` both resolve to `src/`.

---

## What Not To Do

- Do not rewrite major features without discussing the plan first.
- Do not delete old CMS/drop-builder code until replacement is verified and all dependencies are mapped.
- Do not install packages without checking `package.json` first and explaining why the package is needed.
- Do not import `src/features/admin/**` runtime code in storefront or marketing code.
- Do not put secrets in `VITE_*` env vars.
- Do not use `any` without documentation.
- Do not call hooks conditionally.
- Do not animate `width`, `height`, `top`, `left` with GSAP or CSS — use transforms.
- Do not register GSAP plugins in component files — use `src/shared/lib/gsap.ts`.
- Do not call `new Lenis()` directly — use `useLenisScroll`.
- Do not use GSAP on mobile or under `prefers-reduced-motion`.
- Do not use `import *` from `@/shared/icons`, and do not import `@phosphor-icons/react` directly — always go through the seam.
- Do not reintroduce `lucide-react`; it was removed 2026-07-17 in favour of Phosphor.
- Do not edit `src/routeTree.gen.ts` directly.
- Do not make admin routes statically imported from storefront bundles.
- Do not skip `pnpm verify` before marking a task done.
- Do not skip documentation updates after code changes.
- Do not create generic, template-like design — every UI decision should reinforce ANVL's brand.
- Do not bypass Row Level Security on Supabase tables.

---

## How To Plan Features

1. Read `CLAUDE.md` (this file).
2. Read `AGENTS.md` for project rules.
3. Read `docs/audit-2026-05-17.md` for active finding IDs and phases.
4. Read the relevant feature doc in `docs/features/`.
5. Inspect affected source files before touching any code.
6. Identify the correct layer for new code (route / feature / shared).
7. Identify which interface/adapter is affected (CmsClient, CommerceClient, etc.).
8. Identify SSR boundary implications.
9. Write a short plan: what changes, which files, what tests are needed.
10. Implement in small, reversible steps.
11. Run `pnpm verify`.
12. Update documentation.

---

## How To Refactor Safely

Before any refactor:
1. Map all imports of the module being changed (grep for the file name).
2. Identify if it crosses a feature boundary that has rules (e.g. admin → storefront).
3. Identify SSR impact.
4. Make the change in isolation — do not refactor + add feature in one commit.
5. Run `pnpm verify` after each step.
6. Confirm no bundle size regression with `pnpm analyze` for significant changes.

For large/destructive changes (architecture, schema, routing, CMS system, major dependencies):
1. Explain current state.
2. Explain target state.
3. Explain why the change is needed.
4. List affected files.
5. List risks.
6. Provide safe migration plan.
7. **Get approval before proceeding.**

---

## Testing / Build / Lint Commands

```bash
pnpm test                       # Single run (Vitest)
pnpm test:watch                 # Watch mode
pnpm test:coverage              # Coverage report
pnpm test src/features/drops    # Single feature
pnpm typecheck                  # TypeScript check (no ESLint — typecheck is the gate)
pnpm build                      # Production build
pnpm verify                     # All three: typecheck + test + build
pnpm analyze                    # Bundle visualization
```

Test layout:
- Co-locate with source: `src/features/X/__tests__/file.test.ts(x)`
- Integration tests: `src/test/integration/*.test.tsx`
- Setup file: `src/test/setup.ts` (mocks `matchMedia`, `IntersectionObserver`, `ResizeObserver`, resets `localStorage`)
- Use `@/` alias in test imports.
- Do not import animation libs in tests — they are mocked in setup.
- Do not test CSS class names — test behavior.
- Do not snapshot large DOM trees.

---

## Documentation Maintenance Rules

**This is enforced, not just requested.** `scripts/check-docs-freshness.mjs` maps changed files onto the docs that must move with them, and runs from two places:

- `.githooks/pre-commit` — **advisory** for human commits: prints exactly which doc is owed and why, then lets the commit through. Enable once per clone with `pnpm hooks:install` (sets `core.hooksPath`).
- `.claude/settings.json` → a `PreToolUse` hook on Bash (`scripts/claude-doc-gate.mjs`) — **blocking** for Claude: a `git commit` is refused with exit 2 until the owed docs are updated. The gate inspects the actual command, so only real commits are affected.

Both honour `ANVL_SKIP_DOC_CHECK=1` for the rare change that genuinely needs no doc update. Run `pnpm docs:check` any time to see what the current working tree owes.

The script also carries a **stale-claim lint** (`BANNED_DOC_TERMS`): docs may not assert a removed dependency as current. Lines that explicitly mark something historical ("was removed", "no longer", "do not reintroduce") are exempt, so you can still write about the past. When you remove a dependency, add it to that list — that is what stops the next `lucide-react`-style claim from surviving for months.

Every code change must check whether documentation needs updating. After any:
- Folder structure change → update `docs/project-map.md` + folder structure in `CLAUDE.md`
- New command → update "Important Commands" in `CLAUDE.md`
- Dependency add/remove → update "Current Stack" in `CLAUDE.md` + relevant doc
- Supabase schema change → update `docs/backend-guidelines.md` + `docs/cms-architecture.md`
- Landing page / act system change → update `docs/cms-architecture.md`
- Animation system change → update `docs/animation-guidelines.md`
- Significant architectural decision → update `docs/frontend-architecture.md`
- Deployment / hosting / Cloudflare / `wrangler` / build-target change → update `docs/deployment.md` + Stack table & Commands in `CLAUDE.md`
- Task completion → update `docs/audit-2026-05-17.md` + append to `docs/changelog.md`
- Dependency **removal** → also add the package name to `BANNED_DOC_TERMS` in `scripts/check-docs-freshness.mjs`, so docs cannot keep claiming it
- Admin route added/removed → the route table in `CLAUDE.md` **and** the surface tables in `docs/cms-architecture.md` + `docs/project-map.md`

---

## Known Technical Debt

| ID | Area | Description |
|---|---|---|
| SEC-01/02/03 | Admin auth | **Resolved 2026-07-04.** Static env-file password gate removed — Supabase is the only admin auth path. |
| SEC-11 | Admin auth | **Resolved 2026-07-04.** `/admin/*` access is now server-validated via TanStack Start `createServerFn` (`src/features/admin/auth/adminAuth.ts`) + a sealed HttpOnly session cookie (`adminAuthSession.server.ts`, `useSession`/`getSession` from `@tanstack/react-start/server`), checked in `beforeLoad` (`src/routes/admin/route.tsx`) on SSR and every client navigation. Cookie holds the Supabase refresh token; every validation call refreshes + re-verifies `cms_profiles.role = admin` + rotates the cookie. Remember Me controls cookie `Max-Age` (30 days persistent vs. session-only). The browser Supabase client (`adminSupabaseBrowserClient.ts`, CMS reads only) has `autoRefreshToken: false` — the server is the sole refresh-token rotator to avoid a dual-rotation race. Not covered: CSRF tokens, CSP/HSTS, rate limiting (still Phase J). |
| PERF-01 | Admin routes | All admin routes must use `lazyRouteComponent`. |
| PERF-11 | Bundle size | Dependency cleanup: removed unused `@tanstack/react-table` + `@radix-ui/react-dropdown-menu` (2026-06-11), `@fontsource/bebas-neue`, `@fontsource/manrope`, `@tanstack/react-query-devtools`, `@tailwindcss/typography` (2026-06-20), and `react-colorful` (with the orphaned shared `ColorField`) + `react-day-picker` (with the orphaned `AdminDateTimeField`) (2026-06-27). `framer-motion` was also removed once `RevealOnScroll` was rewritten on IntersectionObserver + CSS. `@tanstack/react-virtual` (admin media grid) and the active fonts (Anton/Sora/Cinzel) remain in use. A full dependency sweep on 2026-07-29 found **no unused packages** left in either `dependencies` or `devDependencies`. |
| MAINT-01 | Large files | Admin editor files over the 500-line hard limit (refactor backlog, measured 2026-07-29): `about/sections/AboutOrbsFields.tsx` 713 · `setup/wizards/GamificationSetupWizard.tsx` 712 · `setup/wizards/StorySetupWizard.tsx` 582 · `banner/BannerCustomizeModal.tsx` 571 · `preview/AdminPreviewPanel.tsx` 566 · `media/MediaAssetGrid.tsx` 561 · `setup/wizards/AboutSetupWizard.tsx` 522. |
| MAINT-02 | Feature boundary | **Narrowed to exactly one file (2026-07-29 sweep).** `src/features/cms/api/cmsPersistenceMode.ts:1` imports `type CmsProfileRole` from `@/features/admin/auth/adminCmsProfileRole`. Nothing else in `cms/`, `products/`, `passport/`, `cart/`, `checkout/`, `shopify/`, `storefront-account/`, `analytics/`, `seo/`, `shared/`, or the non-admin routes violates the boundary. That file is currently only consumed by admin code so it does not reach the storefront bundle, but the import still breaks the rule — move the type into `cms/**`. |
| MAINT-03 | localStorage reset | **Resolved.** `resetAllLocalCmsKeys()` clears every key in the `ADMIN_STORAGE_KEYS` registry (incl. `anvl.landingContent.v1` and the sidebar preference) |
| MIG-01 | Supabase migrations | **CLOSED 2026-08-05.** The folder now matches the applied history exactly: **76 files ↔ 76 applied rows**, zero gaps either way, identical order, zero name mismatches. Three separate problems existed; all three are fixed. **(a)** 8 applied migrations had no file — backfilled verbatim, including the two security-hardening ones. **(b)** 48 files carried synthetic `…120000` versions that were never applied — renamed with `git mv` to their real applied versions, so `supabase db push` against production is now a no-op and a fresh rebuild replays them in the order production was *actually* built in (the old disk order was fiction). This also corrected one name typo: disk `anvl_drops_client_id_admin_rls` vs applied `anvl_drops_client_drop_id_admin_rls`, content confirmed identical first. **(c)** 8 files had no history row at all; their effects were verified present in production (`model/gltf-binary` in the `cms-media` bucket, `asset_config.pages` as an object, zero theme columns on `landing_pages`, array-shaped tenets), then registered with a `migration repair`-equivalent metadata insert — no schema touched, reversible by deleting those 8 versions. That mattered beyond tidiness: 4 are drop-builder era and target `anvl_drops` and friends, which the teardown removed, so a `db push` would have tried to re-apply DDL against tables that no longer exist and **errored**. `fix_publish_drop_body_column` was applied twice 19 s apart; the second version carries a documented no-op file. |
| Phase I | Router repatch | `scripts/repatch-admin-route-tree.mjs` is a workaround for TanStack Start upstream limitation. |
| Phase J | Production launch | Admin real server auth + HttpOnly sessions done (see SEC-11). **Hosting live: Worker `anvl` created 2026-07-11 and last deployed 2026-07-28 (verified against the Cloudflare account 2026-07-29) — see `docs/deployment.md`.** Remaining: DNS cutover to the custom domain, flip CSP to enforcing (currently report-only, WASM/blob allowances added — note `script-src` still carries `'unsafe-inline'`, so flipping it buys little until the three inline sinks in `__root.tsx`/`JsonLd` move to a nonce), upload validation. **Rate limiting landed 2026-08-04** for admin login + `/api/csp-report` via Cloudflare `ratelimits` bindings (`wrangler.jsonc` + `src/rateLimit.server.ts`); it activates on the next deploy and fails open until then. Other anon surfaces (`coming_soon_subscribers` insert, passport claim, review submit) are still unthrottled. CSRF double-submit cookie is in place (`src/start.ts`). From the 2026-07-29 DB audit: `touch_row_updated_at()`'s mutable `search_path` and the 4 unindexed FKs (`armory_feats.user_id`, `passport_transfers.from_user`/`to_user`, `techpacks.created_by`) were **fixed 2026-08-04** (migration `20260804172317`, which also added `product_reviews (product_slug, created_at DESC)` and corrected `get_product_reviews`' LIMIT-before-ORDER-BY). The 31 remaining bare `auth.uid()` RLS calls were **fixed 2026-08-05** (`20260805045202_perf22…` — every `auth_rls_initplan` warning cleared), as was `accept_passport_transfer`'s missing Armory reset (`20260804174508`). Still open: leaked-password protection is off (dashboard toggle). |

---

## Next Recommended Steps

See `docs/next-steps.md` for the full prioritized task list.

Top priorities:
1. **Phase J (production blockers):** admin server auth (SEC-11) and CSRF are done — remaining: flip CSP from report-only to enforcing, rate limiting, upload validation, DNS cutover.
2. ~~**MIG-01 migration renumber**~~ — **done 2026-08-05.** `supabase/migrations/` now reproduces production, so a staging/dev rebuild is finally safe.
3. **Phase D (feature boundary cleanup):** move shared types/helpers out of `admin/**` into `cms/**`/`shared/**` (MAINT-02).
4. **Shopify commerce wiring:** connect `VITE_SHOPIFY_*` vars if eCommerce checkout is needed now.
5. **Product page polish:** real product images, size guides, add-to-cart flow end-to-end.

> Supabase storage was previously listed here as unwired. It is not: `cms-media` has been live since 2026-05-18 and already holds real assets. Removed 2026-07-29.
