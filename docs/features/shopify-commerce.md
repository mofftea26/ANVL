# Feature — Shopify commerce (headless)

## Purpose

**Shopify** is the system of record for products, variants, inventory, cart, and checkout. **ANVL CMS (Supabase)** remains the system of record for drops, landing, header/footer, SEO, and active-drop theme.

## Env (browser-safe vs server-only)

| Variable | Where | Role |
|----------|-------|------|
| `VITE_SHOPIFY_STORE_DOMAIN` | App | `your-store.myshopify.com` |
| `VITE_SHOPIFY_STOREFRONT_API_VERSION` | App | e.g. `2025-01` |
| `VITE_SHOPIFY_STOREFRONT_PUBLIC_TOKEN` | App | Storefront API token |
| `SHOPIFY_ADMIN_API_ACCESS_TOKEN` | Edge / CI only | Admin API (never `VITE_*`) |
| `SHOPIFY_API_SECRET_KEY` | Edge webhook | Webhook HMAC |

See `.env.example`.

## Runtime selection

`createCommerceClient()` in `src/features/products/api/createCommerceClient.ts`:

1. **Shopify** when `VITE_SHOPIFY_*` is set → `commerceClient.shopify.ts`
2. Else **Supabase** `products_snapshot` when `VITE_SUPABASE_*` is set
3. Else **localStorage** (browser) or **seed** (SSR)

Shopify adapter falls back to Supabase/seed on API errors.

## Drop ↔ product linking

In Shopify Admin, set product metafield:

- Namespace: `anvl`
- Key: `drop_ids`
- Value: JSON array of ANVL drop client ids, e.g. `["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"]`

Homepage product strip filters by active drop from `storefront_publication`.

## Admin

When Shopify env is configured, `/admin/products` shows **Open products in Shopify** instead of the local catalog matrix.

## Webhooks

`supabase/functions/shopify-webhook` — verifies HMAC, stamps `storefront_publication.shopify_catalog_synced_at`.

## Store setup

See `docs/plans/2026-05-19-cms-migration-shopify.md` §9.
