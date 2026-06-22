# ANVL Athletics Storefront

Production-ready SSR storefront for **ANVL Athletics** built with TanStack Start, TypeScript, and a feature-based architecture.

Project rules for agents live in [`AGENTS.md`](./AGENTS.md). The full documentation index is [`docs/README.md`](./docs/README.md) (architecture, feature specs, and the `docs/prompts` task library).

Brand context implemented from `/docs/ANVL_Athletics_Professional_Brand_Document.pdf`:
- Brand: ANVL Athletics
- Tagline: Forged Under Pressure
- Drop: Drop 01 - The Oath
- Tone: premium, disciplined, dark industrial

## Tech Stack

- TanStack Start + TanStack Router (file-based routes)
- TypeScript strict mode
- TanStack Query (server state)
- Zustand (cart/UI state only)
- React Hook Form + Zod
- Tailwind CSS v4 + CSS variable tokens
- class-variance-authority + clsx + tailwind-merge
- Framer Motion
- Lenis (smooth scroll hook)
- lucide-react
- sonner
- `@tanstack/react-virtual` (admin media grid)
- Vitest + Testing Library

## Run Locally

Use [pnpm](https://pnpm.io/) (version is pinned via the `packageManager` field in `package.json`; Node’s Corepack can install it—run `corepack enable` once if needed).

```bash
pnpm install
pnpm dev
```

Production build and checks:

```bash
pnpm verify   # typecheck + test + build
```

## Route Map

**Storefront**
- `/` — code-owned landing page (default: The Oath)
- `/shop`, `/shop/$slug`
- `/story` — story saga (chapter shelf + book overlay)
- `/cart`, `/checkout`, `/checkout/success`
- `/about`, `/size-guide`, `/care-guide`, `/contact`, `/privacy`, `/terms`, `/returns`
- `/auth/sign-in`, `/auth/sign-up`, `/auth/forgot-password`
- `/account`, `/account/personal`, `/account/addresses`, `/account/orders`

**Admin** (lazy-loaded; Supabase auth or legacy env gate)
- `/admin` — dashboard (active landing picker)
- `/admin/theme`, `/admin/fonts`, `/admin/assets`, `/admin/content`, `/admin/story`, `/admin/settings`
- `/admin/login`

- `/admin-preview` (guarded by env flag)

## Architecture

Primary structure:

```txt
src/
  app/
    config/
    providers/
    seo/
  shared/
    assets/brand/
    components/
      layout/
      motion/
      seo/
      ui/
    constants/
    hooks/
    lib/
  features/
    admin/           Slim CMS editors + Supabase sync
    cms/             Storefront-safe CMS reads
    landingPages/    Code-owned landings (The Oath)
    story/           Story saga
    cart/
    checkout/
    products/
    shopify/
  routes/
```

### Client Abstractions (Dependency Inversion)

Interface contracts are centralized in:
- `src/app/config/clients.ts`

Runtime wiring uses `createRuntimeClients({ isServer })` in:
- `src/app/config/runtime.ts`

Storefront data adapters:
- **With Supabase:** `loadStorefrontProjection()` reads `storefront_publication`; commerce via Shopify or seed.
- **Without Supabase:** seed (SSR) + localStorage (browser) CMS adapters.

Still mocked (until productized):
- `mockAnalyticsClient` -> `src/features/analytics/api/analyticsClient.mock.ts`
- `mockPaymentClient` -> `src/features/checkout/api/paymentGateway.mock.ts`

This keeps UI and routes independent from backend details.

## Theming and Brand Tokens

Global tokens live in:
- `src/styles.css`

Implemented themes:
- `oath-dark` (default)
- `bone-light` (future editorial/lookbook mode)

Core ANVL palette is modeled as CSS variables and reusable constants:
- `src/shared/constants/brand.ts`

## Logo / Brand Assets

Themeable inline SVG components (driven by `currentColor`):
- `src/shared/assets/brand/AnvlWordmark.tsx`
- `src/shared/assets/brand/AnvlFullLockup.tsx`
- `src/shared/assets/brand/AnvlCrest.tsx`
- `src/shared/assets/brand/AnvlCompactMark.tsx`
- `src/shared/assets/brand/AnvlOathShape.tsx`

Public asset path for raster + downloadable exports:
- `public/brand/`

Designer SVG/PNG exports in `public/brand/`:
- Marks: `mark.svg`, `mark-light.png`, `mark-dark.png`, `favicon.png`
- Wordmarks: `wordmark.svg`, `wordmark-athletics.svg`, `logo-wordmark-light.png`, `logo-wordmark-dark.png`
- Stacked lockup: `stacked.svg`, `logo-stacked-light.png`, `logo-stacked-dark.png`
- Drop graphic: `the-oath-shape.svg`
- Open Graph + placeholder: `og-default.svg`, `placeholder-product.svg`

## SEO

- Per-route head metadata via `buildSeoMeta()` in `src/app/seo/meta.ts`
- Organization JSON-LD on home route
- Product + breadcrumb JSON-LD on product detail route
- `public/robots.txt` and `public/sitemap.xml` provided

## Cart + Checkout

- Cart state (with persistence) in:
  - `src/features/cart/store/cart.store.ts`
  - `src/features/cart/hooks/useCart.ts`
- Checkout forms and Zod schemas in:
  - `src/features/checkout/hooks/useCheckoutForm.ts`
  - `src/features/checkout/schemas/checkout.schema.ts`
- Region + payment catalog (Lebanon COD/Whish; international card behind env flag):
  - `src/features/checkout/config/checkoutPayments.config.ts`
- **Env:** set `VITE_ANVL_INTERNATIONAL_CHECKOUT=true` in `.env` or CI to enable non-Lebanon card (mock) checkout for development.

### Payment Adapter Architecture

Gateway adapter types:
- `src/features/checkout/api/paymentGateway.types.ts`

Mock adapters:
- `cashOnDelivery`
- `whishMoney`
- `card` (international / PSP placeholder)

Implementation:
- `src/features/checkout/api/paymentGateway.mock.ts`

UI reads payment options from `checkoutPayments.config.ts`, not scattered literals.

## Analytics

Analytics client abstraction:
- `trackPageView`
- `trackProductView`
- `trackAddToCart`
- `trackBeginCheckout`
- `trackOrderPlaced`
- `trackWaitlistSignup`

Hooks:
- `useTrackPageView`
- `useProductAnalytics`
- `useCartAnalytics`

Replace mock console analytics with PostHog/Plausible/custom backend by swapping runtime client.

## CMS (slim admin)

Seven editor surfaces + settings. Landing pages are **code-owned** (`src/features/landingPages/`); CMS picks active key, theme (global 15-token palette), fonts, asset slots, and per-scene copy (`landing_content`).

With **`VITE_SUPABASE_*`:** admin syncs to `cms_settings` + `storefront_publication`. Story saga uses relational `story_*` tables.

See `docs/cms-architecture.md` and `docs/landing-pages.md`.

## Medusa / Backend Integration Plan

1. Replace seed/local `CommerceClient` implementations with Medusa-powered adapters.
2. Replace seed/local `CmsClient` / `SeoClient` / `SiteSettingsClient` with Medusa custom module, Payload, or dedicated ANVL CMS APIs.
3. Replace `mockPaymentClient` adapters with real provider SDK/server endpoints.
4. Keep route/component code unchanged by preserving interface contracts.
5. Move price/inventory/order logic server-side and secure with server functions/APIs.

## Environment Variables (for future production wiring)

Not all are required in mock mode, but planned:

```env
VITE_CANONICAL_BASE_URL=https://www.anvlathletics.com
VITE_ADMIN_PREVIEW_ENABLED=false
MEDUSA_BACKEND_URL=
MEDUSA_PUBLISHABLE_KEY=
POSTHOG_KEY=
PLAUSIBLE_DOMAIN=
TAP_SECRET_KEY=
NETCOMMERCE_API_KEY=
```

## Notes

- The route `/admin-preview` is intentionally gated with `VITE_ADMIN_PREVIEW_ENABLED=true`.
- Product media currently uses placeholders (`public/brand/placeholder-product.svg`) with descriptive alt text; replace with AVIF/WebP files in `public/brand/` per product.
