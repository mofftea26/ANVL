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
  - SELECT on gamification_* (settings/ranks/rank_levels/challenges/badges — the
    Armory's rules are public data; seeded == code defaults)
  - INSERT on coming_soon_subscribers (write-only mailbox; no SELECT)
  - EXECUTE get_passport_by_token(token) (SECURITY DEFINER — safe projection only;
    product_passports has NO public SELECT so claim tokens cannot be enumerated.
    Since 20260731090000_armory_discovery.sql it also returns owner_armory_handle,
    non-null ONLY when the passport shows its owner (owner/public) AND the owner's
    armory is public — a live transfer code does not unlock it)
  - EXECUTE get_product_reviews(...), get_public_armory(handle) (SECURITY DEFINER)
  - EXECUTE search_public_armories(query, limit) (SECURITY DEFINER — searches
    armory_public profiles only, returns handle + display name only; ILIKE
    wildcards escaped, min query length 2, results capped at 12)

authenticated (viewer/editor/admin):
  - SELECT on cms_settings, landing_pages, cms_media_assets, story_*, product_passports (all rows for CMS roles)
  - SELECT on techpacks, techpack_images (no anon policy at all)
  - SELECT on passport_transfers (CMS reads all)
  - SELECT on cms_profiles (own row)

authenticated (customer):
  - SELECT on product_passports where claimed_by = auth.uid() (account Armory)
  - SELECT/INSERT/UPDATE/DELETE on armory_feats (own rows only)
  - SELECT/DELETE on product_reviews (own rows); writes only via submit_product_review
  - SELECT/UPDATE on storefront_profiles (own row; auto-created on signup by the
    handle_new_storefront_user() trigger)
  - SELECT on orders (own — matched by id or email claim); writes are service-role only
  - SELECT on passport_transfers where the caller is a participant
  - EXECUTE claim_passport(token, color, size, display_name) (SECURITY DEFINER —
    atomic first-claim: UPDATE ... WHERE token = $1 AND claimed_by IS NULL)

authenticated (editor/admin):
  - INSERT/UPDATE/DELETE on cms_media_assets, story_*, product_passports, gamification_*,
    techpacks, techpack_images
  - UPDATE on cms_settings
  - EXECUTE set_techpack_final(id), admin_search_profiles(query),
    admin_unassign_passport(...) — each re-checks cms_profiles.role INSIDE the
    function body, so the grant to `authenticated` is not the real gate

authenticated (admin):
  - UPDATE on storefront_publication   ← admin only, NOT editor
  - INSERT/UPDATE/DELETE on landing_pages
```

> `cms_settings` has **no anon SELECT policy** — it is CMS-role-only. Only
> `storefront_publication` is anon-readable. Anything the storefront must render
> at request time has to reach the publication mirror, not `cms_settings`.

### Known RLS/advisor debt (2026-07-29 audit)

- ~~`touch_row_updated_at()` has a mutable `search_path`.~~ **Fixed 2026-08-04** (`search_path = ''`); advisor warning confirmed cleared.
- ~~Unindexed FKs: `armory_feats.user_id`, `passport_transfers.from_user`, `passport_transfers.to_user`, `techpacks.created_by`.~~ **Fixed 2026-08-04**, plus `product_reviews (product_slug, created_at DESC)` — the existing `(user_id, product_slug)` composite leads with `user_id` and so could not serve `get_product_reviews`' by-slug lookup.
- ~~Every table created after `perf20_wrap_auth_uid_in_rls_policies` still calls bare `auth.uid()`.~~ **Fixed 2026-08-05** (`20260805045202_perf22…`): all **31** remaining policies across `gamification_*`, `product_passports`, `passport_transfers`, `coming_soon_subscribers`, `techpacks` and `techpack_images` rewritten; every `auth_rls_initplan` advisor warning cleared. PERF-20 was a one-time sweep and drifted straight back, so treat `(select auth.uid())` as a **standing rule for every new policy** — the fix migration is idempotent and can be re-run as a sweep if it drifts again.
- Duplicate permissive SELECT policies on `landing_pages`, `passport_transfers`, `product_passports`, `story_*`.
- Auth: leaked-password protection still disabled (SEC-23, a dashboard toggle).

**Never disable RLS on any table.** Orphaned drop-builder RPCs may exist in migration history (MIG-01) — the app does not call them.

### `publish_cms_settings(p_patch jsonb, p_media_index jsonb)` — the atomic CMS publish

The admin publishes through **one** SECURITY DEFINER RPC, not two UPDATEs. Before it (F-19), `adminCmsRemoteSync` fired independent PostgREST UPDATEs at `cms_settings` and `storefront_publication` under `Promise.all` — and postgrest-js does **not** reject on a transport failure, it converts one into `{data:null,error}`. So `Promise.all` never rejected and never cancelled its sibling: a one-of-two failure always ran to completion as a **half-write**, permanently diverging the editor's source of truth from what SSR renders. It was also self-concealing, because hydration reads `cms_settings` only — reloading `/admin` could not reveal the split, and if `cms_settings` was the failed half, reloading silently replaced the operator's edit with the stale draft while the storefront kept serving the new value.

Things that matter when changing it:
- **The role gate is `admin`, deliberately** — the STRICTER of the two tables (`cms_settings` allows editor|admin, `storefront_publication` allows admin only). Gating on `editor` would hand editors a write path to the anon-readable publication mirror they do not have today. The table policies are untouched, so nobody's direct rights changed.
- **Key presence decides what is written, and a JSON `null` counts as absent.** Every jsonb column is `NOT NULL`, but a JSON null is a *legal* jsonb value, so the constraint would not catch it — `coalesce(p_patch->'k', k)` would store a json null that the Zod readers then resolve to code defaults, i.e. a silent content wipe.
- **The allowed-column list mirrors `CMS_SETTINGS_FIELD_KEYS`** in `adminCmsRemoteSync.ts`, and there is **no typecheck link** between them. A new column must be added in both.
- `updated_at`, `published_at` and `revision` are set server-side; `revision` is now the Postgres clock rather than the browser's `Date.now()`.
- A 0-row match **raises**, which rolls both UPDATEs back together.

**Regression detector** — after any change here, all 13 shared columns must still be identical in both tables:
```sql
select k, (to_jsonb(s.*) -> k) is not distinct from (to_jsonb(p.*) -> k) as identical
from public.cms_settings s, public.storefront_publication p,
unnest(array['active_landing_page_key','theme_config','font_config','asset_config',
  'landing_content','shop_config','pdp_content','passport_content','coming_soon',
  'banner_config','legal_content','support_content','site_seo']) k
where s.id=1 and p.id=1;
```

### Migration history vs `supabase/migrations/` (MIG-01, updated 2026-08-04)

Two separate problems; only the first is fixed.

1. **Content gap — CLOSED.** Eight applied migrations had their SQL on disk nowhere. They were backfilled verbatim (SELECT-only read of `supabase_migrations.schema_migrations`). Two of them are load-bearing for security, and their absence meant a rebuilt environment was *less* secure than production:
   - `tighten_cms_settings_rls_and_revoke_rls_auto_enable_grant` — drops the public SELECT on `cms_settings` (anon could read unpublished CMS drafts) and revokes `rls_auto_enable()` EXECUTE.
   - `sec25_remove_public_storage_listing_policies` — drops the `storage.objects` policies that allowed enumerating every filename in `cms-media` / `story-media`. Public object fetches are served by the bucket's `public: true` flag, so existing CDN URLs are unaffected.
   - `20260518133503_anvl_oath_bootstrap_storefront.sql` is a **deliberate no-op**: its original body seeded the drop-builder (`anvl_drops`, `published_drop_snapshot`), all of which a later migration drops. The file exists so the version appears in the folder; the SQL is recoverable from production if ever needed.
2. **Version divergence — STILL OPEN.** The folder numbers migrations `…120000` while the applied history uses real timestamps. Only 15 of 71 files match an applied version; **56 carry versions never applied**. `supabase db push` against production would attempt to re-apply them, and not all are idempotent (`create extension pg_net` is not). **Do not rebuild an environment from this folder** until a `supabase migration repair` / renumber pass aligns the two.

### Audit corrections applied 2026-08-04 (`20260804172317`)

- `get_product_reviews` now orders **inside** the subquery so `LIMIT 50` takes the newest 50. It previously limited before ordering, so past 50 reviews a product showed an arbitrary subset.
- `touch_row_updated_at` has `search_path = ''`. It was the only function in `public` without one; the advisor warning is confirmed cleared.
- Covering indexes added: `product_reviews (product_slug, created_at DESC)`, `armory_feats (user_id)`, `passport_transfers (from_user)`, `passport_transfers (to_user)`, `techpacks (created_by)`. The reviews one matters most — the existing `(user_id, product_slug)` composite leads with `user_id` and so could not serve the by-slug lookup.
**Round 2 (`20260804174508`)** closed three of those: `accept_passport_transfer` now resets `wear_count` / `last_worn_at` / `featured_slot` / `is_public` (it could previously HARD-FAIL on the `(claimed_by, featured_slot)` partial unique index when the receiving owner already had that slot pinned); `log_passport_wear` folds its 24h cooldown into the UPDATE's WHERE clause so the row lock arbitrates instead of a check-then-write race; and `orders` RLS uses `nullif()` on both sides of the email comparison, so an order whose email resolved to `''` is no longer readable by any signed-in user lacking an email claim.

- **Still open:** `admin_unassign_passport` allows `editor` though the documented model is admin-only (left alone deliberately — narrowing it removes a capability an editor may rely on, which is an operational call).

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
- **Never apply SQL to production without committing the file.** Applying ad-hoc SQL (dashboard SQL editor, `execute_sql`, MCP) creates a migration in the remote history with no counterpart on disk.

> ⚠️ **This folder is NOT currently a faithful source of truth.** A 2026-07-29 audit against the live migration history found **7 migrations applied in production with no file here** (the PERF-20/21 and SEC-24/25 remediations, the `cms_settings` RLS tightening, and `site_seo_column`) and **7 files here that never appear in the applied history**. A fresh `supabase db push` into an empty project would therefore not reproduce production. Tracked as **MIG-01**; backfill the missing SQL before rebuilding any environment from this folder.

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

## Edge Functions

| Function | Purpose | Deploy state (verified 2026-07-29) |
|---|---|---|
| `shopify-webhook` | Verifies Shopify HMAC. For `orders/*` topics, upserts a denormalized copy into `public.orders` (service role), linking to `storefront_profiles` by email. Other topics are acknowledged without writes | **Deployed** (v4, ACTIVE) |
| `techpack-ai` | AI rewrite overlay for a parsed techpack. Writes only `techpacks.ai_document`, never `techpacks.document`, so the deterministic parse is never overwritten. Guards on `cms_profiles` role; returns `not_configured` until `ANTHROPIC_API_KEY` is set via `supabase secrets set` | **Deployed** (v3, ACTIVE, `verify_jwt: true`) |
| `medusa-webhook-stub` | Validates secret header; placeholder for future Medusa sync | **In repo, never deployed** |

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
