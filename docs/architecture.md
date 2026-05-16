# Architecture

## Target architecture
The website should be split into three layers:

1. Storefront/UI layer
   - React components, routes, layouts, pages, animation components, forms.

2. Domain/application layer
   - Feature hooks, query hooks, mappers, schemas, services, Zustand stores.

3. Data/runtime layer
   - `runtimeClients.cms`
   - `runtimeClients.commerce`
   - `runtimeClients.auth`
   - `runtimeClients.checkout`

Current no-backend phase can use local/mock adapters. Future backend phase swaps adapters with API/Medusa clients without rewriting UI.

## Recommended folder structure
```txt
src/
  app/
    providers/
    router/
    config/
  routes/
    __root.tsx
    index.tsx
    shop/
    drop/
    product.$slug.tsx
    about.tsx
    size-guide.tsx
    auth/
    account/
    admin/
  features/
    landing/
      components/
      hooks/
      schemas/
      services/
      types/
    cms/
      components/
      hooks/
      schemas/
      stores/
      services/
      types/
    drops/
    products/
    cart/
    checkout/
    auth/
    account/
    seo/
    layout/
  shared/
    ui/
    hooks/
    utils/
    lib/
    schemas/
    types/
    api/
    assets/
  server/
    functions/
    routes/
    middleware/
    security/
  content/
    seed/
    mocks/
```

## State rules
- TanStack Query: drops, products, CMS documents, SEO documents, user profile, orders.
- Zustand: CMS editor draft state, preview state, drawers, modals, filters before commit, cart drawer visibility.
- URL search params: shop filters that should be shareable.

## SSR rules
- Route loaders fetch public data where SEO matters.
- Client-only animation code must be dynamic/imported or guarded by client checks.
- LocalStorage CMS adapter must not run during SSR. It must provide safe fallback seed data on the server and hydrate on the client.

## API interface first
Create interfaces before concrete adapters:
```ts
interface CmsClient {
  getActiveDrop(): Promise<Drop>;
  listDrops(): Promise<DropSummary[]>;
  getDropBySlug(slug: string): Promise<Drop>;
  saveDrop(input: SaveDropInput): Promise<Drop>;
}

interface CommerceClient {
  listProducts(params: ProductListParams): Promise<ProductListResult>;
  getProductBySlug(slug: string): Promise<Product>;
}
```

## Canonical CMS types (Zod)
Runtime contracts for external/CMS JSON live under feature folders and shared primitives:
- Drops: `src/features/drops/schemas/drop.schema.ts`, types re-exported from `src/features/drops/types/drop.types.ts`
- Landing acts: `src/features/landing/schemas/landing-act.schema.ts`, `src/features/landing/types/landing-act.types.ts`
- SEO documents: `src/features/seo/schemas/seo-document.schema.ts`, `src/features/seo/types/seo-document.types.ts`
- Catalog products (commerce doc model): `src/features/products/schemas/commerce.schema.ts`, `src/features/products/types/commerce.types.ts`
- Money, media, navigation, site settings: `src/shared/schemas/*.schema.ts`, `src/shared/types/*.types.ts`
- Example validated seed: `src/content/seed/drop-01-the-oath.seed.ts`

## Migration path
1. Local seed/localStorage adapter.
2. TanStack Start server functions/server routes adapter.
3. External backend adapter.
4. Medusa commerce adapter for products, variants, inventory, pricing, carts, orders.
5. Custom ANVL CMS tables remain separate for drops, acts, SEO, media, and campaign content.

## As-built snapshot (inventory)

A Prompt 01 codebase audit (routes, CMS vs hard-coded copy, SSR/browser boundaries, GSAP/cart flows, and cautious files) lives in `docs/technical-debt.md` under **As-built audit (2026-05-14)**. Update that section when the app structure materially changes so agents do not rely on stale route lists.
