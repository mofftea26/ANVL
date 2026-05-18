# Feature — Supabase ANVL CMS (MVP)

## Purpose

Supabase backs **published** storefront state so SSR, crawlers, and anonymous visitors see the same campaign as production — not an operator’s `localStorage` snapshot.

Local/demo admin (`VITE_ANVL_ADMIN_*`) and browser persistence remain until app auth is wired to Supabase JWTs.

## Tables (public schema)

| Object | Role |
|--------|------|
| `storefront_publication` | Singleton row (`id = 1`): **`published_drop_snapshot`**, **`website_layout`**, **`site_seo`**, **`revision`**, **`published_at`**, **`active_drop_id`**, **`products_snapshot`** (jsonb catalog), **`catalog_drop_index`** (minimal drop rows for shop filters), **`global_brand`**, **`campaigns`**, **`lookbook`**, optional **`legacy_landing_cms`**, **`published_manifest`**. **Readable by `anon`** for storefront loaders only (no draft bodies). |
| `anvl_drops` | `draft_body` / `published_body` JSON (`Drop` shape, Zod-validated in app). **No `anon` access** — RLS + authenticated CMS roles only. |
| `cms_profiles` | `user_id` → `auth.users`, `role` in `viewer \| editor \| admin`. Bootstrap rows via service role. |
| `cms_admin_products` | Editorial catalog JSON + nullable `medusa_product_id` (no commerce truth here). |

Tracked DDL: [`supabase/migrations/20260518120000_anvl_cms_core.sql`](../../supabase/migrations/20260518120000_anvl_cms_core.sql), [`supabase/migrations/20260518120001_anvl_cms_storage.sql`](../../supabase/migrations/20260518120001_anvl_cms_storage.sql), [`supabase/migrations/20260518140000_storefront_publication_catalog.sql`](../../supabase/migrations/20260518140000_storefront_publication_catalog.sql).

## Storage (`cms-media`)

| Policy | Who |
|--------|-----|
| `cms_media_public_read` | `public` — `SELECT` objects in `cms-media` (bucket is **public** for direct URLs). |
| `cms_media_editor_*` | `authenticated` **with** `cms_profiles.role` in `editor` / `admin` — insert/update/delete. |

Bucket: **50 MB** max per object; MIME allowlist: jpeg, png, webp, svg, gif, pdf.

Object paths should stay unguessable (UUID prefixes) for defense in depth.

## RLS (summary)

- **`anon`:** `SELECT` on `storefront_publication` only. Cannot read `anvl_drops` or drafts.
- **`authenticated`** with `cms_profiles`: `SELECT` drops/products as role allows; **`editor` / `admin`:** insert/update/delete drops and products; update publication layout/SEO.
- **`cms_publish_drop(uuid)`:** `SECURITY DEFINER` RPC; **`editor` / `admin` only**; demotes other active drops, writes snapshot + bumps `revision`.

## Edge Functions

| Function | I/O |
|----------|-----|
| `publish-storefront` | `POST` + `Authorization: Bearer <user JWT>`, body `{ dropId }`. Calls `cms_publish_drop`. |
| `medusa-webhook-stub` | `POST` with `x-anvl-medusa-secret` — placeholder for future Medusa sync (no orders/carts in CMS). |

Sources: [`supabase/functions/publish-storefront/index.ts`](../../supabase/functions/publish-storefront/index.ts), [`supabase/functions/medusa-webhook-stub/index.ts`](../../supabase/functions/medusa-webhook-stub/index.ts).

## Env vars

| Name | Where | Notes |
|------|-------|------|
| `VITE_SUPABASE_URL` | App | Project URL. |
| `VITE_SUPABASE_ANON_KEY` | App | Preferred name for anon / publishable key (safe in browser). |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | App | Alias supported by [`supabasePublicEnv.ts`](../../src/features/cms/api/supabasePublicEnv.ts). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server / CI / Edge only | Never `VITE_*`; never import into client bundles. |
| `ANVL_MEDUSA_WEBHOOK_SECRET` | **Dashboard → Project Settings → Edge Functions → Secrets** | Set for `medusa-webhook-stub` (header auth; function has **`verify_jwt` disabled**). |

**Project (ANVL):** `https://cptebkgyrfmokklwtrgp.supabase.co` (ref `cptebkgyrfmokklwtrgp`).

## App integration

- [`src/app/config/runtime.ts`](../../src/app/config/runtime.ts) — when Supabase env is set, **public** CMS reads (`getLandingCmsContent`, `getActiveDrop`, layout, SEO) and **`commerce`** use [`publicStorefrontPublication.ts`](../../src/features/cms/api/publicStorefrontPublication.ts) + [`commerceClient.supabase.ts`](../../src/features/products/api/commerceClient.supabase.ts). Admin list/mutations may still use local adapters until fully wired to Supabase.
- Compose pipeline unchanged: `composeLandingPageFromDrop(drop, layout)` after Zod parse.

## Ops checklist

1. Migrations applied on project **`cptebkgyrfmokklwtrgp`** (`anvl_cms_core`, `anvl_cms_storage`); Edge Functions **`publish-storefront`** (JWT on) and **`medusa-webhook-stub`** (JWT off) deployed.
2. In **Authentication**, create at least one user; with **SQL** (service role) or dashboard, insert `public.cms_profiles` (`user_id`, `role` = `admin` | `editor` | `viewer`).
3. Seed `anvl_drops.draft_body` and either call **`cms_publish_drop`** from the SQL editor (as that user, using the REST client with JWT) or use the **`publish-storefront`** function so **`storefront_publication.published_drop_snapshot`** is populated (until then the app falls back to seed snapshots).
4. In **Edge Function secrets**, set **`ANVL_MEDUSA_WEBHOOK_SECRET`** if you use the Medusa stub.
5. App `.env`: **`VITE_SUPABASE_URL`** and anon/publishable key from **Project Settings → API** (never commit service role).
