# Architecture

## Target architecture

The website is split into three layers:

1. **Storefront/UI layer** — React components, routes, layouts, pages, animation components, forms.

2. **Domain/application layer** — Feature hooks, query hooks, mappers, schemas, services, Zustand stores.

3. **Data/runtime layer** — `createRuntimeClients({ isServer })` wires:
   - `runtimeClients.cms` — CMS projection reads
   - `runtimeClients.commerce` — Shopify or seed/localStorage products
   - `runtimeClients.seo` — per-route SEO (mostly code defaults)
   - `runtimeClients.siteSettings` — nav/layout defaults
   - `runtimeClients.story` — story saga chapters/acts/cast
   - `runtimeClients.analytics`, `payment`, `account`

When **`VITE_SUPABASE_*`** is set, SSR reads `storefront_publication` via `loadStorefrontProjection()`. Admin edits localStorage → `adminCmsRemoteSync` → `cms_settings` + publication mirror. Without Supabase, seed (SSR) and localStorage (browser) adapters apply.

## Current folder structure

```txt
src/
  app/
    config/          clients.ts, runtime.ts, publicEnv.ts
    providers/       AppProviders, SiteThemeProvider, RouteAnalytics
    seo/             buildSeoMeta
  routes/
    __root.tsx       SSR projection loader, theme inline CSS
    index.tsx        Home → LandingPageRenderer (code-owned landing)
    shop/, cart, checkout/, story.tsx
    auth/, account/
    admin/           Lazy -admin*.tsx sidecars (7 surfaces + login)
  features/
    admin/           CMS editors + Supabase sync (never imported by storefront)
    cms/             Storefront-safe reads, theme/font/asset/landingContent config
    landingPages/    Registry + TheOathLanding (single active page: the-oath)
    story/           Story saga schemas, clients, 3D book overlay
    products/        Commerce adapters (Shopify, seed, localStorage)
    cart/, checkout/, shopify/, analytics/
    marketing/       Orphaned home sections (not on home route)
  shared/            UI primitives, hooks, lib — no feature imports
  content/seed/      Seed data for SSR fallbacks
supabase/
  migrations/        Ordered SQL (see docs/project-map.md)
  functions/         shopify-webhook, medusa-webhook-stub
```

## CMS vs admin boundary

Storefront and `features/cms/**` must **never** import `features/admin/**` at runtime.

- **Admin** (`features/admin/**`) — editors, Supabase sync, media upload, story CRUD UI
- **CMS reads** (`features/cms/**`) — projection, theme, fonts, assets, landing content envelope
- **Landing pages** (`features/landingPages/**`) — code-owned React pages; CMS only picks key, slots, copy

Nav, footer, and SEO use **code defaults** — not CMS-editable.

> **MAINT-02:** A few storefront-safe modules still import types/helpers from `admin/**` (media URL, profile role type). Extract to `cms/**` or `shared/**` when touched.

## State rules

- **TanStack Query:** products, storefront publication, story chapters, account (when wired)
- **Zustand:** cart, modals, drawers, admin UI state
- **localStorage (admin):** CMS working copies (`anvl.themeConfig.v1`, etc.) synced to Supabase when configured
- **URL search params:** shop filters

## SSR rules

- Route loaders fetch `loadStorefrontProjection()` + commerce data where SEO matters
- Client-only animation (GSAP, Lenis, three.js) gated by viewport + reduced motion
- localStorage CMS adapters must not run during SSR — seed fallbacks on server

## API interface first

Contracts: `src/app/config/clients.ts`. Wiring: `src/app/config/runtime.ts`.

Future HTTP/BFF DTOs: `src/shared/api/contracts/` (see `docs/contracts/README.md`).

## Canonical types (Zod)

- Landing content: `src/features/landingPages/pages/TheOathLanding/content/oathContent.schema.ts`
- CMS site config: `src/features/cms/config/cmsSiteConfig.zod.ts` (15-token theme palette)
- Products: `src/features/products/schemas/product.schema.ts`
- Story: `src/features/story/schemas/story.schema.ts`
- Shared: `src/shared/schemas/*.schema.ts`

## Migration path

1. Local seed/localStorage adapters (current without Supabase)
2. Supabase publication mirror + admin sync (current with `VITE_SUPABASE_*`)
3. Shopify Storefront API for commerce (optional `VITE_SHOPIFY_*`)
4. Future: Medusa or custom backend for orders/inventory

## Removed (historical)

- Drop-builder CMS (`anvl_drops`, acts, publish RPC)
- `src/features/drops/`, act-presets, `/drop/*` routes
- CMS products editor, website layout editor, SEO CMS

See `docs/features/drops-cms.md` and `docs/cms-teardown-plan.md` for historical context.
