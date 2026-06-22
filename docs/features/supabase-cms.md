# Feature — Supabase ANVL CMS

## Purpose

Supabase backs **published storefront state** so SSR, crawlers, and anonymous visitors see the same theme, fonts, assets, active landing page, and copy overrides as production — not an operator's `localStorage` snapshot.

When **`VITE_SUPABASE_*`** is unset, local/demo admin (`VITE_ANVL_ADMIN_*`) and browser persistence remain. When Supabase is set, **`/admin/login`** uses Supabase Auth and only **`cms_profiles.role = admin`** may access the panel.

See also: [`docs/cms-architecture.md`](../cms-architecture.md) (primary architecture reference).

---

## Tables (public schema — current)

| Table | Role |
|-------|------|
| `cms_profiles` | `user_id` → `auth.users`, `role` in `viewer \| editor \| admin`. Bootstrap rows via service role. |
| `cms_settings` | Singleton (`id = 1`): editor source of truth — `active_landing_page_key`, `theme_config`, `font_config`, `asset_config`, `landing_content`. |
| `landing_pages` | Picker metadata only (key, name, description, preview_image, is_available). Content is code-owned. |
| `storefront_publication` | Singleton (`id = 1`): anon-readable SSR mirror — same config fields + `media_index`, `revision`, `published_at`. |
| `cms_media_assets` | Media library catalog (`cms-media` bucket). Synced to `media_index` on admin flush. |
| `storefront_profiles` | Customer identity (`id` → `auth.users`, profile fields). Not CMS. |
| `story_chapters` | Story saga chapters (relational; not mirrored in publication). |
| `story_acts` | Ordered beats within a chapter. |
| `story_cast` | CMS-authored characters. |

### `cms_settings` / `storefront_publication` jsonb shapes

```
active_landing_page_key: 'the-oath'
theme_config:  { activeThemeId, themes[] }           // single global theme; no landingPageThemes
font_config:   { sans, heading, display, library[] }
asset_config:  { general{}, drops{landingKey:{}}, pages{pageKey:{}} }
landing_content: { 'the-oath': { ... copy overrides, tenets.items[].mediaId } }
media_index:   [{ id, path, alt, mime, w, h, updatedAt }]  // publication only
```

---

## Removed (drop-builder era — do not reference)

| Removed | When |
|---------|------|
| Tables: `anvl_drops`, `cms_admin_products`, `shopify_product_links` | 2026-06-07 cleanup |
| `storefront_publication` columns: `published_drop_snapshot`, `products_snapshot`, `catalog_drop_index`, `website_layout`, `site_seo`, etc. | 2026-06-07 cleanup |
| Edge Functions: `publish-storefront`, `process-scheduled-drops` | Removed from repo; sync is direct table upsert |
| App flow: `cms_publish_drop` RPC as primary publish path | Replaced by `adminCmsRemoteSync` |

> **MIG-01 (technical debt):** Migrations `20260620130000`, `20260624120000`, `20260625120000` reintroduce orphaned publish RPCs referencing dropped tables. Fresh `db push` may fail or leave stale cron jobs. See `docs/technical-debt.md`.

---

## Storage buckets

| Bucket | Limit | MIME | Policies |
|--------|-------|------|----------|
| `cms-media` | 50 MB | images, pdf, video (mp4/webm), fonts | Public read; `editor`/`admin` write |
| `story-media` | 500 MB | images + video (mp4/webm/mov) | Public read; `editor`/`admin` write |

Object paths should stay unguessable (UUID prefixes) for defense in depth.

---

## RLS (summary)

| Object | `anon` | `authenticated` (CMS) |
|--------|--------|----------------------|
| `storefront_publication` | SELECT | UPDATE if `admin` |
| `cms_settings` | SELECT | UPDATE if `editor`/`admin` |
| `landing_pages` | SELECT if `is_available` | CMS roles read; `admin` write |
| `cms_profiles` | — | SELECT own row |
| `cms_media_assets` | — | CMS roles read; `editor`/`admin` write |
| `story_*` | SELECT published rows only | CMS roles read; `editor`/`admin` write |
| `storefront_profiles` | — | SELECT/INSERT/UPDATE own row |

---

## Edge Functions (in repo)

| Function | I/O |
|----------|-----|
| `shopify-webhook` | Verifies Shopify HMAC (`SHOPIFY_API_SECRET_KEY`); ack-only `{ ok: true, topic }` — no DB writes |
| `medusa-webhook-stub` | Validates `x-anvl-medusa-secret`; returns `{ ok: true, stub: true }` |

Sources: [`supabase/functions/shopify-webhook/index.ts`](../../supabase/functions/shopify-webhook/index.ts), [`supabase/functions/medusa-webhook-stub/index.ts`](../../supabase/functions/medusa-webhook-stub/index.ts).

---

## Env vars

| Name | Where | Notes |
|------|-------|------|
| `VITE_SUPABASE_URL` | App | Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | App | Browser key from Dashboard → API |
| `SHOPIFY_API_SECRET_KEY` | Edge Function secrets | Shopify webhook HMAC |
| `ANVL_MEDUSA_WEBHOOK_SECRET` | Edge Function secrets | Medusa stub header auth |

Server-only (never `VITE_*`): `SUPABASE_SERVICE_ROLE_KEY`, `SHOPIFY_ADMIN_API_ACCESS_TOKEN`.

Validated in [`src/app/config/publicEnv.ts`](../../src/app/config/publicEnv.ts).

---

## App integration

### Storefront reads

[`loadStorefrontProjection()`](../../src/features/cms/api/loadStorefrontProjection.ts) is the SSR spine:

1. Fetch `storefront_publication` id=1 when Supabase env is set
2. Fallback to `defaultStorefrontProjection()` when unset, missing row, or error
3. Feed theme/fonts inline CSS, active landing key, assets, landing content to routes

Browser anon client uses storage key **`anvl.supabase.storefront-public.v1`** (separate from admin `anvl.supabase.admin.v1`).

Story content is read directly from `story_*` tables via anon RLS on published rows — not from `storefront_publication`.

### Admin (Supabase Auth + remote persistence)

When **`VITE_SUPABASE_*`** is configured:

1. **Sign-in:** `/admin/login` → `signInWithPassword` → `fetchCmsProfileRoleWhenReady`. Only **`role = admin`** may use `/admin`.
2. **Hydration:** `hydrateAdminCmsFromSupabase` pulls `cms_settings` → localStorage. Runs `migrateOathTenetAssetsFromSlots` on pull. `AdminLayout` blocks until `isRemoteCmsReady`.
3. **Sync:** `adminCmsRemoteSync` upserts slim fields to `cms_settings` + `storefront_publication`, rebuilds `media_index`. Immediate flush on explicit Save; 850 ms debounce for active drop + media mutations.
4. **No publish RPC:** Setting active drop or saving config mirrors directly — no `cms_publish_drop` call.

**First admin user:** Create user in Authentication, then insert `public.cms_profiles` with `role = admin` and matching `user_id` (service role or SQL editor).

### localStorage keys (admin working copy)

| Key | Content |
|---|---|
| `anvl.activeLandingPage.v1` | Active landing page key |
| `anvl.themeConfig.v1` | Theme library |
| `anvl.fontConfig.v1` | Font families |
| `anvl.assetConfig.v1` | Asset slot assignments |
| `anvl.landingContent.v1` | Per-landing copy overrides |

### Storefront read priority (with Supabase env)

1. `storefront_publication` row (SSR loaders + TanStack Query)
2. SSR loader data from first paint when fetch is in flight
3. Seed defaults on server; local CMS adapters in browser when offline

Without Supabase env, admin uses **`VITE_ANVL_ADMIN_*`** gate only (no remote sync).

---

## Ops checklist

1. Apply all migrations in `supabase/migrations/` (see `docs/project-map.md` for timeline).
2. Deploy Edge Functions: `shopify-webhook`, `medusa-webhook-stub`.
3. Create admin user + `cms_profiles` row with `role = admin`.
4. App `.env`: `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Verify singleton rows exist: `cms_settings` id=1, `storefront_publication` id=1, `landing_pages` includes `the-oath`.
