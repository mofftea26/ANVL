# CMS Architecture

> **Architecture transition (in progress).** The CMS is moving from a
> drop-builder / acts model to **code-owned landing pages** (see
> `docs/landing-pages.md`). The new model is live: the public home route renders
> the active page from the in-code registry, and the admin **Dashboard** picks
> which page is active (`cms_settings.active_landing_page_key`, mirrored onto
> `storefront_publication.active_landing_page_key`). The drop-builder + acts
> system below is **deprecated** and scheduled for removal — see
> `docs/cms-teardown-plan.md`.

## Overview

The ANVL CMS is split into two distinct surfaces with a clean publish-gate between them:

1. **Admin CMS** — `src/features/admin/` — full editor UI for internal use
2. **Storefront CMS reads** — `src/features/cms/` — read-only public-facing adapters

The storefront **never** reads from admin draft state. All storefront reads go through published snapshots.

---

## Data Flow

```
Admin browser
  └── edits drop draft (localStorage working copy)
        └── syncs to Supabase anvl_drops.draft_body (debounced write-through)

Admin publishes
  └── calls cms_publish_drop(drop_id) RPC
        ├── promotes drop to 'active' status
        ├── demotes previous active drop to 'inactive'
        └── writes published_drop_snapshot to storefront_publication

Storefront (SSR + browser)
  └── reads storefront_publication (anon-readable)
        ├── published_drop_snapshot → active drop + landing CMS content
        ├── website_layout → nav, footer
        └── site_seo → global SEO
```

---

## Supabase Schema

### Key Tables

#### `public.cms_profiles`
Links `auth.users` to a CMS role. Required for any CMS operation.

```sql
CREATE TABLE public.cms_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

Bootstrap via service role: `INSERT INTO cms_profiles (user_id, role) VALUES ('<user-id>', 'admin')`

#### `public.anvl_drops`
Canonical campaign drop rows.

```sql
CREATE TABLE public.anvl_drops (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'inactive', 'scheduled', 'archived')),
  draft_body jsonb NOT NULL,     -- editor source of truth
  published_body jsonb,          -- last published snapshot (nullable until first publish)
  release_date timestamptz,
  scheduled_activation_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
```

Only one row may be `status = 'active'` (enforced by partial unique index + publish RPC).

**Access:** CMS roles only (no anon).

#### `public.storefront_publication`
Singleton row (id=1). The only Supabase table readable by anonymous users.

```sql
CREATE TABLE public.storefront_publication (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  published_at timestamptz,
  revision bigint NOT NULL DEFAULT 0,
  active_drop_id uuid REFERENCES public.anvl_drops (id) ON DELETE SET NULL,
  website_layout jsonb NOT NULL DEFAULT '{}',
  published_drop_snapshot jsonb,   -- DEPRECATED — removed in teardown
  site_seo jsonb,
  published_manifest jsonb,        -- DEPRECATED — removed in teardown
  site_homepage jsonb,             -- added in later migration
  active_landing_page_key text     -- active code-owned landing page (new model)
);
```

**Access:** public SELECT (anon + authenticated), UPDATE only for editor/admin roles.

> `active_drop_id`, `published_drop_snapshot`, and `published_manifest` are
> drop-builder columns removed by `supabase/teardown/2026_drop_builder_teardown.sql`.

#### `public.cms_settings` (new model)
Singleton row (id=1). Public-readable simple CMS config — the storefront reads
the active landing page key + theme here.

```sql
CREATE TABLE public.cms_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  active_landing_page_key text NOT NULL DEFAULT 'the-oath',
  theme_config jsonb NOT NULL DEFAULT '{}',
  seo_config jsonb NOT NULL DEFAULT '{}',
  asset_config jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Access:** public SELECT; UPDATE for editor/admin roles.

#### `public.landing_pages` (new model)
Picker **metadata only** — page content lives in the code registry
(`src/features/landingPages/registry.ts`), never here.

```sql
CREATE TABLE public.landing_pages (
  id uuid PRIMARY KEY,
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  preview_image text NOT NULL DEFAULT '',
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
```

**Access:** public SELECT of available rows; admin manages metadata.

#### `public.cms_admin_products`
Editorial product catalog (until full commerce backend exists).

```sql
CREATE TABLE public.cms_admin_products (
  id uuid PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  body jsonb NOT NULL,
  medusa_product_id text,   -- nullable until Medusa sync
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
```

**Access:** CMS roles only (no anon).

#### `public.cms_media_assets`
Media library for uploaded assets (added in `20260620120000_cms_media_assets.sql`).

**Access:** CMS roles only (no anon).

### RLS Summary

| Table | anon | viewer | editor | admin |
|---|---|---|---|---|
| `cms_profiles` | — | SELECT own | SELECT own | SELECT own |
| `anvl_drops` | — | SELECT | SELECT + INSERT + UPDATE + DELETE | same |
| `storefront_publication` | SELECT | SELECT | SELECT + UPDATE | same |
| `cms_admin_products` | — | SELECT | SELECT + INSERT + UPDATE + DELETE | same |
| `cms_media_assets` | — | SELECT | SELECT + INSERT + UPDATE + DELETE | same |

### `cms_publish_drop(p_drop_id uuid)` RPC

Atomic publish operation:
1. Verifies caller has `editor` or `admin` role (from `cms_profiles`)
2. Demotes all currently `active` drops to `inactive`
3. Sets the target drop to `active`
4. Writes published snapshot to `storefront_publication.published_drop_snapshot`
5. Increments revision counter
6. Returns `{ revision, publishedAt, dropId }`

---

## Client Abstraction

### Interfaces (`src/app/config/clients.ts`)

```ts
interface CmsClient {
  getActiveDrop(): Promise<Drop | null>
  getLandingCmsContent(): Promise<LandingPageCmsContent>
  getHomepageContent(): Promise<HomePageContent>
  getAnnouncementBar(): Promise<...>
  getNavigation(): Promise<...>
  getAdminDropsList(): Promise<AdminDropListItem[]>
  // ... admin mutations
}
```

### Adapters

| Adapter | File | When used |
|---|---|---|
| Seed (server) | `cmsClient.seed.ts` | SSR without Supabase env |
| localStorage (browser) | `cmsClient.localStorage.ts` | Browser without Supabase env |
| Supabase (server + browser) | `supabaseStorefrontReaders.ts` | When `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` are set |

Wiring: `src/app/config/runtime.ts` — `createRuntimeClients({ isServer })` picks the right combination.

### Storefront Offline Fallback

If Supabase is configured but the request fails (network error, project paused):
- `storefrontReadFallback.ts` returns the local seed/localStorage data
- Ensures the storefront never shows a blank page

---

## localStorage Adapter Pattern

All `localStorage` adapters use `createJsonStore<TSchema>` from `src/shared/lib/storage/createJsonStore.ts`:

```ts
const store = createJsonStore({
  key: 'anvl:drops',
  schema: dropsSchema,
  defaults: defaultDrops,
  merge: (saved, defaults) => ({ ...defaults, ...saved })
})
```

This ensures:
- **Zod validation** before merging (prevents `__proto__` injection, type corruption)
- **Cross-tab sync** via `createLocalStorageChannel` events
- **Consistent migration** path via Zod transforms on the schema

Rules:
- Use `z.strict()` on persistence schemas
- Never spread raw `JSON.parse()` output directly into trusted state
- Never use `JSON.parse(...) as T` casts — always go through Zod

---

## Landing Page / Acts System

### Content Shape

```ts
type LandingPageCmsContent = {
  acts: LandingAct[]
  globalSettings: LandingGlobalSettings
  // ...
}

type LandingAct = {
  id: string
  nature: LandingActNature
  preset: string
  content: Record<string, unknown>  // preset-specific content
  isEnabled: boolean
  sortOrder: number
}
```

### Rendering Pipeline

```
Admin sets active drop
  └── Drop.landing contains ordered acts
        └── composeLandingPageFromDrop() → LandingPageCmsContent
              └── storefront_publication.published_drop_snapshot
                    └── root loader reads it
                          └── PublicLandingActs renders acts
                                └── resolveActPreset(nature, preset) → lazy component
```

### Act Natures

| Nature | Purpose | Default preset |
|---|---|---|
| `hero` | Page hero (full-viewport) | `cinematicScrollHero` |
| `manifesto` | Brand manifesto / tenets | `oathTenetLedger` |
| `storytelling` | Narrative scroll | `oathNarrativeScroll` |
| `dropReveal` | Drop reveal + countdown | `oathMonolithReveal` |
| `productShowcase` | Product grid/carousel | `oathEditorialThree` |
| `materialShowcase` | Fabric/material detail | `oathMaterialFlip` |
| `specialEvent` | Event countdown | `oathEventPulse` |
| `lookbook` | Photo lookbook | `masonryLookbook` |
| `finalCTA` | Closing call to action | `oathForgeClose` |

### Adding a New Act Preset

1. Create the component in the appropriate subfolder under `src/features/marketing/act-presets/<nature>/`
2. Export a named component with the `ActPresetProps` interface
3. Add an entry to `ENTRIES` in `src/features/marketing/act-presets/registry.ts`
4. Run `pnpm test` to confirm registry tests pass

---

## Admin Auth

### With Supabase env set

- Uses Supabase email+password auth
- Only users with `cms_profiles.role = 'admin'` may access `/admin`
- Browser client uses storage key `anvl.supabase.admin.v1`
- Auth flow: `src/features/admin/auth/adminSupabaseAuthFlow.ts`

### Without Supabase env (local/demo)

- Falls back to static env-file gate: `VITE_ANVL_ADMIN_USER` + `VITE_ANVL_ADMIN_PASSWORD`
- **This is not production-grade security** (credentials bundled in client)
- Do not refactor the auth model — it is a known temporary compromise until Phase J production hardening

### ProtectedAdminRoute

`src/features/admin/auth/ProtectedAdminRoute.tsx` — wraps admin routes and redirects to `/admin/login` if not authenticated.

---

## Write-Through Pattern (Supabase sync)

When Supabase is configured, admin saves write to:
1. **localStorage** (immediate local update, working copy)
2. **Supabase `anvl_drops.draft_body`** (debounced — typically 1–3s after edits stop)

Read-back: admin editor always reads from localStorage (fast). Supabase is the persistence layer, not the render source.

The `cmsWriteThrough.ts` module in `src/features/admin/cmsRemote/` orchestrates this flow.

---

## Edge Functions

### `publish-storefront`

Called when admin publishes a drop. Updates `storefront_publication` with the new drop snapshot.

### `process-scheduled-drops`

Run by pg_cron at regular intervals. Finds drops with `scheduled_activation_at <= now()` and activates them via `cms_publish_drop()`.

### `shopify-webhook`

Receives product update webhooks from Shopify and syncs product data to `cms_admin_products`.

---

## Security Checklist

- [ ] All writes to `anvl_drops` go through Zod validation
- [ ] `storefront_publication` is only updated via the `cms_publish_drop` RPC or service-role trusted paths
- [ ] CMS-driven `href`/`src` values pass through `sanitizeHref()` before DOM insertion
- [ ] `dangerouslySetInnerHTML` is limited to the drop palette `<style>` tag (via `sanitizeCssValue`) and JSON-LD (escaped)
- [ ] No `VITE_SUPABASE_SERVICE_ROLE_KEY` or similar secrets in client code
- [ ] New localStorage stores use `createJsonStore` with `z.strict()` schemas
