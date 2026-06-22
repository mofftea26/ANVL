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

1. **Shopify Storefront API** when `VITE_SHOPIFY_*` is set
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

## Shop UX
- Mobile-first product grid with **shareable URL filters** (`q`, `status`, `drop`, `source`, `color`, `size`, `minPrice`, `maxPrice`) validated in `src/features/products/shop/shopUrlSearch.ts`.
- **Mobile**: filters live in a bottom `Drawer` (`placement="bottom"`). **Desktop**: filters in a left sidebar (`ShopFiltersForm`).
- **Search** debounces (~350ms) into the URL from `src/routes/shop/index.tsx`.
- **Product card** reads optional `product.shop` for status chips, compare-at strike price, and uses **desktop-only** hover scale (`md:`) to keep mobile light.
- Catalog rows and filter options come from `getStorefrontShopListingCatalog()` in `products.commerce.ts` (mock commerce client implements `getShopListingCatalog()`).

## Storefront checkout (guest)
- Guest-first flow on `/checkout` (no sign-in gate).
- Shipping: address lines 1â€“2, city, optional postal code, country select, phone, optional delivery notes; payment methods come from `src/features/checkout/config/checkoutPayments.config.ts` (Lebanon: COD + Whish Money when country matches Lebanon or ISO `lb`; non-Lebanon: card only when `VITE_ANVL_INTERNATIONAL_CHECKOUT=true`).
- Real PSP / Whish / Medusa wiring is stubbed in `paymentGateway.mock.ts` with explicit integration labels in the UI.

## Product details UX
- **Gallery**: `ProductGallery` accepts optional `images` for per-colorway media from `product.shop.imagesByColorName`.
- **Video**: YouTube URLs on `AdminProduct.videoUrl` resolve via `extractYoutubeVideoId` (`src/features/products/pdp/videoEmbed.ts`) and render as a privacy-enhanced embed on the PDP.
- **3D**: `model3dUrl` shows a short placeholder plus external link (AR viewer integration later).
- **Selectors**: `ColorSwatch` marks colorways with no in-stock sizes; `SizeSelector` disables OOS sizes for the active color using `shop.availabilityByColorAndSize`.
- **Accordions**: `AccordionDisclosure` (`src/shared/components/ui/AccordionDisclosure.tsx`) groups material, fit, care, shipping, and returns on the PDP.
- **Related products**: `getRelatedStorefrontProducts` scores by shared primary drop, then category (`products.commerce.ts`).
- **JSON-LD**: `productJsonLd` uses `shop.currency` and derived `Offer` availability from storefront status + variant stock (`structuredData.ts`).

## Medusa migration notes
Map ANVL products to Medusa Product Module later:
- Medusa product options: color, size.
- Medusa product variants: color-size combinations.
- Medusa pricing module: regional prices, sales, price rules.
- Medusa inventory module: stock availability.
- ANVL CMS keeps theme, landing content, assets, and story editorial fields (products are commerce-backend only).
