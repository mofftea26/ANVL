# Backend / Medusa Roadmap

## Recommended strategy
Do not force all CMS content into Medusa. Use two domains:

1. ANVL CMS domain
   - code-owned landing pages (active-page selection + per-scene copy overrides + asset slots —
     landing pages themselves are React components, not CMS-authored content)
   - theme/font tokens
   - media usage
   - SEO documents
   - header/footer/socials
   - product passports + Armory gamification
   - story saga (chapters/acts/cast)

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
ANVL needs a cinematic brand CMS (theme, landing-page selection, passports, story, gamification). Medusa is strong for commerce, but that storytelling/theme/passport layer is a brand-CMS concern. Keep the storefront consuming a clean API so Medusa can be added later without rewriting pages.

> **Note (2026-07-29):** an earlier version of this roadmap described the CMS domain as
> "drops/acts/drop themes/campaign pages" — that configurable drop-builder + acts system was
> torn down 2026-06-07. The list above reflects the current code-owned landing-page architecture.

## Typed API contracts (frontend)
TypeScript DTOs and list/checkout shapes live under `src/shared/api/contracts/` (barrel: `@/shared/api/contracts`). They document the intended REST-style surface for TanStack Start server routes or an external BFF and are **not** wired into `runtimeClients` yet — local/mock adapters keep working unchanged.

Human-readable route grouping: `docs/contracts/README.md`.

### What maps to Medusa later vs what stays ANVL CMS

| Concern | Likely owner | Notes |
|--------|--------------|--------|
| Editorial SEO cards (page/product) | ANVL CMS | `cms.contract.ts` (`CmsSeo*` types — the drop/act contracts this file once held were removed with the drop-builder teardown) |
| Storefront product read model | BFF / composer | `products.contract.ts` storefront types align with `CommerceClient` |
| Admin catalog editorial + `dropIds` | ANVL CMS until sync | `AdminProduct*` DTOs |
| Variants, regional prices, inventory, reservations | Medusa | Maps to Inventory / Pricing modules |
| Cart, checkout, payments, fulfillments, tax | Medusa (+ PSP) | `checkout-orders.contract.ts` |
| Customer identity, sessions, password reset | Medusa Customer / auth (or IdP) | `auth.contract.ts` |
| Guest → customer linking, Lebanon payment rules | ANVL BFF | Policy around Medusa APIs |

## Suggested database tables for ANVL CMS

> The drop-builder CMS (drops, acts) was torn down 2026-06-07 — landing pages are now static,
> code-owned React components (`src/features/landingPages/registry.ts`), not database-driven.
> There is no `anvl_drops`, `drops`, or `landing_acts` table. The rows below marked
> **implemented** reflect the actual current Supabase schema (see `CLAUDE.md` § Supabase Rules
> for the authoritative, maintained table list); the rest remain speculative/forward-looking.

```txt
storefront_publication (singleton published projection incl. theme/fonts/assets/active landing
  key/landing content + shop/coming-soon/banner/legal/support/site_seo/pdp_content/
  passport_content blobs — implemented)
cms_settings (editor source of truth mirrored into storefront_publication — implemented)
cms_profiles (auth-linked roles — implemented)
landing_pages (active-landing-page picker metadata, keys matched against the code registry — implemented)
product_passports, passport_transfers, armory_feats, product_reviews (per-unit QR passports +
  Armory life — implemented)
gamification_settings / gamification_ranks / gamification_rank_levels / gamification_challenges /
  gamification_badges (Armory progression rules — implemented)
story_chapters / story_acts / story_cast (Story saga — implemented)
storefront_profiles, orders, coming_soon_subscribers (customer/account data — implemented)
cms_admin_products (editorial + medusa_product_id nullable — not yet implemented; commerce
  catalog is still local/seed/Shopify adapters, not a Supabase table)
media_assets (cms_media_assets — implemented)
seo_documents (site_seo blob covers this today; a dedicated per-entity table is speculative)
navigation_items, site_settings, social_links, footer_sections (nav/footer/SEO are still code
  defaults — not CMS-editable — speculative if that ever changes)
cms_users later
cms_audit_logs later
redirects later
```

## Example relationships
- product belongs to zero-or-one merchandising "drop" tag (`dropIds` — a catalog label, not the
  removed drop-builder CMS) and/or is an individual release.
- seo document belongs polymorphically to page/product.
- media asset can be referenced by the active landing page's asset slots, products, SEO cards,
  passports, and story chapters/acts.
- product passport belongs to a product (by slug) and, once claimed, to an owner.

## API endpoints / server functions
```txt
GET    /api/cms/active-landing-page
PATCH  /api/cms/active-landing-page

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
   - Medusa handles variant pricing and stock.
5. Add admin bridge:
   - Either keep custom ANVL CMS as separate admin.
   - Or add Medusa Admin extensions later for commerce-related panels.

## Background jobs later
- Scheduled landing-page / content publishing.
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
