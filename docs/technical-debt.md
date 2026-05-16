# Technical Debt

Track known compromises here.

## Current expected temporary compromises
- Frontend-only local/mock CMS until backend exists.
- Temporary static admin login is not production security.
- Currency conversion may start as static rates until backend/server cache exists.
- Scheduled activation may be simulated client/server-side until background jobs exist.
- Media library may start as URL/manual asset picker until real storage exists.

---

## As-built audit (2026-05-14) — Prompt 01

Canonical reference: TanStack Router file routes under `src/routes/` and generated `src/routeTree.gen.ts` (do not hand-edit).

### 1. Current folder map (high level)

```txt
src/
  app/           # AppProviders, runtime client wiring, SEO meta helpers
  routes/        # TanStack Start file routes (public + admin + checkout)
  features/      # Feature slices: admin, analytics, cart, checkout, cms, marketing, products
  shared/        # UI primitives, layout, motion (Framer), SEO components, hooks, lib (incl. gsap)
  router.tsx     # createRouter
  routeTree.gen.ts
```

Feature slices align loosely with the target layout in `docs/architecture.md`; admin sub-features (`drops`, `products`, `landing-cms`, `website-layout`, `global-brand`, `auth`) hold most CMS persistence today.

### 2. Public routes and admin routes

**Public (storefront)**  
`/`, `/about`, `/size-guide`, `/care-guide`, `/contact`, `/cart`, `/checkout`, `/checkout/success`, `/shop`, `/shop/$slug`, `/drop/$slug`, `/privacy`, `/terms`, `/returns`, `/admin-preview` (redirects to `/admin/login`).

**Admin (under `/admin`, wrapped by `AdminAuthProvider`)**  
`/admin/login` (unauthenticated form), `/admin/` dashboard, `/admin/drops`, `/admin/drops/new`, `/admin/drops/$dropId`, `/admin/products`, `/admin/products/new`, `/admin/products/$productId`, `/admin/website-layout`, `/admin/theme`, `/admin/seo`.

**Guards**  
`ProtectedAdminRoute` is used on dashboard/CMS screens (not on login). Auth and CMS data are client `localStorage`; SSR renders a loading/redirect shell until hydration.

### 3. Hard-coded vs CMS-driven

| Area | Mostly | Notes |
|------|--------|--------|
| Homepage copy & acts | CMS-driven | Resolved via `getLandingCmsContent()` → active drop + website layout (`getResolvedLandingPageCms`), with legacy landing JSON migration path. |
| Navigation, footer, announcement | CMS-driven | `LandingPageCmsContent` from loader + `useLandingCms` for client sync. |
| Active drop theme (CSS variables) | CMS-driven (client) | `ActiveDropThemeBridge` applies palette from `getActiveDrop()` after mount. |
| Drop page | CMS-driven | Loader uses `drops.service` + `products.commerce` for active drop only; others redirect. |
| Product catalog & PDP SEO | CMS + mock commerce | Storefront projection from admin products (`products.commerce`); `mockCommerceClient` wraps the same source. |
| Shop listing SEO / subtitle | Hard-coded strings | e.g. “Drop 01: The Oath” in `shop/index.tsx` head and body. |
| About, size guide, legal, care | Hard-coded | Static TSX content and `buildSeoMeta` titles/descriptions in-route. |
| Waitlist backend | Mock | `waitlist.mock` / form hook; no server persistence. |

### 4. SSR risks

- **Hydration mismatch (theme):** SSR uses default/fallback drop theme in HTML/CSS; `ActiveDropThemeBridge` mutates `:root` on the client from `localStorage` drops — first paint can differ from hydrated theme until effect runs.
- **Hydration mismatch (landing/products):** `useLandingCms` and `useHomeProducts` correctly use `useSyncExternalStore` with server snapshots from loaders; risk is low if loaders and client `getLandingCmsContent()` stay aligned. Any future divergence between loader resolution and `getResolvedLandingPageCms()` on the client would flash wrong content.
- **Admin routes:** `ProtectedAdminRoute` cannot know `localStorage` on server — intentional skeleton; not a crash risk.
- **Product loader:** `getAdminProductBySlug` reads from `getAdminProducts()` which returns **seed** data when `readProductsRaw()` is null (SSR). That matches `mockCommerceClient.getProductBySlug` as long as seed and mock catalog stay in sync.

### 5. Browser-only code (expected locations)

- **Hooks:** `useStickyHeader`, `useReducedMotion`, `useLenisScroll` (Lenis + GSAP ticker + `window`/`document`), all behind `useEffect` or browser checks.
- **Storage:** `drops.storage`, `products.storage`, `landingCms.storage`, `websiteLayout.storage`, `globalBrand.storage`, `adminAuth.storage` — `window.localStorage` and `storage` events.
- **Services:** `drops.service` (`ensureDropSystemHydrated`, `resetAllLocalCmsKeys`), `ActiveDropThemeBridge` (`document.documentElement`).
- **Zustand cart:** `persist` middleware writes `anvl-cart` in the browser after hydration.

### 6. Animation files and loading

| Mechanism | Files / usage |
|-----------|----------------|
| GSAP + ScrollTrigger + `useGSAP` | `src/shared/lib/gsap.ts` registers plugins once. Marketing sections: `HeroForgeSequence`, `OathStampSequence`, `PiecesGrid`, `MaterialsMarquee`, `DropRevealSection` (lazy-loaded from `/`), `WaitlistSection`. |
| Lenis smooth scroll | `useLenisScroll` on homepage only; disabled when `prefers-reduced-motion`. |
| Framer Motion | `RevealOnScroll.tsx`, `AnimatedText.tsx` (lighter scroll-in animations). |

GSAP runs in client components via `useGSAP`; homepage code-split loads `DropRevealSection` dynamically.

### 7. Product / cart flow

1. **Listing:** `/shop` loader → `runtimeClients.commerce.getProducts()` → `getStorefrontProductsForShop()` (admin catalog + visibility rules).
2. **PDP:** `/shop/$slug` loader → commerce mock + `getAdminProductBySlug` for SEO/admin fields; `useCart().addLine` pushes lines into Zustand `useCartStore` (persisted `anvl-cart`).
3. **Cart page:** `/cart` reads `useCart`, quantity updates, navigate to `/checkout`.
4. **Checkout:** `useCheckoutForm` + `paymentGateway.mock` (see `src/features/checkout/`).

### 8. Suggested refactor sequence (small tasks)

1. Centralize **shop-level SEO** (and hard-coded “Drop 01” strings) in CMS or `buildSeoMeta` driven by active drop.
2. Extract **legal/static content** blocks to MD/JSON + schema if non-devs must edit without releases.
3. Add **server-safe CMS adapter** path: loaders already use `runtimeClients.cms`; swap mock for API while keeping `getResolvedLandingPageCms` semantics on server.
4. **Theme bridge:** optional inline critical CSS variables from active drop in loader to reduce first-paint flash (or accept flash until backend SSR reads same source).
5. **Admin auth:** replace localStorage demo auth with real session/cookies when backend exists.
6. **Cart/checkout:** replace Zustand persist with Medusa (or similar) line items when commerce client is real.
7. **Framer vs GSAP policy:** document per-surface (already mobile-first in GSAP via `matchMedia` / reduced motion in Lenis path).

### 9. Files / areas — do not touch without caution

- `src/routeTree.gen.ts` — generated by TanStack Router.
- `src/features/admin/drops/drops.service.ts` — hydration, migration from legacy landing, active drop invariants; regressions affect entire storefront CMS resolution.
- `src/features/cms/publicLanding.ts` + `landingCms.service.ts` — canonical homepage resolution.
- `src/features/admin/products/products.mapper.ts` + `products.commerce.ts` — storefront visibility and pricing rules.
- `src/shared/lib/gsap.ts` and marketing GSAP components — easy to break ScrollTrigger/Lenis coupling or reduced-motion expectations.
- `src/app/config/runtime.ts` — single swap point for real adapters; keep interface-stable.
- Brand logo components (`AnvlLogoImage`, etc.) — product rule: global logo must remain official ANVL mark.

For a shorter index of docs vs code, see `docs/architecture.md` (link paragraph).
