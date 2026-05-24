# Backend / Shopify roadmap

This document supersedes the Medusa-first draft in `docs/backend-medusa-roadmap.md` for commerce. Campaign CMS tables and flows are unchanged — see `docs/features/supabase-cms.md`.

## Two domains

1. **ANVL CMS (Supabase)** — drops, acts, themes, layout, SEO, publish snapshot.
2. **Shopify** — products, variants, inventory, cart, checkout, orders, discounts, shipping.

## App integration

- `src/features/shopify/**` — Storefront API client, mappers, env.
- `src/features/products/api/commerceClient.shopify.ts` — `CommerceClient` implementation.
- `src/features/products/api/createCommerceClient.ts` — adapter selection.

## Phased delivery

| Phase | Status |
|-------|--------|
| Storefront API catalog reads | Implemented (env-gated) |
| Cart + Checkout (Storefront Cart API) | Planned |
| Customer accounts (Shopify Customer API) | Deferred |
| Admin product matrix removed when Shopify on | Implemented (redirect) |
| `shopify-webhook` Edge function | Implemented |
| Optional `shopify_product_links` table | Migration added |

## Contracts

`src/shared/api/contracts/*.contract.ts` — commerce shapes unchanged; implementations call Shopify instead of Medusa.
