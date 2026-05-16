# Feature â€” Products / Commerce

## Storefront performance notes
- PDP `ProductGallery` uses `fetchPriority="high"` on the hero frame, lazy + async decoding for thumbnails, and an optional `images` prop for colorway-specific galleries when `product.shop.imagesByColorName` is present.


- `/shop` uses `useDeferredValue` on the filtered listing so rapid filter changes stay responsive while the loader-derived list catches up.
- Admin `/admin/products` renders from `src/routes/admin/products/index.tsx`; list thumbnails use `loading="lazy"` and `decoding="async"`.
- **Catalog empty / filter miss:** the catalog shows a â€œNo products yetâ€ card when storage is empty, and a â€œNothing matchesâ€ card with one-tap filter reset when the active filters hide every SKU.- Public storefront `Product` (`src/features/products/types/product.types.ts`) includes optional `shop?: ProductShopMeta` (storefront status, drop slug, pricing, availability matrix, media URLs) populated in `adminProductToLegacy` for filters, cards, PDP, and JSON-LD.

- `/shop` uses `useDeferredValue` on the filtered listing so rapid filter changes stay responsive while the loader-derived list catches up.
- Admin `/admin/products` is loaded with `lazyRouteComponent` (`-adminProductsIndex.tsx`) so the catalog filters, grouping, and thumbnails are not bundled with the lightweight route shell; list thumbnails use `loading="lazy"` and `decoding="async"`.
- Public storefront `Product` (`src/features/products/types/product.types.ts`) includes optional `shop?: ProductShopMeta` (storefront status, drop slug, pricing, availability matrix, media URLs) populated in `adminProductToLegacy` for filters, cards, PDP, and JSON-LD.
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

## CMS Product section
Product list must include:
- Search bar.
- Filters: status, drop, date, source type, category, color, size availability.
- Sort: newest, oldest, release date, price, status.
- Grouping: by drop and individual releases.
- Actions: edit, duplicate, archive, delete, preview.

### Admin catalog (local CMS, `AdminProduct`)
The in-browser catalog at `/admin/products` implements the list above against `src/features/admin/products/products.types.ts`:

- **Search** uses `useDeferredValue` for low-cost debouncing while typing.
- **Filters**: status, drop (including â€œunassigned onlyâ€), listing source (`drop` vs `individual`), category substring, color name substring, sellable vs no sellable variants, updated date range.
- **Sort**: newest/oldest `updatedAt`, release date, price, status.
- **Grouping**: flat list or sections per drop plus an â€œIndividual releasesâ€ bucket (`dropIds` empty).
- **Actions**: edit, duplicate (deep clone, new slug, clears drop links), archive (`status: archived`, confirmation modal), delete (with confirmation; detaches from drops), storefront preview link (`/shop/:slug`).
- **Catalog UX:** when the in-browser catalog is empty, `/admin/products` shows a â€œNo products yetâ€ card; when filters hide every row, a â€œNothing matchesâ€ card can clear filters in one action. Implementation lives in `src/routes/admin/products/index.tsx`.
- **Variants**: color Ã— size matrix with SKU, `stockQuantity`, `reservedQuantity`; `isAvailable` is recomputed from `max(0, stock âˆ’ reserved) > 0`. `sourceType` is derived on save from `dropIds` (`individual` when unassigned).

Persistence: `products.service` hydrates legacy JSON (`currency`, `reservedQuantity`, `sourceType`) and normalizes on `upsertAdminProduct`.

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
- ANVL CMS keeps drop storytelling, act layout, campaign theme, and SEO editorial fields.
