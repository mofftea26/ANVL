# Feature â€” Products / Commerce

## Storefront performance notes
- PDP `ProductGallery` uses `fetchPriority="high"` on the hero frame, lazy + async decoding for thumbnails, and an optional `images` prop for colorway-specific galleries when `product.shop.imagesByColorName` is present.


- `/shop` uses `useDeferredValue` on the filtered listing so rapid filter changes stay responsive while the loader-derived list catches up.
- Admin routes under `src/routes/admin/**` load through `lazyRouteComponent` + colocated `-admin*.tsx` sidecars (`PERF-01`).
## Product model
Products must support both drop releases and individual releases.

```ts
type Product = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  sourceType: 'drop' | 'individual';
  dropId?: string;
  releaseDate?: string;
  basePrice: Money;
  compareAtPrice?: Money;
  currency: string;
  status: ProductStatus;
  badges: ProductBadge[];
  material?: string;
  fit?: string;
  care?: string;
  media: ProductMedia;
  options: ProductOption[];
  variants: ProductVariant[];
  seo: SeoDocument;
  createdAt: string;
  updatedAt: string;
};
```

## Product status
- `available`
- `comingSoon`
- `outOfStock`
- `sale`
- `limitedEdition`
- `archived`

## Variant model
Availability must be automatic based on color + size stock.

```ts
type ProductVariant = {
  id: string;
  sku?: string;
  color: string;
  size: string;
  stockQuantity: number;
  reservedQuantity?: number;
  priceOverride?: Money;
  mediaOverride?: ProductMedia;
};
```

Computed behavior:
- Variant available if `stockQuantity - reservedQuantity > 0` and product status allows purchase.
- Product out of stock if no purchasable variant remains.
- Size selector should update based on selected color.
- Color selector should show unavailable state when all sizes are unavailable.

## Runtime contracts
The commerce document `Product` model is implemented as **`CatalogProduct`** (plus `ProductVariant`, `ProductOption`, and related enums) in `src/features/products/schemas/commerce.schema.ts`, with re-exports in `src/features/products/types/commerce.types.ts`. This is separate from the storefront `Product` interface used by the shop UI today. Validated placeholders for Oversized Tee, Stringer, and Compression Tee ship in `src/content/seed/drop-01-the-oath.seed.ts` (`seedDrop01CatalogProducts`).

## Products — not CMS-edited

The CMS products editor was removed (2026-06-07). Commerce comes from:

1. **Shopify Storefront API** when `VITE_SHOPIFY_*` is set — **live** for the ANVL store (`anvl-2.myshopify.com`, USD; Drop 01: Oversized Tee, Compression Tee, Stringer). Shopify products use option names `Size`/`Color`; internal `slug` = Shopify `handle`. The token is minted from the **Headless** sales channel and products must be published to its publication.
2. **Seed catalog** (`products.mock.ts`, `drop-01-the-oath.seed.ts`) for SSR/demo
3. **localStorage** adapter in browser-only legacy mode

Shop routes use `createCommerceClient()` — no admin product CRUD. Landing page product reveal reads `getHomeProducts()` from the active commerce adapter.

> **Historical:** The former `/admin/products` catalog editor is documented in git history only. See `docs/features/drops-cms.md` (archived).

## Pricing and currency
- Store a base currency and base price.
- Support display currency conversion through a backend/service later.
- Frontend-only phase may use static conversion rates with a clear TODO.
- Cache rates server-side later to avoid exposing provider keys.

## Discounts
Support:
- percentage discount
- fixed amount discount
- date range
- product-level or variant-level discount
- badge label like Sale, Limited, Launch Offer

## Shop UX (redesigned 2026-06-29)
- The shop is a decomposed system under `src/features/products/shop/**` (composed by `ShopPage`); the route (`src/routes/shop/index.tsx`) is thin and renders it. See the 2026-06-29 changelog entry for the full map.
- **Shareable URL filters** (`q`, `status`, `category`, `drop`, `source`, `color`, `size`, `minPrice`, `maxPrice`, optional `sort`) validated in `shopUrlSearch.ts`. Filtering/sorting are **client-side from the full catalog** (loader returns all items + facets and is search-independent → instant, no refetch, SSR-consistent). `computeShopFacetCounts` powers per-option counts + disabled impossible combinations.
- **Desktop**: sticky `ShopFilterRail`; **mobile**: `ShopFilterDrawer` (bottom sheet). Both render the single config-driven `ShopFilterPanel`. Active filters show as removable chips (`ActiveFilterList`).
- **Product card**: the forged `ShopProductCard` (pointer light / tilt / parallax via `useProductCardMotion`), with `ProductCardQuickAdd` + lazy `ProductQuickView`. Colors come from `--shop-*` theme tokens; behavior/visibility come from the CMS `shop_config` (see `/admin/shop`). `WarBanner` card is the alternate `cardStyle: 'banner'` preset.
- Catalog rows and filter options come from `getStorefrontShopListingCatalog()` (mock commerce client implements `getShopListingCatalog()`).

## Storefront checkout

**Shopify hosted checkout (when Shopify is configured).** `CommerceClient.startCheckout(lines)` builds a Shopify cart via the Storefront `cartCreate` mutation (`src/features/shopify/api/shopifyCart.ts`) and returns the hosted `checkoutUrl`; `routes/cart.tsx` redirects the browser there. Cart lines carry the Shopify variant GID (`CartLine.variantId`, resolved in `usePdpVariant` from `ProductShopMeta.variantIdByColorAndSize`). Payment, shipping, taxes and order management are owned by Shopify. The internal `/checkout` + mock gateway below are the **offline fallback** (seed/local adapters return `null` from `startCheckout`).

### Internal mock checkout (guest, offline fallback)
- Guest-first flow on `/checkout` (no sign-in gate).
- Shipping: address lines 1â€“2, city, optional postal code, country select, phone, optional delivery notes; payment methods come from `src/features/checkout/config/checkoutPayments.config.ts` (Lebanon: COD + Whish Money when country matches Lebanon or ISO `lb`; non-Lebanon: card only when `VITE_ANVL_INTERNATIONAL_CHECKOUT=true`).
- Real PSP / Whish / Medusa wiring is stubbed in `paymentGateway.mock.ts` with explicit integration labels in the UI.

## Product detail page (rebuilt 2026-06-29)
- Rebuilt from scratch under `src/features/products/pdp/**` (composed by `ProductDetailPage`); the route (`src/routes/shop/$slug.tsx`) is thin and loads product + related + the storefront projection (PDP assets + `shop_config.pdp`).
- **Two-zone layout**: the e-commerce zone is sized to ~one screen on desktop — `PdpGallery` (desktop carousel: main image + hover arrows + thumbnail rail + lazy `PdpLightbox` with zoom/pan; mobile scroll-snap swipe + dots) and `PdpBuyPanel` (H1, price/sale, colorway swatches, size selector, quantity, add-to-cart, **share** via `shareProduct`, meta chips). `PdpStickyBar` is the mobile add-to-cart. (The buy-panel accordions were removed — to be re-homed later.)
- **Cinematic zone = bento grid** (`PdpBento`, GSAP `usePdpReveal`, `grid-auto-flow: dense`, stacks on mobile): story / material macro / care / colorways (interactive) / forged details / size guide / optional video tiles, each hiding or CSS-falling-back when empty. `PdpRelated` → `PdpRelatedCard` (compact description cards) follow.
- **State**: `usePdpVariant` is the single source of truth for colorway/size/quantity/availability/colorway-aware gallery images + the cart write + analytics, shared by every PDP surface.
- **CMS — global + per-product**: `shop_config.pdp` (section toggles, related count, animation) in `/admin/shop` → "Product detail page". **Per-product** editorial content lives in `pdp_content` (jsonb keyed by slug) edited in **`/admin/products`** — story/material/care/forged-details copy + per-product editorial assets (material macro, lifestyle, ambient, size-guide). The PDP loader resolves it via `resolvePdpContent` (per-product CMS → product field → global `pages.pdp` slot → default). Global decorative assets still come from `/admin/assets` → Product detail slots. Product data stays behind `CommerceClient` for the Shopify swap; Higgsfield art is in `pdp-assets/` for upload.
- **Selectors**: `ColorSwatch` marks colorways with no in-stock sizes; `SizeSelector` disables OOS sizes for the active color using `shop.availabilityByColorAndSize`.
- **Related products**: `getRelatedStorefrontProducts` scores by shared primary drop, then category (`products.commerce.ts`); count is CMS-controlled (`pdp.relatedCount`).
- **JSON-LD**: `productJsonLd` uses `shop.currency` and derived `Offer` availability; the PDP head OG image prefers the CMS `pdp.ogImage` slot.

## Medusa migration notes
Map ANVL products to Medusa Product Module later:
- Medusa product options: color, size.
- Medusa product variants: color-size combinations.
- Medusa pricing module: regional prices, sales, price rules.
- Medusa inventory module: stock availability.
- ANVL CMS keeps theme, landing content, assets, and story editorial fields (products are commerce-backend only).
