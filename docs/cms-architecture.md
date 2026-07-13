# CMS Architecture

The ANVL CMS is a **slim admin surface** over a code-owned storefront. Landing page structure lives in the codebase (`src/features/landingPages/`); Supabase stores **which page is active**, **theme**, **fonts**, **asset slot assignments**, the **media library**, and per-scene **copy overrides** (`landing_content`) with code defaults filling every gap.

## Admin surfaces (7 + settings)

| Surface | Route | Persists to |
|---|---|---|
| Dashboard — Active drop | `/admin` | `cms_settings.active_landing_page_key` |
| Theme & Colors | `/admin/theme` | `cms_settings.theme_config` |
| Fonts | `/admin/fonts` | `cms_settings.font_config` |
| Assets | `/admin/assets` | `cms_settings.asset_config` + `cms_media_assets` |
| Landing Content | `/admin/content` | `cms_settings.landing_content` (per-landing-key copy blobs) + reads/writes `asset_config.drops` for non-tenet scene media |
| About Page | `/admin/about` | `cms_settings.landing_content.about` — hero + marquee copy and the **orbs array** (free-form sections with label/color/copy/lines/points/stats/CTAs/`mediaId`; add/edit/remove, The Oath tenets ownership contract). Anvil/hammer GLBs + page imagery assign on `/admin/assets` (`asset_config.pages.about`) |
| Coming Soon | `/admin/coming-soon` | `cms_settings.coming_soon` — site-mode `enabled` toggle + reveal-page copy, countdown (wall-clock + IANA timezone), CTAs, email-capture config, media-id asset refs, SEO/OG overrides |
| Passports | `/admin/passports` | `product_passports` — generate per-unit QR batches (product picker from the commerce catalog, manual quantity), claimed/unclaimed ledger with claimant snapshots, unassign/delete, printable QR sheet (see `docs/features/product-passport.md`) |
| Story | `/admin/story` | `story_chapters` + `story_acts` + `story_cast` (+ `story-media` bucket) |
| Settings | `/admin/settings` | Session + local reset only |

Removed from CMS: Products editor, website layout, SEO, drop-builder, campaigns, lookbook, global brand.

> **Story is the one relational CMS surface.** Unlike the singleton-JSON config above, the saga is many rows across three tables with direct Supabase CRUD (editor-role RLS). It is **not** mirrored into `storefront_publication`; the storefront reads published rows directly via anon RLS (`is_published`).

---

## Data flow

```
Admin browser
  └── edits theme / fonts / assets / landing content / active drop (localStorage working copy)
        └── adminCmsRemoteSync → cms_settings + storefront_publication mirror

Storefront (SSR + browser)
  └── loadStorefrontProjection()
        ├── active_landing_page_key → resolveLandingPage (code registry)
        ├── theme_config + font_config → SiteThemeProvider + SSR inline CSS on :root
        │     └── single global theme: theme_config.activeThemeId (no per-landing
        │         palette override). themeConfigToCssVars derives all --color-* /
        │         --hero-* / --particle-* vars for DOM, SSR first paint, and WebGL
        │         (readOathBrandColors reads the same vars)
        ├── asset_config + media_index → resolvePublishedAssets → landing page props
        ├── landing_content[activeKey] → page's content resolver (code defaults fill gaps)
        └── commerce → Shopify when configured, else seed/mock catalog
```

Nav, footer, and SEO use **code defaults** (`navigation.defaults.ts` → `staticWebsiteNavigation.ts`, `websiteLayout.defaults.ts`, per-route `head` meta) — not CMS-editable and not read from Supabase.

### Coming Soon site mode

`coming_soon` (jsonb on both singletons, mirroring `shop_config`) carries a master `enabled` boolean plus the reveal page's content. The gate lives in `src/routes/__root.tsx`'s `RootLayout`: when enabled, **every public route** renders the lazy `ComingSoonExperience` (`src/features/comingSoon/`) instead of `StorefrontLayout` — no redirects, HTTP 200 everywhere, `/admin/*` untouched. The SSR projection seeds the first paint; `useComingSoonConfig` then tracks the published row (30 s stale + refocus) so the CMS toggle propagates to open tabs. Admin preview bypass: `?anvl-preview=live` / `?anvl-preview=off` (sessionStorage, per tab). While gated, non-home public routes emit `robots: noindex, nofollow` and the home head swaps to the blob's SEO/OG fields. Early-access emails insert into `coming_soon_subscribers` (anon INSERT-only RLS; duplicate = friendly success). Blank content fields fall back to designed defaults (`resolveComingSoonContent`); bundled default imagery lives in `public/brand/coming-soon/`.

### localStorage keys (admin working copy)

| Key | Content |
|---|---|
| `anvl.activeLandingPage.v1` | Active landing page key |
| `anvl.themeConfig.v1` | Theme library + active theme |
| `anvl.fontConfig.v1` | Font families |
| `anvl.assetConfig.v1` | Asset slot assignments |
| `anvl.landingContent.v1` | Per-landing copy overrides |
| `anvl.shopConfig.v1` | Shop Experience config (`/admin/shop` → `shop_config`) |
| `anvl.comingSoon.v1` | Coming Soon site-mode config (`/admin/coming-soon` → `coming_soon`) |
| `anvl.supabase.admin.v1` | Supabase GoTrue session (auth only) |

### Remote sync timing

| Trigger | Path | Timing |
|---|---|---|
| Explicit Save (theme, fonts, assets, content) | `cmsWriteThrough` → `flushAdminCmsRemoteSync` | Immediate |
| Active drop change, media upload/alt/delete | `scheduleAdminCmsRemoteSync` | Debounced 850 ms |
| Login / session restore | `hydrateAdminCmsFromSupabase` | Pull remote → localStorage |

Hydration is gated by `beginAdminCmsRemoteHydration` / `endAdminCmsRemoteHydration` so push does not race pull. `AdminLayout` blocks editors until `isRemoteCmsReady`. On pull, `migrateOathTenetAssetsFromSlots` moves legacy tenet asset slots into `landing_content`.

### Landing Content ↔ Assets sync

`OathLandingAssetFields` on `/admin/content` writes the same `asset_config.drops['the-oath']` map as `/admin/assets`. Both editors subscribe to `subscribeCmsSiteConfigChange` for live cross-page sync. Tenet images use `landing_content['the-oath'].tenets.items[].mediaId` (up to 12 vows) via `MediaLibraryIdPickerModal` — not asset slots.

---

## Supabase schema

### Keep

#### `public.cms_profiles`
Admin auth roles (`viewer` | `editor` | `admin`). Required for CMS writes.

#### `public.cms_settings` (singleton, id=1)
Editor source of truth for site config:

```sql
active_landing_page_key text NOT NULL DEFAULT 'the-oath'
theme_config jsonb NOT NULL    -- { activeThemeId, themes[] }; each theme.palette is the normalized 15-token set (background/foreground/card(+fg)/muted(+fg)/border/primary(+fg)/accent(+fg)/ring/destructive/success/warning). Legacy palette keys are migrated on read (cmsSiteConfig.zod.ts) and normalized in place by migration 20260620140000.
font_config jsonb NOT NULL     -- { sans, heading, display }
asset_config jsonb NOT NULL    -- { general: { slot: mediaId }, drops: { dropKey: { slot: mediaId } }, pages: { pageKey: { slot: mediaId } } }
landing_content jsonb NOT NULL -- { [landingKey]: { ...page-shaped copy overrides } }
updated_at timestamptz
```

`landing_content` is validated client-side by each page's own Zod schema
(`oathContent.schema.ts`); blank/missing fields fall back to designed code
defaults at render (`resolveOathContent`). The single Drop 01 page (The Oath)
stores its copy under key `the-oath`.

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
landing_content jsonb      -- published mirror of cms_settings.landing_content
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

## Admin layout shell

Every admin route renders inside `AdminLayout` (topbar + drawer nav + scrollable
content). On large/ultra-wide screens the content uses a shared **workspace
shell** so the side space is filled intentionally instead of leaving a narrow
column floating in empty margins.

| Primitive | Location | Role |
|---|---|---|
| `AdminLayout` (`layout="workspace"`) | `src/features/admin/components/AdminLayout.tsx` | Widens the content container to `max-w-[110rem]` (`120rem` at `2xl`). |
| `AdminWorkspace` | `src/features/admin/components/AdminWorkspace.tsx` | Two-zone shell: primary editing column + optional sticky contextual rail. |
| `AdminRailPanel` | `src/features/admin/components/AdminRailPanel.tsx` | Titled rail section (icon + `<h2>` + body). |
| `AdminWorkspaceStatusPanel` | `src/features/admin/components/AdminWorkspaceStatusPanel.tsx` | Shared rail panel: Supabase-vs-local target + storefront link. |

**Responsive behavior:** the rail docks beside the primary column only on
`≥1280px` (`xl`) and widens at `≥1536px` (`2xl`). Below `xl` the layout collapses
to a single column with the rail content stacked underneath (nothing is lost),
matching the existing mobile drawer-nav behavior. The rail is an `<aside>`
(`complementary`) landmark with an accessible label.

**Per-page rail content** (each page opts into the same primitive):

| Page | Primary column | Side rail |
|---|---|---|
| Dashboard | Active-page picker + tiles | Workspace status + quick help |
| Theme | Palette fields | Live component preview (desktop/mobile) + WCAG contrast report |
| Fonts | Upload / Google / role selects | Type preview + role→CSS-var help |
| Landing Content | Per-scene copy fields + flexible tenets (add/remove, per-vow image pick) + non-tenet asset slot pickers | Overrides help + scene list + status |
| Assets | Media library (upload, browse, filter) | Slot assignment controls (scope picker + per-slot media map) |
| Story | Chapters list + chapter detail | Saga model + publishing help |
| Settings | Session + danger zone | Workspace status + about |

Pages register their save action in the topbar via `AdminPageActionsContext`
(unchanged); the workspace shell only governs the primary/rail arrangement.

## Asset slots

Slots are **defined in code** per drop. The CMS assigns media library IDs to slots; it cannot invent new slots without a deploy.

- **General slots** (`GENERAL_ASSET_SLOTS`): emblem fallback, loading emblem, shared textures
- **Per-drop slots** (`DROP_ASSET_SLOTS`): e.g. `the-oath` → hero media, drop logo, product images. The hero `heroMediaMode` select offers **`products` (default pick) / `video` / `image`** — `products` takes the **hero product renders** (`heroProductImage1..3`, `kind: 'image'`, single front view on a **transparent background**), pixel-samples each render's silhouette into the ember particle cloud, then resolves the **actual render** in place once the embers settle (click dissolves it back into embers and re-forges the next; mobile/reduced-motion fall back to poster → hero image → piece render). With no explicit mode, assigned product renders imply `products`. **Tenet images are not slots** — they live in `landing_content['the-oath'].tenets.items[].mediaId`.
- **Page slots** (`asset_config.pages`): non-landing storefront pages (e.g. shop hero backdrop). `about` is the richest example — hero backdrop, the **anvil + hammer 3D models (GLB)** for the desktop Forge Altar stage, philosophy backdrop, materials/construction/testing images (mobile section cards + desktop strike modals), and a finale backdrop (`src/features/cms/assets/storefrontPageSlots.ts`). The GLB slots fall back to bundled defaults in `public/about/`, so the altar works before any upload; About also opts out of the shared `pageBackground` slot (`noPageBackground` — it paints its own fixed void).

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
- **Sign-in:** Supabase email + password via `/admin/login`
- **Panel access (`/admin`):** `cms_profiles.role` must be **`admin`** only — editors and viewers are rejected at login
- **CMS writes (DB RLS):** `editor` or `admin` may upsert `cms_settings`, `cms_media_assets`, and story tables
- Session storage key: `anvl.supabase.admin.v1`

### Without Supabase (local/demo)
Static env gate: `VITE_ANVL_ADMIN_USERNAME` + `VITE_ANVL_ADMIN_PASSWORD` (not production-grade). localStorage only; no remote sync.

---

## Edge functions (in repo)

| Function | Purpose |
|---|---|
| `shopify-webhook` | Verifies Shopify HMAC; ack-only — no DB writes |
| `medusa-webhook-stub` | Validates `x-anvl-medusa-secret`; placeholder for future Medusa sync |

> **Removed:** `publish-storefront` and `process-scheduled-drops` Edge Functions. Admin sync writes directly to `cms_settings` + `storefront_publication` via `adminCmsRemoteSync`. See `docs/technical-debt.md` (MIG-01) for orphaned publish RPC migrations still in the migration history.

---

## Security checklist

- [ ] All CMS JSON writes validated with Zod before Supabase upsert
- [ ] `storefront_publication` updated only via authenticated admin sync paths
- [ ] CMS-driven `href`/`src` pass through `sanitizeHref()` before DOM insertion
- [ ] No service-role keys in client code
- [ ] localStorage stores use `createJsonStore` with strict Zod schemas
