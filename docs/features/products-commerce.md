# Feature — Products / Commerce

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
- Mobile-first product grid.
- Filters in bottom sheet on mobile.
- Sidebar filters on desktop.
- Search with debounce.
- Product card shows title, price, status/badge, color swatches, quick status.
- No heavy animation on mobile.

## Product details UX
- Image gallery.
- Optional video.
- Optional 3D image/model placeholder.
- Color/size variant selector.
- Availability by selected color/size.
- Material, fit, care, shipping, returns accordion.
- Related products by drop/category.

## Medusa migration notes
Map ANVL products to Medusa Product Module later:
- Medusa product options: color, size.
- Medusa product variants: color-size combinations.
- Medusa pricing module: regional prices, sales, price rules.
- Medusa inventory module: stock availability.
- ANVL CMS keeps drop storytelling, act layout, campaign theme, and SEO editorial fields.
