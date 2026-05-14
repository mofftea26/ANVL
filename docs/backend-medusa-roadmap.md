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

## Suggested database tables for ANVL CMS
```txt
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
