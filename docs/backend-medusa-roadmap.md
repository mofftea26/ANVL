# Backend / Medusa Roadmap

## Recommended strategy
Do not force all CMS content into Medusa. Use two domains:

1. ANVL CMS domain
   - drops
   - acts
   - drop themes
   - media usage
   - SEO documents
   - header/footer/socials
   - campaign pages

2. Commerce domain, likely Medusa v2
   - products
   - variants
   - prices
   - inventory
   - cart
   - checkout
   - orders
   - customers
   - promotions
   - regions/payment/shipping

## Why this split
ANVL needs a cinematic drop CMS. Medusa is strong for commerce, but drop storytelling/act building/theme control is a brand-CMS concern. Keep the storefront consuming a clean API so Medusa can be added later without rewriting pages.

## Typed API contracts (frontend)
TypeScript DTOs and list/checkout shapes live under `src/shared/api/contracts/` (barrel: `@/shared/api/contracts`). They document the intended REST-style surface for TanStack Start server routes or an external BFF and are **not** wired into `runtimeClients` yet — local/mock adapters keep working unchanged.

Human-readable route grouping: `docs/contracts/README.md`.

### What maps to Medusa later vs what stays ANVL CMS

| Concern | Likely owner | Notes |
|--------|--------------|--------|
| Drops, acts, themes, landing CMS JSON, navigation copy | ANVL CMS | `cms.contract.ts` |
| Editorial SEO cards (page/drop/product) | ANVL CMS | `CmsSeo*` types |
| Storefront product read model | BFF / composer | `products.contract.ts` storefront types align with `CommerceClient` |
| Admin catalog editorial + `dropIds` | ANVL CMS until sync | `AdminProduct*` DTOs |
| Variants, regional prices, inventory, reservations | Medusa | Maps to Inventory / Pricing modules |
| Cart, checkout, payments, fulfillments, tax | Medusa (+ PSP) | `checkout-orders.contract.ts` |
| Customer identity, sessions, password reset | Medusa Customer / auth (or IdP) | `auth.contract.ts` |
| Guest → customer linking, Lebanon payment rules | ANVL BFF | Policy around Medusa APIs |

## Suggested database tables for ANVL CMS
```txt
storefront_publication (singleton published projection — implemented in Supabase MVP)
anvl_drops (draft/published JSON — implemented)
cms_profiles (auth-linked roles — implemented)
cms_admin_products (editorial + medusa_product_id nullable — implemented)
drops
landing_acts
drop_products
media_assets
seo_documents
navigation_items
site_settings
social_links
footer_sections
cms_users later
cms_audit_logs later
redirects later
```

## Example relationships
- drop has many landing acts.
- drop has many products through drop_products.
- landing act belongs to drop.
- seo document belongs polymorphically to page/drop/product.
- media asset can be referenced by drops, acts, products, SEO cards.

## API endpoints / server functions
```txt
GET    /api/cms/active-drop
GET    /api/cms/drops
GET    /api/cms/drops/:id
POST   /api/cms/drops
PATCH  /api/cms/drops/:id
DELETE /api/cms/drops/:id
POST   /api/cms/drops/:id/activate
POST   /api/cms/drops/:id/schedule

GET    /api/products
GET    /api/products/:slug
POST   /api/products
PATCH  /api/products/:id
DELETE /api/products/:id

GET    /api/seo/:entityType/:entityId
PATCH  /api/seo/:entityType/:entityId
```

## Medusa integration phases
1. Keep current frontend adapter interfaces.
2. Build custom ANVL CMS backend tables.
3. Add Medusa for product/order/cart/payment/inventory.
4. Build sync/mapping layer:
   - ANVL product references Medusa product ID.
   - ANVL drop references product IDs.
   - Medusa handles variant pricing and stock.
5. Add admin bridge:
   - Either keep custom ANVL CMS as separate admin.
   - Or add Medusa Admin extensions later for commerce-related panels.

## Background jobs later
- Scheduled drop activation.
- Product release publishing.
- Currency rate refresh.
- Sitemap regeneration.
- Order notification emails.
- Inventory reservation cleanup.

## Security later
- Role-based admin auth.
- Audit logs for CMS changes.
- Media upload validation.
- Rate limiting.
- CSRF protection where cookie sessions are used.
- Webhook signature validation for payment providers.
