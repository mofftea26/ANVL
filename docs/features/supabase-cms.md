# Feature — Supabase ANVL CMS (MVP)

## Purpose

Supabase backs **published** storefront state so SSR, crawlers, and anonymous visitors see the same campaign as production — not an operator’s `localStorage` snapshot.

When **`VITE_SUPABASE_*`** is unset, local/demo admin (`VITE_ANVL_ADMIN_*`) and browser persistence remain. When Supabase is set, **`/admin/login`** uses Supabase Auth and only **`cms_profiles.role = admin`** may access the panel.

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
- **`cms_publish_drop(uuid)`:** `SECURITY DEFINER` RPC; **`admin` only**; demotes other active drops, writes snapshot + bumps `revision`. **`anon`** cannot execute (see migration **`20260519120000_revoke_anon_cms_publish_drop.sql`**).

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

- [`src/app/config/runtime.ts`](../../src/app/config/runtime.ts) — when Supabase env is set, **public** CMS reads (`getLandingCmsContent`, `getActiveDrop`, layout, SEO) and **`commerce`** use [`publicStorefrontPublication.ts`](../../src/features/cms/api/publicStorefrontPublication.ts) + [`commerceClient.supabase.ts`](../../src/features/products/api/commerceClient.supabase.ts).

### Admin (Supabase Auth + remote persistence)

When **`VITE_SUPABASE_*`** is configured:

1. **Sign-in:** `/admin/login` uses Supabase **`signInWithPassword`**. Only **`cms_profiles.role = 'admin'`** may use `/admin` (other roles are rejected).
2. **Hydration:** After sign-in (and on session restore), **`anvl_drops`**, **`cms_admin_products`**, and **`storefront_publication`** (`website_layout`, `site_seo`, `global_brand` when present) are **pulled into localStorage** so existing editor code is unchanged.
3. **Sync:** Local saves to drops, products, layout, site SEO, and global brand **schedule a debounced push** to Supabase (`client_drop_id` matches app `Drop.id`; products keyed by `slug`). Remote rows removed locally are deleted on the server. Vitest skips this path (`import.meta.env.MODE === 'test'`).
4. **Publish:** **Set active** in the drops list calls **`cms_publish_drop`** (after flush sync) so **`storefront_publication.published_drop_snapshot`** matches the activated campaign for anonymous SSR/CSR reads.

### Storefront read priority (with `VITE_SUPABASE_*` set)

1. **Published** `storefront_publication` row (SSR loaders + client TanStack Query).
2. **SSR loader data** from the first paint when the fetch is still in flight.
3. **Offline fallback** — same as the pre-Supabase storefront: seed on the server, local admin `localStorage` in the browser (`storefrontReadFallback.ts`, `useLandingCms`, `useHomeProducts`, `commerceClient.supabase`). Used when the network fails, the row has no `published_drop_snapshot`, or the home catalog snapshot is empty.

Without Supabase env, admin keeps the **`VITE_ANVL_ADMIN_*`** gate only (no remote sync).

Migration **`20260518220000_anvl_drops_client_id_admin_rls.sql`** adds **`anvl_drops.client_drop_id`**, ensures **`storefront_publication`** catalog columns exist (**`IF NOT EXISTS`**), replaces editor write policies with **admin-only** policies, and restricts **`cms_publish_drop`** to **admin**.

- Compose pipeline unchanged: `composeLandingPageFromDrop(drop, layout)` after Zod parse.

## Ops checklist

1. Migrations applied on project **`cptebkgyrfmokklwtrgp`** (including **`anvl_cms_core`**, **`anvl_cms_storage`**, **`20260518220000_anvl_drops_client_id_admin_rls`**); Edge Functions **`publish-storefront`** (JWT on) and **`medusa-webhook-stub`** (JWT off) deployed.
2. In **Authentication**, create at least one user; with **SQL** (service role) or dashboard, insert `public.cms_profiles` (`user_id`, **`role = 'admin'`** for anyone who should open `/admin`).
3. Seed `anvl_drops.draft_body` and either call **`cms_publish_drop`** from the SQL editor (as that user, using the REST client with JWT) or use the **`publish-storefront`** function so **`storefront_publication.published_drop_snapshot`** is populated (until then the app falls back to seed snapshots).
4. In **Edge Function secrets**, set **`ANVL_MEDUSA_WEBHOOK_SECRET`** if you use the Medusa stub.
5. App `.env`: **`VITE_SUPABASE_URL`** and anon/publishable key from **Project Settings → API** (never commit service role).
