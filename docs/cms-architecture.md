# CMS Architecture

The ANVL CMS is a **slim admin surface** over a code-owned storefront. Landing page content lives in the codebase (`src/features/landingPages/`); Supabase stores **which page is active**, **theme**, **fonts**, **asset slot assignments**, and the **media library**.

## Admin surfaces (5 + settings)

| Surface | Route | Persists to |
|---|---|---|
| Dashboard — Active drop | `/admin` | `cms_settings.active_landing_page_key` |
| Theme & Colors | `/admin/theme` | `cms_settings.theme_config` |
| Fonts | `/admin/fonts` | `cms_settings.font_config` |
| Assets | `/admin/assets` | `cms_settings.asset_config` + `cms_media_assets` |
| Story | `/admin/story` | `story_chapters` + `story_acts` + `story_cast` (+ `story-media` bucket) |
| Settings | `/admin/settings` | Session + local reset only |

Removed from CMS: Products editor, website layout, SEO, drop-builder, campaigns, lookbook, global brand.

> **Story is the one relational CMS surface.** Unlike the singleton-JSON config above, the saga is many rows across three tables with direct Supabase CRUD (editor-role RLS). It is **not** mirrored into `storefront_publication`; the storefront reads published rows directly via anon RLS (`is_published`).

---

## Data flow

```
Admin browser
  └── edits theme / fonts / assets / active drop (localStorage working copy)
        └── adminCmsRemoteSync → cms_settings + storefront_publication mirror

Storefront (SSR + browser)
  └── loadStorefrontProjection()
        ├── active_landing_page_key → resolveLandingPage (code registry)
        ├── theme_config + font_config → SiteThemeProvider (CSS vars on :root)
        ├── asset_config + media_index → resolvePublishedAssets → landing page props
        └── commerce → Shopify when configured, else seed/mock catalog
```

Nav, footer, and SEO use **code defaults** (`navigation.defaults.ts` → `staticWebsiteNavigation.ts`, `websiteLayout.defaults.ts`, per-route `head` meta) — not CMS-editable and not read from Supabase.

---

## Supabase schema

### Keep

#### `public.cms_profiles`
Admin auth roles (`viewer` | `editor` | `admin`). Required for CMS writes.

#### `public.cms_settings` (singleton, id=1)
Editor source of truth for site config:

```sql
active_landing_page_key text NOT NULL DEFAULT 'the-oath'
theme_config jsonb NOT NULL   -- { dataTheme, palette }
font_config jsonb NOT NULL    -- { sans, heading, display }
asset_config jsonb NOT NULL   -- { general: { slot: mediaId }, drops: { dropKey: { slot: mediaId } } }
updated_at timestamptz
```

#### `public.landing_pages`
Picker metadata only (key, name, description, preview_image, is_available). Content lives in the code registry; rows must intersect with registry keys.

#### `public.cms_media_assets`
Uploaded files for the media library and asset slot assignments.

#### `public.storefront_publication` (singleton, id=1)
Anon-readable mirror for a single SSR round-trip:

```sql
active_landing_page_key text
theme_config jsonb
font_config jsonb
asset_config jsonb
media_index jsonb          -- denormalized public URLs for assigned assets
revision bigint
published_at timestamptz
```

#### `public.storefront_profiles`
Customer accounts (unchanged; not CMS).

#### Story saga tables (`story_chapters` → `story_acts` → `story_cast`)
Relational content for the `/story` page. Each **chapter** is a drop; each chapter has ordered **acts**; **cast** are CMS-authored characters attached to a chapter (or a specific act).

```sql
story_chapters(id, slug UNIQUE, chapter_number, title, subtitle, description,
               cover_asset jsonb, cover_logo jsonb, cover_colors jsonb,
               sort_order, is_published)
story_acts(id, chapter_id FK→story_chapters, act_number, title, story,
           asset jsonb, sort_order)
story_cast(id, chapter_id FK, act_id FK→story_acts (nullable),
           name, rank, blurb, avatar_asset jsonb, sort_order)
```

Asset jsonb shape (validated by `storyAssetSchema`):
`{ kind: image|video|embed|none, mediaId, storagePath, url, alt, width, height, poster }`.
Uploaded media → `storagePath` in the `story-media` bucket; external players → `url` (kind `embed`).

**RLS:** anon SELECT only published rows (acts/cast gated on parent `is_published`); CMS roles read all; `editor`/`admin` write. Migration: `supabase/migrations/20260626120000_story_tables.sql`.

#### `story-media` storage bucket
Public bucket for story images + short video clips (mp4/webm/mov, 500 MB cap). Public read; `editor`/`admin` write — mirrors the `cms-media` policy set. Migration: `20260626120001_story_media_bucket.sql`.

### Dropped (2026-06-07 cleanup)

- Tables: `cms_admin_products`, `shopify_product_links`, `anvl_drops`
- `cms_settings.seo_config`
- `storefront_publication` columns: `website_layout`, `site_seo`, `products_snapshot`, `catalog_drop_index`, `global_brand`, `campaigns`, `lookbook`, `legacy_landing_cms`, `site_homepage`, `shopify_catalog_synced_at`, drop-builder columns

Migration: `supabase/migrations/20260607120000_cms_minimal_cleanup.sql`

---

## Code modules

| Concern | Location |
|---|---|
| Zod schemas + CSS var mappers | `src/features/cms/config/cmsSiteConfig.zod.ts` |
| localStorage + Supabase save | `src/features/cms/config/cmsSiteConfig.settings.ts` |
| Slim publication read/normalize | `src/features/cms/api/publicStorefrontPublication.ts` |
| Loader helper | `src/features/cms/api/loadStorefrontProjection.ts` |
| Remote sync (writes only slim fields) | `src/features/admin/cmsRemote/adminCmsRemoteSync.ts` |
| Theme/fonts on storefront | `src/app/providers/SiteThemeProvider.tsx` |
| Asset resolution | `src/features/cms/assets/resolvePublishedAssets.ts` |
| Per-drop asset slot registry | `src/features/landingPages/assetSlots.ts` |
| Landing page registry | `src/features/landingPages/registry.ts` |
| Active drop picker (Supabase + registry) | `src/features/admin/landing-picker/` |
| Story schemas (Zod, shared) | `src/features/story/schemas/story.schema.ts` |
| Story client (interface + seed/Supabase adapters) | `src/app/config/clients.ts` (`StoryClient`), `src/features/story/api/` |
| Story asset resolve + media URL | `src/features/story/lib/` |
| Story 3D shelf + book overlay | `src/features/story/components/` (`StoryShelf` → `StoryShelf3D`/`ChapterShelf` fallback; `ChapterBook` → `ChapterBook3D`/`ChapterBookFlat` fallback) |
| Shared 3D book primitives (Stripe-style) | `src/features/story/components/book3d/` (`StudioStage` IBL+shadows, `ClosedBook`, `BookCanvas`, `useBookTextures`) |
| Story admin editor + services | `src/features/admin/story/` |

---

## Asset slots

Slots are **defined in code** per drop. The CMS assigns media library IDs to slots; it cannot invent new slots without a deploy.

- **General slots** (`GENERAL_ASSET_SLOTS`): emblem fallback, loading emblem, shared textures
- **Per-drop slots** (`DROP_ASSET_SLOTS`): e.g. `the-oath` → hero media, drop logo, product images

`resolvePublishedAssets` merges `asset_config.general` + `asset_config.drops[activeKey]`, resolves IDs via `media_index`, and falls back to code defaults in each page's `*Assets.ts` file.

---

## Landing page sync workflow

When adding a new coded landing page:

1. Register in `src/features/landingPages/registry.ts`
2. Export asset slots in the page folder; add to `DROP_ASSET_SLOTS` in `assetSlots.ts`
3. Insert a matching row into `landing_pages` (key must match registry)
4. Picker lists `landing_pages` rows **intersected** with the registry (registry guards render; DB drives dropdown)

---

## Commerce

Products are **not** CMS-edited. `createCommerceClient` returns:

- **Shopify Storefront API** when `VITE_SHOPIFY_*` is set
- **Seed/mock catalog** otherwise (`products.mock.ts`)

---

## Admin auth

### With Supabase env
Supabase email+password; `cms_profiles.role` must be `editor` or `admin` for writes.

### Without Supabase (local/demo)
Static env gate: `VITE_ANVL_ADMIN_USER` + `VITE_ANVL_ADMIN_PASSWORD` (not production-grade).

---

## Edge functions

### `shopify-webhook`
Ack-only receiver; no longer writes product snapshots to `storefront_publication`.

---

## Security checklist

- [ ] All CMS JSON writes validated with Zod before Supabase upsert
- [ ] `storefront_publication` updated only via authenticated admin sync paths
- [ ] CMS-driven `href`/`src` pass through `sanitizeHref()` before DOM insertion
- [ ] No service-role keys in client code
- [ ] localStorage stores use `createJsonStore` with strict Zod schemas
