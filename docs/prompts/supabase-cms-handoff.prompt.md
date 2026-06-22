# Handoff prompt: Supabase for ANVL CMS + storefront

> **Note (2026-06-22):** Verify all schema/sync steps against current [`docs/features/supabase-cms.md`](../features/supabase-cms.md) and [`docs/cms-architecture.md`](../cms-architecture.md). Drop-builder tables/RPCs (`anvl_drops`, `cms_publish_drop`) are removed; sync is `adminCmsRemoteSync` → `cms_settings` + `storefront_publication`.

Copy everything below the line into another agent chat that has **Supabase MCP** and access to this repository.

---

You are implementing Supabase as the persistence + auth backbone for ANVL Athletics (TanStack Start + React 19).

## MCP / tooling

- Use **Supabase MCP** for inspecting/creating schemas, migrations, RLS policies, Edge Functions metadata, Storage buckets, and Auth configuration.
- Prefer **tracked SQL migrations** (Supabase CLI conventions) validated via MCP where possible.
- **Never** expose `SUPABASE_SERVICE_ROLE_KEY` or database passwords to the browser bundle.

## Read these project sources first (ANVL repo)

**Architecture**

- `docs/backend-medusa-roadmap.md` — Two domains: ANVL CMS vs **Medusa v2 later** (cart, checkout, payments, inventory).
- `docs/features/drops-cms.md` — Drop lifecycle, active drop, storefront behavior.

**SSR vs browser (integration pivot)**

- `src/app/config/runtime.ts` — Today: server uses **`seedCmsClient`**; browser uses **`localStorageCmsClient`**.
- `src/features/cms/runtime/storefrontCmsSync.ts` — `resolveStorefrontActiveDrop()`, `resolveStorefrontWebsiteLayout()`, `getResolvedStorefrontLandingCmsSync()` (`SEED_*` on SSR).

**Persisted CMS state today**

- `src/features/admin/drops/drops.service.ts`, `drops.storage.ts`, `drops.persistence.zod.ts`
- `src/features/admin/storageKeys.ts` — `ANVL_DROPS`, `ANVL_ACTIVE_DROP_ID`, `ANVL_PRODUCTS`, `ANVL_WEBSITE_LAYOUT`, legacy landing + site SEO keys.

**Adapters**

- `src/features/cms/api/cmsClient.localStorage.ts`

**Contracts**

- `src/shared/api/contracts/cms.contract.ts` — intended REST/DTO shapes for `/api/cms` style endpoints.

**Loaders / theme**

- `src/routes/__root.tsx`, `src/routes/index.tsx`, `src/routes/drop/$slug.tsx`
- `src/app/providers/ActiveDropThemeProvider.tsx`

**Canonical types**

- `src/features/drops/drop.types.ts`

## Product goal

Publishing from the CMS must change the **live storefront for every visitor**, including **SSR/HTML and crawlers** — not only the operator’s browser `localStorage`.

## Medusa + payments later (non-negotiable constraints)

- **No** carts, orders, tax, PSP webhooks as source-of-truth in CMS tables.
- CMS stores **campaign content** + **opaque product ids** (`medusa_product_id` nullable on admin product rows until sync exists).
- Plan for Medusa → ANVL **webhooks/read models** separately from narrative CMS.

## Supabase schema (MVP suggestion)

Implement with MCP-guided DDL/migrations:

1. **Published storefront state** — table or revision row: `published_at`, **`active_drop_id`**, **`website_layout` jsonb** (and optionally denormalized `published_manifest jsonb` for cheap reads).

2. **`drops`** — `id`, unique `slug`, `status`, timestamps, schedule fields; **`body jsonb`** = full Drop (validated server-side vs `drops.persistence.zod.ts` parity). Enforce **at most one `active`** row per site/env.

3. **Draft vs published** — clear split so **anon cannot read drafts** (views, RPC, or narrowed columns).

4. **`admin_products`** (until Medusa) — fields needed for storefront tiles + **`medusa_product_id` nullable**.

5. **SEO** — in-drop json initially or polymorphic `seo_documents` per roadmap.

6. **Storage** — bucket for uploads; anon read only where appropriate.

## Auth model

- **Customers** (later): Supabase Auth optional; reconcile with roadmap (Medusa customer). Keep MVP thin if storefront accounts are deferred.
- **CMS admins**: `auth.users` + `profiles`/roles (`viewer | editor | admin`). **Publish / set-active** guarded by admin role or Edge Function with service role + JWT verification.

Phase note: Repo still ships `VITE_ANVL_ADMIN_*` demo gate; Supabase-backed admin auth replaces it in application code separately — scaffold DB/policies for real JWT admins now.

## RLS

- `anon`: **published read-only** storefront projection (no draft fields).
- `authenticated` admin: draft CRUD as appropriate.

## Edge Functions (suggestions)

1. **`publish-storefront`** — atomic publish + bump revision + optionally CDN-oriented response.
2. **Medusa webhook stub** (auth via secret header) — future inventory/price sync into read model referenced by storefront.

Document request/response for TanStack **`createServerFn`** integration.

## App integration handoff

The TanStack app will need a **server-path** CMS client replacing `seedCmsClient`, reading the same payloads `composeLandingPageFromDrop(drop, layout)` expects. Record:

- Exact table/view/RPC names
- Example anon `select` used by loaders
- Example admin JWT flow for edits

## Acceptance checklist

- [ ] Anonymous SSR can fetch **published** active drop + layout (no drafts).
- [ ] Admin JWT can draft, publish, set active; unrelated browsers see updates.
- [ ] DB enforces single active drop.
- [ ] RLS audited for leakage.
- [ ] Medusa placeholders (`medusa_product_id`) documented.

Deliverable from you: migrations SQL, RLS policy summary, Edge Function list, env vars, and example RPC/queries aligned with existing TypeScript contracts.
