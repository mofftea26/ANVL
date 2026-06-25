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
| Motion (lightweight) | Framer Motion |
| 3D / WebGL | three.js + `@react-three/fiber` v9 + `@react-three/drei` v10 — The Oath landing emblem/dust + Story chapter book, lazy `vendor-three` chunk (desktop + no-reduced-motion only) |
| Smooth scroll | Lenis |
| Icons | lucide-react (named imports only) |
| Toasts | sonner |
| Build | Vite v8 |
| Test | Vitest v4 + @testing-library/react v16 + jsdom |
| Package manager | pnpm (pinned) |
| Backend / DB | Supabase (auth, postgres, storage, edge functions) |
| Commerce (optional) | Shopify Storefront API (when `VITE_SHOPIFY_*` are set) |
| UI primitives | Custom (`src/shared/components/ui/`) — **not shadcn/ui** |
| CSS utility helpers | clsx + tailwind-merge (`src/shared/lib/cn.ts`) |
| Schema validation | Zod (all external/CMS data) |

> **Note:** shadcn/ui is **not installed**. The project has its own branded UI component system under `src/shared/components/ui/`. Do not install shadcn/ui without explicit approval.

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
- `CmsClient`, `CommerceClient`, `SeoClient`, `SiteSettingsClient`, `AnalyticsClient`, `PaymentClient`, `AccountClient`

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
src/features/landingPages/**   → code-owned landing pages (registry, renderer, asset slots, TheOathLanding, TheoathModern)
src/features/marketing/**      → storefront home sections (home/: campaign cards, lookbook strip)
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
    admin/           Slim CMS — dashboard (active drop), theme, fonts, assets, landing content, story, settings (+ auth). Wide-screen workspace shell (AdminLayout/AdminWorkspace/AdminRailPanel)
    analytics/       Analytics client mock + hooks
    cart/            Zustand cart store + hooks
    checkout/        Forms, schemas, payment config + mock adapters
    cms/             Storefront-safe CMS reads: theme/font/asset config (cmsSiteConfig), landing content envelope, publication readers, navigation + layout defaults
    experience/      Centralized experience system: registry (keyed 1:1 to active landing key), ExperienceProvider/useExperience, useExperienceVariant (structural variant seam), data-experience storefront wrapper, ExperiencePageTransition
    landingPages/    Code-owned landing pages: registry, renderer, asset slots, pages/TheOathLanding + pages/TheoathModern (the dark technical product-laboratory experience: GSAP timeline + procedural Three.js TechForgeScene + CMS content)
    marketing/       Storefront home sections (home/: campaign cards, lookbook strip)
    products/        Commerce adapters (localStorage, seed, Shopify, Supabase), catalog, hooks
    seo/             SEO document schema + types
    shopify/         Shopify Storefront API client + mappers
    story/           Story saga: schemas, seed, asset resolver, page components + book overlay, Supabase/seed clients
    storefront-account/ Public account UI stubs
  routes/
    __root.tsx       Root layout loader — fetches storefront projection from Supabase or runtime clients
    index.tsx        Home page — renders the active code-owned landing page (default: the-oath)
    shop/            Shop listing + PDP
    cart.tsx
    checkout/
    account/         Customer account (stub)
    story.tsx        Story saga page (chapter shelf + deep-linkable book overlay)
    auth/            Sign in / sign up / forgot password
    admin/           Slim CMS admin routes: dashboard (index), theme, fonts, assets, content, story, settings, login
  shared/
    api/contracts/   Typed DTOs for future REST/BFF (scaffolding — not yet wired)
    assets/brand/    Inline SVG logo components (AnvlWordmark, AnvlCrest, etc.)
    components/
      brand/         AnvlLogoImage, DropEmblemDecor
      layout/        PremiumNav (+ mobile/topbar), AnnouncementRail, SiteFooter, ContentPage, GrainOverlay
      motion/        RevealOnScroll
      premium/       SectionShell, PageHero, ContentPanel, SectionEyebrow, ForgeAtmosphere, WarBanner
      seo/           JsonLd, MarketingToolsHead, structuredData
      ui/            Button, Input, Modal, Drawer, Select, Skeleton, SafeLink, ColorField, MediaPickerField, etc.
    constants/       brand.ts, brandLogos.ts
    hooks/           useDialogFocusTrap, useLenisScroll, useLockPageScroll, useReducedMotion
    lib/             cn.ts, gsap.ts, url.ts, stripAngleBracketTags.ts, color.ts, storage/
    schemas/         media, money, navigation (shared Zod scaffolding)
  styles.css         Global tokens, themes, scrollbars, reduced-motion rules
  router.tsx         TanStack Router setup
  routeTree.gen.ts   AUTO-GENERATED — never edit directly
supabase/
  migrations/        Ordered SQL migration files
  functions/         Edge Functions (shopify-webhook, medusa-webhook-stub)
scripts/
  repatch-admin-route-tree.mjs  Patches routeTree.gen.ts for admin segment (runs before dev/build/typecheck)
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
pnpm build                      # Production build
pnpm verify                     # typecheck + test + build (definition of done gate)
pnpm analyze                    # Bundle treemap → dist/stats.html (ANVL_ANALYZE=1)
```

> No ESLint is configured. `pnpm typecheck` is the static analysis gate.

---

## Environment Variables Rules

- `VITE_*` vars are **inlined into the client bundle** by Vite. Only public, non-secret config may use this prefix.
- **Never** put secrets, service role keys, admin tokens, or private API keys into `VITE_*` vars.
- Allowed `VITE_*` vars (public, safe in browser):
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase project URL + anon/publishable key
  - `VITE_SHOPIFY_STORE_DOMAIN`, `VITE_SHOPIFY_STOREFRONT_API_VERSION`, `VITE_SHOPIFY_STOREFRONT_PUBLIC_TOKEN`
  - `VITE_CANONICAL_BASE_URL`, `VITE_ADMIN_PREVIEW_ENABLED`, `VITE_ANVL_INTERNATIONAL_CHECKOUT`
- Server-only / Edge (never `VITE_*`): `SUPABASE_SERVICE_ROLE_KEY`, `SHOPIFY_ADMIN_API_ACCESS_TOKEN`, `SHOPIFY_API_SECRET_KEY`
- `.env.example` must have placeholder values only — never real credentials.
- Env vars are validated by Zod in `src/app/config/publicEnv.ts` before use.

---

## Supabase Rules

### Schema (key tables)

| Table | Purpose | RLS |
|---|---|---|
| `public.cms_profiles` | Links `auth.users` to CMS role (`viewer\|editor\|admin`) | Read own row |
| `public.cms_settings` | Singleton: active drop key, theme, fonts, asset slot map, landing content blobs | Public read, editor update |
| `public.landing_pages` | Picker metadata (keys must match code registry) | Public read available rows |
| `public.storefront_publication` | Anon-readable mirror: theme, fonts, assets, media_index, active key | Public read, editor update |
| `public.cms_media_assets` | Media library + asset assignments | CMS roles only |
| `public.story_chapters` | Story saga chapters (one per drop) | Public read published; editor write |
| `public.story_acts` | Ordered story beats within a chapter | Public read (parent published); editor write |
| `public.story_cast` | CMS-authored characters (army roster) | Public read (parent published); editor write |

### Rules

- **Row Level Security is always on.** Never disable RLS on a table.
- Only users with `cms_profiles.role = 'admin'` may access `/admin` UI (editors/viewers rejected at login). DB RLS allows `editor`/`admin` CMS writes.
- `storefront_publication` is the **primary** Supabase read for storefront SSR (anon-safe). `cms_settings` is the editor source of truth.
- Admin Supabase client uses browser storage key `anvl.supabase.admin.v1`.
- `SUPABASE_SERVICE_ROLE_KEY` is **never** bundled in client code. It is for migrations and privileged server scripts only.
- All CMS JSON writes must pass Zod validation (`cmsSiteConfig.zod.ts`) before Supabase upsert.
- Before any schema change: document current schema → target schema → migration steps → risks → rollback plan.
- Published storefront state flows: admin edits local working copy → `adminCmsRemoteSync` → `cms_settings` + `storefront_publication` mirror.

### Edge Functions (in repo)

- `shopify-webhook` — Ack-only webhook receiver (no DB writes)
- `medusa-webhook-stub` — Placeholder for future Medusa sync

> Publish/scheduled-drop Edge Functions were removed. Admin sync writes directly via `adminCmsRemoteSync`. See MIG-01 in `docs/technical-debt.md` for orphaned RPC migrations.

---

## CMS Rules

### Architecture

The CMS is split into two surfaces:
1. **Admin CMS** (`src/features/admin/`) — Six editors: active drop (dashboard), theme & colors, fonts, assets, landing content, story (+ settings). Every page renders inside the wide-screen **workspace shell** (`AdminLayout layout="workspace"` → `AdminWorkspace` = primary editing column + sticky contextual `AdminRailPanel` rail; collapses to one column below `xl`).
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
| `/admin/content` | Landing content editor — per-scene copy overrides with code-default fallbacks |
| `/admin/story` | Story saga editor — chapters, acts, cast (relational; Supabase CRUD) |
| `/admin/settings` | Session + local reset |

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

---

## Styling Rules

- **Tailwind CSS v4** — utility-first, no config file; configured via `@theme` in `src/styles.css`.
- **CSS variable tokens** — all color, spacing, and animation tokens are defined as CSS custom properties in `src/styles.css`. Use them instead of hardcoded values.
- **One normalized theme palette (single source of truth).** The CMS theme editor exposes exactly **15 editable tokens** — `background`, `foreground`, `card`, `cardForeground`, `muted`, `mutedForeground`, `border`, `primary`, `primaryForeground`, `accent`, `accentForeground`, `ring`, `destructive`, `success`, `warning` — defined by `themePaletteSchema` (`THEME_PALETTE_KEYS`) in `src/features/cms/config/cmsSiteConfig.zod.ts`. `themeConfigToCssVars` deterministically derives **all** `--color-*` / `--hero-*` / `--particle-*` / `--scrollbar-*` / brand-alias vars from those 15 tokens, and is the single map feeding SSR first-paint inline CSS, `SiteThemeProvider`, and the editor preview. The storefront, brand graphics, and the WebGL landing emblem/dust all read the **same** vars (`readOathBrandColors()`), so CMS + storefront + WebGL cannot diverge. There is **no per-landing-page palette override**. Legacy palette keys are migrated on read.
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
- **Three animation systems:**
  - **GSAP** — cinematic desktop sequences (hero pinning, scroll reveals, timelines)
  - **Framer Motion** — lightweight browser animations (page transitions, UI micro-interactions)
  - **CSS transitions** — for simple hover states and focus rings
- Keep animation logic in dedicated hooks/utilities, not scattered in component render bodies.
- `useReducedMotion()` hook (`src/shared/hooks/useReducedMotion.ts`) — use before creating expensive animations.
- Reference cinematic implementation: `TheOathLanding` — timeline in `hooks/useTheOathScrollTimeline.ts` composing the per-scene `motion/buildOath*.ts` builders, with a DOM⇄WebGL motion bridge (`motion/oathMotionState.ts`).

---

## GSAP Rules

- All GSAP plugins are registered **once** in `src/shared/lib/gsap.ts`. Import from there, never from `gsap` directly in components.
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
`Button, Input, Modal, Drawer, Select, Skeleton, SafeLink, FormField, IconButton, Badge, Checkbox, ColorSwatch, QuantityStepper, SizeSelector, ProductCard, ProductGallery, EmptyState, AccordionDisclosure, Textarea, Container, Section`

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
- Product data from Shopify is mapped to internal `Product` type via `shopifyProductToStorefront.ts`.
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
- GSAP, Lenis, Framer Motion, and three.js/@react-three are code-split into `vendor-gsap`, `vendor-lenis`, `vendor-framer-motion`, and `vendor-three` chunks (see `vite.config.ts` `manualChunks`).
- The landing page registry uses `lazy()` per page, so only the active page's chunk ships.
- `lucide-react` must use named imports only (`import { Menu } from 'lucide-react'`), never `import *`.
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
- Do not use `import *` from `lucide-react`.
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

Every code change must check whether documentation needs updating. After any:
- Folder structure change → update `docs/project-map.md` + folder structure in `CLAUDE.md`
- New command → update "Important Commands" in `CLAUDE.md`
- Dependency add/remove → update "Current Stack" in `CLAUDE.md` + relevant doc
- Supabase schema change → update `docs/backend-guidelines.md` + `docs/cms-architecture.md`
- Landing page / act system change → update `docs/cms-architecture.md`
- Animation system change → update `docs/animation-guidelines.md`
- Significant architectural decision → update `docs/frontend-architecture.md`
- Task completion → update `docs/audit-2026-05-17.md` + append to `docs/changelog.md`

---

## Known Technical Debt

| ID | Area | Description |
|---|---|---|
| SEC-01/02/03 | Admin auth | Temporary static env-file gate. Not production-grade. Hosted-demo blocker. |
| SEC-11 | Admin auth | Supabase auth replaces static gate when env is set, but session handling still needs HttpOnly cookies + server validation for production. |
| PERF-01 | Admin routes | All admin routes must use `lazyRouteComponent`. |
| PERF-11 | Bundle size | Dependency cleanup: removed unused `@tanstack/react-table` + `@radix-ui/react-dropdown-menu` (2026-06-11) and `@fontsource/bebas-neue`, `@fontsource/manrope`, `@tanstack/react-query-devtools`, `@tailwindcss/typography` (2026-06-20). `@tanstack/react-virtual` (admin media grid), `framer-motion` (RevealOnScroll), and the active fonts (Anton/Sora/Cinzel) remain in use. |
| MAINT-01 | Large files | Several admin editor files exceed 500 lines (tracked refactor candidates). |
| MAINT-02 | Feature boundary | Storefront-safe code imports from `admin/**` (media URL, types) — extract to `cms/**` |
| MAINT-03 | localStorage reset | `resetAllLocalCmsKeys()` omits `anvl.landingContent.v1` |
| MIG-01 | Supabase migrations | Orphaned publish RPC migrations post drop-builder teardown |
| Phase I | Router repatch | `scripts/repatch-admin-route-tree.mjs` is a workaround for TanStack Start upstream limitation. |
| Phase J | Production launch | Real server auth, HttpOnly sessions, CSP/HSTS, rate limits, upload validation, CSRF — all required before public launch. |

---

## Next Recommended Steps

See `docs/next-steps.md` for the full prioritized task list.

Top priorities:
1. **Phase J (production blockers):** real server auth, CSP, rate limiting, CSRF — required before public launch.
2. **Phase D (feature boundary cleanup):** move shared types/helpers out of `admin/**` into `cms/**`/`shared/**` (MAINT-02).
3. **Shopify commerce wiring:** connect `VITE_SHOPIFY_*` vars if eCommerce checkout is needed now.
4. **Supabase storage:** wire media library to a real Supabase storage bucket.
5. **Product page polish:** real product images, size guides, add-to-cart flow end-to-end.
