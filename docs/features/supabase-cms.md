# Feature — Supabase ANVL CMS (MVP)

## Purpose

Supabase backs **published** storefront state so SSR, crawlers, and anonymous visitors see the same campaign as production — not an operator’s `localStorage` snapshot.

Local/demo admin (`VITE_ANVL_ADMIN_*`) and browser persistence remain until app auth is wired to Supabase JWTs.

## Tables (public schema)

| Object | Role |
|--------|------|
| `storefront_publication` | Singleton row (`id = 1`): `published_drop_snapshot`, `website_layout`, `site_seo`, `revision`, `published_at`, `active_drop_id`. **Readable by `anon`** for storefront loaders. |
| `anvl_drops` | `draft_body` / `published_body` JSON (`Drop` shape, Zod-validated in app). **No `anon` access** — RLS + authenticated CMS roles only. |
| `cms_profiles` | `user_id` → `auth.users`, `role` in `viewer \| editor \| admin`. Bootstrap rows via service role. |
| `cms_admin_products` | Editorial catalog JSON + nullable `medusa_product_id` (no commerce truth here). |

Tracked DDL: [`supabase/migrations/20260518120000_anvl_cms_core.sql`](../../supabase/migrations/20260518120000_anvl_cms_core.sql).

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
| `ANVL_MEDUSA_WEBHOOK_SECRET` | `medusa-webhook-stub` | Shared secret for future webhook auth. |

## App integration

- [`src/app/config/runtime.ts`](../../src/app/config/runtime.ts) — when Supabase env is set, **public** CMS reads (`getLandingCmsContent`, `getActiveDrop`, layout, SEO) use [`publicStorefrontPublication.ts`](../../src/features/cms/api/publicStorefrontPublication.ts). Admin list/mutations still use existing local adapters until wired.
- Compose pipeline unchanged: `composeLandingPageFromDrop(drop, layout)` after Zod parse.

## Ops checklist

1. Apply migrations (Supabase CLI or SQL editor).
2. Create `cms_profiles` rows for CMS users (service role).
3. Insert/update `anvl_drops` and call `cms_publish_drop` or deploy `publish-storefront` and invoke with a real JWT.
4. Optional: configure Storage buckets (not in initial migration).
