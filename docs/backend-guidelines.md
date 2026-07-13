# Backend Guidelines

## Overview

The ANVL backend uses **Supabase** for:
- **Database** — PostgreSQL with RLS
- **Auth** — Supabase Auth (email + password for admin)
- **Storage** — Media library (Supabase Storage buckets)
- **Edge Functions** — Deno-based serverless functions
- **Real-time** — (not yet used; potential for live CMS sync)

Commerce is handled by **Shopify** (when `VITE_SHOPIFY_*` are set) or falls back to local seed data.

---

## Environment Variables

### Public (safe in browser via `VITE_*`)

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key — public read access |
| `VITE_SHOPIFY_STORE_DOMAIN` | e.g. `your-store.myshopify.com` |
| `VITE_SHOPIFY_STOREFRONT_API_VERSION` | e.g. `2025-01` |
| `VITE_SHOPIFY_STOREFRONT_PUBLIC_TOKEN` | Shopify Storefront API public token |
| `VITE_CANONICAL_BASE_URL` | e.g. `https://www.anvlathletics.com` |
| `VITE_ANVL_INTERNATIONAL_CHECKOUT` | `true` enables non-Lebanon card checkout (dev/demo) |
| `VITE_ADMIN_PREVIEW_ENABLED` | `true` to enable `/admin-preview` route |

### Server-only (never `VITE_*`)

| Variable | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged access for migrations, bootstrap scripts, Edge Functions |
| `SHOPIFY_ADMIN_API_ACCESS_TOKEN` | Shopify Admin API (server/Edge only) |
| `SHOPIFY_API_SECRET_KEY` | Shopify webhook signature validation |
| `ANVL_MEDUSA_WEBHOOK_SECRET` | (Legacy stub, replaced by shopify-webhook) |

**Rule:** If you need a server-only secret, it must never appear in any `VITE_*` var. Use Edge Function environment variables or server-side config only.

---

## Supabase Client

### Public storefront client

Created via `createAnvlSupabaseClient()` in `src/features/cms/api/createAnvlSupabaseClient.ts`. Uses the anon key. Safe in browser. Reads only `storefront_publication`.

> **2026-06-12:** `cms_settings` and `storefront_publication` gained a
> `landing_content jsonb NOT NULL DEFAULT '{}'` column (migration
> `20260612073914_landing_content_the_forge`) carrying per-landing-key copy
> blobs `{ [landingKey]: {...} }`. Validated client-side by each landing
> page's Zod schema; code defaults fill any gap. Existing row RLS covers the
> column — no policy changes.
>
> **2026-06-20:** the two Drop 01 pages were merged into one key, `the-oath`
> (migration `20260628120000_consolidate_oath_landing_pages`): the extra
> `the-oath-2` asset slots (`chapterMedia1–4`, `manifestoMedia`) were folded
> into the `the-oath` drop (existing values win; dead `interludeVideo`
> dropped), the `the-oath-2` `landing_pages` row was deleted, and the active
> key was forced to `the-oath`. RLS unchanged.
>
> **2026-07-09:** both singletons gained a `coming_soon jsonb NOT NULL DEFAULT
> '{}'` column (migration `20260709120000_coming_soon_config`) — the Coming
> Soon site-mode blob (`enabled` toggle + reveal-page content/SEO), validated
> client-side by `comingSoon.zod.ts`; existing row RLS covers the column. A
> new `public.coming_soon_subscribers` table (migration
> `20260709120001_coming_soon_subscribers`) captures early-access emails:
> anon/authenticated INSERT-only (shape-checked), admin-role SELECT, no
> UPDATE/DELETE policies, case-insensitive unique index on `lower(email)`.

### Admin browser client

Created in `src/features/admin/auth/adminSupabaseBrowserClient.ts`. Storage key: `anvl.supabase.admin.v1`. Panel access requires `cms_profiles.role = admin`; DB RLS allows `editor`/`admin` writes on CMS tables.

### Service role (scripts only)

Only for migrations, bootstrap, and privileged write scripts. **Never** import into app code.

---

## Row Level Security

RLS is enabled on all tables. Rules are enforced at the database level even if application code has bugs.

### Policy model (current)

```
anon:
  - SELECT on storefront_publication
  - SELECT on published story_chapters / story_acts / story_cast (parent is_published)
  - EXECUTE get_passport_by_token(token) (SECURITY DEFINER — safe projection only;
    product_passports has NO public SELECT so claim tokens cannot be enumerated)

authenticated (viewer/editor/admin):
  - SELECT on cms_settings, landing_pages, cms_media_assets, story_*, product_passports (all rows for CMS roles)
  - SELECT on cms_profiles (own row)

authenticated (customer):
  - SELECT on product_passports where claimed_by = auth.uid() (account Armory)
  - EXECUTE claim_passport(token, color, size, display_name) (SECURITY DEFINER —
    atomic first-claim: UPDATE ... WHERE token = $1 AND claimed_by IS NULL)

authenticated (editor/admin):
  - INSERT/UPDATE/DELETE on cms_media_assets, story_*, product_passports
  - UPDATE on cms_settings

authenticated (admin):
  - UPDATE on storefront_publication
  - INSERT/UPDATE/DELETE on landing_pages
```

**Never disable RLS on any table.** Orphaned drop-builder RPCs may exist in migration history (MIG-01) — the app does not call them.

---

## Database Migrations

Migrations live in `supabase/migrations/` and are ordered by timestamp prefix.

### Before any schema change

Write this plan first:

1. **Current schema:** which tables/columns exist now
2. **Target schema:** what the schema looks like after the migration
3. **Migration steps:** the SQL operations in order
4. **Risks:** what could break (existing data, running code, RLS policies)
5. **Rollback plan:** how to undo if something goes wrong

### Migration rules

- Migration files are **append-only** — never edit an existing migration file.
- Timestamp prefix must be unique: `YYYYMMDDHHMMSS_descriptive_name.sql`
- Every new table must have RLS enabled.
- Every new table with `auth.users` dependency must have a `REFERENCES auth.users` cascade.
- Add `touch_row_updated_at` trigger to any table with an `updated_at` column.
- Destructive changes (DROP COLUMN, DROP TABLE) need explicit sign-off and a tested rollback.
- Test migrations on a local Supabase instance or staging before applying to production.
- Use `IF NOT EXISTS` / `IF EXISTS` guards where safe to make migrations idempotent.

### Running migrations

```bash
# Apply to local Supabase
supabase db push

# Apply to remote
supabase db push --linked

# Reset local to match migrations
supabase db reset
```

---

## Edge Functions (in repo)

| Function | Purpose |
|---|---|
| `shopify-webhook` | Verifies Shopify HMAC; ack-only — no DB writes |
| `medusa-webhook-stub` | Validates secret header; placeholder for future Medusa sync |

**Removed from repo:** `publish-storefront`, `process-scheduled-drops`. Admin sync writes directly via `adminCmsRemoteSync`.

### Adding a new Edge Function

1. Create folder: `supabase/functions/<function-name>/index.ts`
2. Write Deno TypeScript
3. Use `SUPABASE_SERVICE_ROLE_KEY` (from env) for privileged operations, never hard-code
4. Handle errors gracefully — return proper HTTP status codes
5. Add to `docs/backend-guidelines.md`

---

## Supabase Storage

Media library files are stored in Supabase Storage buckets (see `20260518120001_anvl_cms_storage.sql`).

**Rules:**
- Validate file type and size at the Edge Function level before accepting uploads
- Apply strict bucket policies (only authenticated CMS users may upload)
- Media URLs must be sanitized via `sanitizeHref()` before DOM insertion
- Use the `cms_media_assets` table to track uploaded files with metadata

---

## Commerce (Shopify)

When `VITE_SHOPIFY_*` env vars are set, `createCommerceClient({ isServer: false })` returns the Shopify Storefront API adapter.

### Commerce client adapters (priority order)

1. **Shopify** — when `VITE_SHOPIFY_*` are set
2. **localStorage** — browser-only (legacy local catalog)
3. **Seed** — static JSON fallback (SSR + no backend)

Products are **not** CMS-edited. No Supabase product table in the slim CMS model.

### Shopify rules

- **Storefront API public token** — safe in browser, for product reads and cart operations
- **Admin API access token** — server/Edge only, never in client code
- All Shopify GraphQL calls go through `src/features/shopify/api/shopifyStorefrontClient.ts`
- Products from Shopify are mapped to the internal `Product` type via `shopifyProductToStorefront.ts`
- CMS (theme, fonts, assets, landing content, story) stays in Supabase even when Shopify is the commerce backend
- The `CommerceClient` interface is the contract — UI never knows which adapter runs

---

## Payment System

Currently uses mock adapters. The `PaymentClient` interface defines:
```ts
interface PaymentClient {
  placeOrder(input: CheckoutInput, lines: CartLine[]): Promise<CheckoutOrderResult>
}
```

Mock adapters: `cashOnDelivery`, `whishMoney`, `card` (in `src/features/checkout/api/paymentGateway.mock.ts`).

Payment regions configured in `src/features/checkout/config/checkoutPayments.config.ts`:
- Lebanon: COD + Whish Money
- International: card (behind `VITE_ANVL_INTERNATIONAL_CHECKOUT=true`)

Production wiring: swap mock with real PSP adapter (Tap Payments, NetCommerce, Stripe) without changing UI or route code.

---

## Account System

**Current:** Browser uses `mockAccountClient` even when Supabase is configured. SSR may use `supabaseAccountClient` when env is set.

Full production implementation requires: real customer auth sessions, order API (Shopify Customer Account or Medusa), HttpOnly cookies.

---

## Security Checklist (production launch blockers — Phase J)

These are required before public launch:
- [ ] Real server auth with HttpOnly session cookies (replace static env-file gate)
- [ ] CSP (Content Security Policy) headers
- [ ] HSTS headers
- [ ] Rate limiting on auth endpoints and forms
- [ ] Server-side upload validation (file type, size, MIME)
- [ ] CSRF protection on state-mutating endpoints
- [ ] Audit all `VITE_*` vars — confirm no secrets are present
- [ ] Row Level Security audit — confirm all tables have appropriate policies
- [ ] Admin RLS: confirm `cms_profiles.role` check is enforced on all sensitive operations

---

## Medusa (future)

See `docs/backend-medusa-roadmap.md` for the integration plan.

When Medusa is added:
1. Implement `CommerceClient` interface with Medusa adapter
2. Move cart + checkout to Medusa cart/order flows
3. Keep CMS (theme, assets, landing content, story) in Supabase
4. Route/component code stays unchanged (interface contract preserved)
