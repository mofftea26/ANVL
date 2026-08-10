# CMS Architecture

The ANVL CMS is a **slim admin surface** over a code-owned storefront. Landing page structure lives in the codebase (`src/features/landingPages/`); Supabase stores **which page is active**, **theme**, **fonts**, **asset slot assignments**, the **media library**, and per-scene **copy overrides** (`landing_content`) with code defaults filling every gap.

## Admin surfaces (17 total)

Rebuilt 2026-07-29 from `src/features/admin/components/adminNav.ts` (the single IA source — 17 nav items across the `Dashboard/Design/Content/Commerce/Passports/Gamification/Media/Settings` categories), Settings included, cross-checked against `src/routes/admin/`:

| Surface | Route | Persists to |
|---|---|---|
| Dashboard — Active drop | `/admin` | `cms_settings.active_landing_page_key` |
| Theme & Colors | `/admin/theme` | `cms_settings.theme_config` |
| Fonts | `/admin/fonts` | `cms_settings.font_config` |
| Landing Content | `/admin/content` | `cms_settings.landing_content` (per-landing-key copy blobs) + reads/writes `asset_config.drops` for non-tenet scene media |
| About Page | `/admin/about` | `cms_settings.landing_content.about` — hero + marquee copy and the **orbs array** (free-form sections with label/color/copy/lines/points/stats/CTAs/`mediaId`; add/edit/remove, The Oath tenets ownership contract). Anvil/hammer GLBs + page imagery assign on `/admin/assets` (`asset_config.pages.about`) |
| Story | `/admin/story` | `story_chapters` + `story_acts` + `story_cast` (+ `story-media` bucket) |
| Coming Soon | `/admin/coming-soon` | `cms_settings.coming_soon` — site-mode `enabled` toggle + reveal-page copy, countdown (wall-clock + IANA timezone), CTAs, email-capture config, media-id asset refs, SEO/OG overrides |
| Legal | `/admin/legal` | `cms_settings.legal_content` — tabbed privacy/terms/cookies/accessibility: title, updated-date, intro, reorderable sections |
| Support | `/admin/support` | `cms_settings.support_content` — tabbed: FAQ, contact, shipping, returns, care guide, size guide, **Measurements** (`sizeGuide.measure` — per-garment-type reorderable measurement points), **Care symbols** (`careGuide.legend` — the 26 care-symbol `{label, meaning}` overrides). See "Support pages" below |
| Shop Experience | `/admin/shop` | `cms_settings.shop_config` — shop layout, product cards, filters, sort, toggles, state copy **and** the PDP section toggles + related count + animation (`shop_config.pdp`) |
| Products | `/admin/products` | `cms_settings.pdp_content` — per-product PDP editorial content (bento story/material/care/details copy + editorial assets), keyed by slug; commerce data stays on the product |
| Techpacks | `/admin/techpacks` | `public.techpacks` + `public.techpack_images` (relational, no jsonb blob) — ingest supplier PDFs parsed client-side, review extracted images, promote approved ones into `cms_media_assets` |
| Passports | `/admin/passports` | `product_passports` (QR codes tab) — generate per-unit QR batches (product picker from the commerce catalog, manual quantity), claimed/unclaimed ledger with claimant snapshots, unassign/delete, printable QR sheet; `cms_settings.passport_content` (Passport content tab) — per-product editorial sections authored in a multi-step wizard (see `docs/features/product-passport.md`) |
| Gamification | `/admin/gamification` | `gamification_settings` + `gamification_ranks` + `gamification_rank_levels` + `gamification_challenges` + `gamification_badges` — the Armory's rules (Forge XP constants + curve, rank copy/emblem/thresholds, challenges + badges as declarative metric+target). Relational CRUD like Story; seeded == code defaults. Since `20260720120000_gamification_rank_keys.sql` rank KEYS are admin-managed (create/delete/reorder — the seed-keys CHECK is dropped; levels cascade on delete); non-seed ranks fall back to `/brand/mark.svg` until an emblem is assigned, and `deriveArmoryRank`/`buildRankLadder` are rank-count-agnostic |
| Assets | `/admin/assets` | `cms_settings.asset_config` + `cms_media_assets` |
| Analytics & SEO | `/admin/analytics` | `cms_settings.site_seo` — analytics/marketing tags (GA4, GTM, Meta Pixel, Hotjar, Google site verification, custom script), search-engine visibility (robots/sitemap), global SEO defaults; injected storefront-wide by `MarketingToolsHead` |
| Settings | `/admin/settings` | Session + local reset only |

> `/admin/category/$categoryKey` is a category landing page (nav-only grouping derived from `adminNav.ts`), not an additional editable surface. The dashboard's banner control (`BannerCustomizeModal`, `banner_config`) is a modal reached from `/admin`, not its own route.

Removed from CMS: website layout, drop-builder, campaigns, lookbook, global brand.

## The ANVL Studio identity (admin's own design)

The CMS does **not** wear the storefront theme. `/admin/*` applies a fixed, code-owned "**ANVL Studio**" identity (`src/features/admin/theme/adminStudioTheme.ts` + `AdminThemeProvider` in the root layout's admin branch): a dark graphite "forge control room" — warmer and one step lighter than the storefront's near-black (`background #15171A`), bone text, molten-copper actions (`--color-accent #D96C2C`), ember-bronze highlight, drafting-grid texture behind the workspace, plate-style active nav states, and a copper-hairline command bar. Built through `themeConfigToCssVars` (the same derivation the storefront uses) so every shared component/portal re-skins with zero per-component work; navigating back to the storefront remounts `SiteThemeProvider`, which rewrites the same var vocabulary. The storefront palette appears inside the admin only in the theme editor's scoped preview.

## Banner activator (`banner_config`, 2026-07-19)

A CMS-controlled announcement banner rendered ABOVE the storefront topbar. The blob mirrors `coming_soon` end-to-end: strict Zod schema (`src/features/cms/banner/bannerConfig.zod.ts` — enabled, message, optional href/linkLabel/imageMediaId, colors with theme fallback, optional `schedule{startAt,endAt}`), localStorage working copy `anvl.bannerConfig.v1`, `banner_config` in `CmsSettingsFieldKey`, tolerant hydration, publication projection (`bannerConfig`, with a missing-column select fallback for pre-migration DBs), and a live-preview draft slice. Visibility = `isBannerLive(config, now)`: enabled AND within the optional schedule window (schedule optional — manual toggle alone works). Storefront `SiteBannerRail` renders in normal flow before `<PremiumNav>` (SSR-correct first paint, no jump), sticky, measures itself into `--anvl-banner-h` so the fixed nav shifts below; schedule re-evaluated every 60s client-side. Migration: `20260719120000_banner_config.sql`.

**2026-07-22 rework:** the banner is edited ONLY from the dashboard's drop-status modal — flipping its Banner switch ON opens `BannerCustomizeModal` (lazy; every former editor field + a live mini-preview rendering the shared `BannerStrip`, explicit Save, dirty guard); turning OFF stays a quick toggle; the standalone `/admin/banner` page + nav item were deleted. The blob gained `colors.background2` + `colors.gradientAngle` (solid-or-gradient background) and `animation` (`none | marquee | shimmer | pulse | gradient-shift` — pure-CSS idle animations, all disabled under `prefers-reduced-motion`; the marquee's loop twin is `aria-hidden` so AT reads the message once). `BannerStrip` is the single visual component shared by the storefront rail and the modal preview.

## Support pages (`support_content`, size/care guides, 2026-07-28)

`cms_settings.support_content` / `storefront_publication.support_content` (jsonb, mirrors `banner_config`'s flow) back `/faq`, `/contact`, `/shipping`, `/returns`, `/care-guide`, and `/size-guide`. The blob's Zod schema is split into an acyclic module family (`src/features/cms/support/`): `supportContent.shared.zod.ts` (FAQ/contact primitives), `supportContent.care.zod.ts`, `supportContent.size.zod.ts`, composed by `supportContent.zod.ts`. `resolveSupportContent.ts` merges the CMS blob over `SUPPORT_CONTENT_DEFAULTS` (`supportContent.defaults.ts`) per field — blank CMS field = designed default, per CMS rule 5.

Two blocks were added in this pass, both editable from two new `/admin/support` tabs:

- **`careGuide.legend`** (tab: **Care symbols**) — overrides-only, keyed by the 26 `CareIconKey` values in `CARE_SYMBOL_CATEGORIES` (`{ heading, intro, entries: { [iconKey]: { label, meaning } } }`). A key absent from the map uses the code-default `{label, meaning}` entirely; a present-but-blank field falls back per field (`resolveCareLegend`). Legacy decorative `CareIconKey` aliases (`washing-machine`, `droplet`, etc., kept for backward compat on per-product `careGuide.perProduct[slug].items[].icon`) are never legend members — only the 26 standard textile-care keys are.
- **`sizeGuide.measure`** (tab: **Measurements**) — the "Where we measure" copy: `{ heading, intro, footnote, garmentTypes: [{ key, label, points: [{ key, letter, label, description }] }] }`, one entry per `GarmentTypeKey` (`tee | stringer | hoodie | joggers | shorts`). Point **keys** and the schematic's anchor geometry are code-owned (`supportContent.defaults.ts` + `src/features/support/components/garments/`); the CMS can only edit a point's copy (`letter`/`label`/`description`) and its **display order** — `MeasurementsField`'s drag-reorder is real, honored at resolve time by `resolveMeasurePoints`/`resolveGarmentPoints` (CMS array order wins; any of that garment type's points the CMS array omits are appended in the code-default order after). A point's `letter` travels with it when reordered — reordering never re-labels a point.

`careGuide.updatedAt` and `sizeGuide.updatedAt` (ISO `YYYY-MM-DD`, blank → the code-owned default stamp) drive each guide page's "Last updated" line; both fields are editable in their respective `/admin/support` tabs (added alongside the Measurements/Care symbols tabs — previously the schema field existed with no editor control, so the stamp could only ever go stale).

**Per-product `garmentType`** (`sizeGuide.perProduct[<slug>].garmentType`, one of the 5 `GarmentTypeKey`s, optional — absent/invalid falls back to `tee`) selects which garment type's point set a product's size table renders against. `resolveGarmentTypeKeys()` (`src/features/support/lib/garmentTypes.ts`) collects every distinct `garmentType` actually used across `sizeGuide.perProduct`, always including `tee` (the universal fallback), and that set is what `/size-guide`'s `MeasureExplorer` renders as its garment-type tab strip — a tab only appears when at least one real product uses it. The PDP's compact care/size legend (`PdpSupportDetails.tsx`) reads the same per-product `garmentType`. Authored per real commerce product slug in `/admin/support`'s Measurements tab (`PerProductSizeField`) — see `supabase/seeds/2026-07-28-support-guides-seed.sql` for the proposed seed values.

## Dashboard + setup wizards (2026-07-19)

`/admin` is a one-screen control room (≥1280px no-scroll): status strip (active drop, Coming Soon warning, storefront link), a dense all-surfaces category launcher, and six guided **setup wizards** (`src/features/admin/setup/`, built on the generic `AdminWizard` modal): Drop, Products, Story, About, Passports, Gamification. Wizard steps show live done/todo pills derived from the same localStorage working copies the editors write (`useSetupStatus`) and deep-link into the exact editor (`/admin/assets?page=&slot=`, `/admin/passports?tab=&product=`); only the Drop wizard carries an inline control (active-landing select + explicit Activate).

**Wizard dirty guard + docked preview (2026-07-22):**
- **Unsaved-changes guard (D6):** every `useSetupBlobStep` working copy registers `{dirty, save}` into a wizard-scoped registry (`components/wizard/wizardDirty.tsx`); `AdminWizard` intercepts close AND step changes while dirty with an `AdminChoiceDialog` (Save — runs the active step's save, proceeds only on success — / Discard / Continue editing). The aggregate is mirrored into `useRegisterAdminDirty('setup-wizard', …)` so route navigation and tab close are covered by the layout guard too. `PassportContentWizard` (draft-based) is unaffected — the guard props are optional.
- **Docked per-step live preview (≥1280px):** setup wizards render as a LEFT-DOCKED full-height sheet (focus trap + Escape, no viewport backdrop) so the shell's `AdminPreviewPanel` stays visible/interactive beside them. Opening a wizard (and each step change) auto-opens the panel via `openAdminPreview()` (a target-less emission on the focus channel the shell already subscribes to), points it at the step's `preview.route` via `requestPreviewRoute()` (panel consumes pending routes; same-route requests never remount the iframe), and pushes the step's `preview.target` highlight. Step working copies mirror UNSAVED edits into the preview draft channel via `setupPreviewBinding(field, map)` on `useSetupBlobStep` (About/Oath slices merge into the `landingContent` envelope; assets/support/legal/pdp/passport push their blob shapes). Below `xl` the centered modal (no preview signals) is kept.

## Admin shell + IA (2026-07-18 rework)

- **Mount chain:** `__root.tsx` → **`AdminRootShell`** (lazy) → `AdminLayout` → `AdminShell`. The lazy boundary is load-bearing, not cosmetic: `__root.tsx` renders on every storefront route, so importing `AdminAuthProvider`/`AdminThemeProvider` statically put the admin auth stack — and, through it, `adminCmsRemoteSync` — into the storefront's static import graph (F-06, fixed 2026-08-04). Keep the admin branch behind that boundary; adding a direct admin import to `__root.tsx` silently reintroduces the leak.
- **Sidebar links use `preload="intent"`.** Every editor is a `lazyRouteComponent`, so hovering fetches its 19–74 kB chunk instead of waiting for the click. This was briefly `false` on the reasoning that there is "no useful data to preload" — which conflates loader data with the route module. The hover cost it guarded against (re-running the `/admin` `beforeLoad` chain) is absorbed by `getCachedAdminSession`'s 45 s cache.
- **Persistent categorized sidebar** ≥1024px (collapsible to an icon rail; preference in `anvl.adminSidebar.v1`), drawer below `lg`. Categories — Dashboard · Design (theme, fonts) · Content (landing, about, story, coming-soon) · Commerce (shop, products) · Passports · Gamification · Media (assets) · Settings — are **nav-only**: `/admin/*` URLs are flat and unchanged. `adminNav.ts` is the single IA source (sidebar, breadcrumbs, dashboard cards all derive from it).
- **Cross-navigation:** `/admin/assets` accepts `?page=<scope>&slot=<key>&q=<search>` (opens the slot panel scoped + highlights the slot + seeds the library search); `/admin/passports` accepts `?tab=content&product=<slug>` (opens that product's wizard). The PDP editor links to its product's passport content.
- **Speed affordances:** generic `AdminWizard` (extracted from the passport content wizard); native HTML5 drag-reorder via `useSortableList` (About orbs, Oath showcase products, story acts, gamification challenges — always with keyboard up/down fallback); media library cards drag onto any `MediaLibrarySlotField` / slot-panel row to assign; the upload naming modal's slot select has a "Custom name…" option (kebab-forced) for every context; the dashboard carries a drop-setup checklist with live completion ticks.

#### a11y: one `<main>` landmark + skip link

`AdminRootShell` used to render its own `<main>` around `AdminShell`'s — two "main" landmarks on every admin page, which leaves a screen reader no unambiguous jump target. The outer one is now a plain `<div>` (it carried no styling); `AdminShell`'s is the single landmark, id `ADMIN_MAIN_ID` (`adminMainId.ts`, its own module so the skip link and its target cannot drift). A skip link sits before the ~20-link sidebar, suppressed on `/admin/login` — that page renders bare, so there would be nothing to skip to.

## Theme presets and the contrast gate

`finalizeThemePalette` (`themeLibrary.ts`) is **fill-only**: `if (!provided('accentForeground')) p.accentForeground = bestForeground(p.accent)`. An explicitly-present foreground therefore **suppresses** the WCAG gate. That is deliberate — an author who sets a colour keeps it — but it means anything *seeding* a palette must omit the derived foregrounds or the gate never runs.

`createThemePreset()` used to seed straight from `DEFAULT_THEME_PALETTE` / `DEFAULT_BONE_LIGHT_PALETTE`, both of which spell `accentForeground` out literally, so every admin-created theme inherited it unchecked — which is how a preset carrying white on `#c2703d` (3.70:1) reached the live theme library. Since 2026-08-05 the seed **deletes `accentForeground` and `primaryForeground`** so the gate chooses them, matching what the house presets in `themePresets.ts` already relied on.

Two things to keep in mind when touching this:
- `bestForeground()` only inspects the **flat** accent. The primary button paints a gradient whose top is `mix(accent, white, .24)` (`--color-highlight-bright`), and that stop can fail while the flat colour passes — bone-light did, at 3.64:1 against 5.97:1. `themeContrast.test.ts` asserts **both** stops for that reason.
- The 15 palette tokens are CMS-editable, so the shipped defaults are a floor, not a guarantee. The live published theme wins over them.

## Upload encoding + advice

CMS media is served as the **stored original**: `publicCmsMediaUrl()` builds an `/object/public/` Storage URL, and Supabase image transformation is a **Pro-plan** feature this project does not have (verified: `/render/image/…` returns `403 FeatureNotEnabled`). There is no resizing layer on the read path, so whatever is *stored* is exactly what every visitor downloads.

Because the read path cannot enforce a budget, the **write** path does. `encodeUploadImage()` (`features/admin/media/encodeUploadImage.ts`) re-encodes every image upload before anything derives a path, MIME or size from it — capped at **2048 px** on the longest edge, **WebP quality 0.9**. Both upload surfaces call it: the media library (`mediaAssets.service.ts`) and story media (`storyMedia.service.ts`).

It is deliberately conservative, because it runs on assets an operator may not be able to re-source. It never returns a file larger than the original, never throws (any decode/encode failure uploads the original unchanged, so a browser without `createImageBitmap` or canvas WebP behaves exactly as before), and passes through **SVG** (vector), **GIF** (may be animated — canvas keeps only frame one), **AVIF** (already smaller than our output) and anything under 150 KB.

**Alpha is load-bearing, so the target format is not negotiable.** The Oath hero samples real pixels to build its particle silhouette and gates on fully-opaque pixels (`shared/webgl/particleShapes.ts`). JPEG has no alpha — a JPEG cutout would flatten to a rectangle and the forge would emit a block of embers instead of a garment. Quality is set high for the same reason: lossy alpha frays the cutout edge, shifting which pixels pass that gate.

Assets that predate this step are cleaned up by `scripts/backfill-cms-image-sizes.mjs` (see `docs/project-map.md`). Alongside the encode, the naming modal still shows a per-file size/format note (`mediaUploadAdvice.ts`) — advisory only, it never blocks an upload.

Thresholds live in one module and are pinned by test, **including the silence**: a warning on every file is a warning on none. SVGs are exempt (size heuristics do not apply to vectors), `.glb` is matched by extension when the browser sends no MIME type, and the GLB note points at `scripts/compress-glb-textures.mjs` — because GLB weight is almost always embedded textures, not geometry.

## Media library grid

`MediaAssetGrid` virtualises above 100 assets. The virtualiser slices the asset list into rows of N and positions rows absolutely, so **N must equal the column count the CSS grid is actually rendering** (`grid gap-3 sm:grid-cols-2 lg:grid-cols-3` → 1 / 2 / 3). It was hardcoded to 3, so below `lg` rows overlapped and most of the library became unreachable on a laptop, tablet or phone. `useResponsiveGridColumns` now tracks it live against those same breakpoints — change one, change the other.

## Media library grid

`MediaAssetGrid` virtualises above 100 assets. The virtualiser slices the asset list into rows of N and positions rows **absolutely**, so **N must equal the column count the CSS grid is actually rendering** (`grid gap-3 sm:grid-cols-2 lg:grid-cols-3` → 1 / 2 / 3). It was hardcoded to 3, so below `lg` the rows overlapped and most of the library became unreachable on a laptop, tablet or phone. `useResponsiveGridColumns` now tracks it live against those same breakpoints — change one, change the other.

## `AdminFieldSelect` empty-value rule

Radix's `Select.Item` reserves `value=""` to mean "cleared, show the placeholder" — mounting an actual `<Select.Item value="">` throws and takes the whole panel down. This caused a real admin crash where an editor needed a genuine selectable "none" option (e.g. "Unassigned", "Assign later", "All products") that the user can select **back to**, which a placeholder cannot express.

`src/features/admin/components/AdminFieldSelect.tsx` shields every caller from this constraint: when its `options` array contains a `value: ''` entry, the wrapper swaps that empty string for an internal `EMPTY_OPTION_SENTINEL` (`'__anvl_select_none__'`) on the way into Radix and swaps it back on the way out via `onChange`. The swap only engages when an empty-valued option is actually present, so ordinary selects (where `value === ''` genuinely just means "nothing chosen yet, show the placeholder") behave exactly as before. **Never** pass a raw empty-string `value` into a Radix `Select.Item` anywhere else in the admin — go through `AdminFieldSelect` (or replicate this sentinel swap) instead of reintroducing the crash.

## Live preview (unsaved edits, real storefront)

The topbar **Preview** toggle docks a panel embedding the REAL storefront in a same-origin iframe (`/<route>?anvl-cms-preview=1`, device switcher: desktop 1280 — the true Oath cinematic gate — / tablet 768 / mobile 390; closing unmounts the iframe).

Protocol (v1, Zod-validated, `src/features/cms/preview/previewBridge.types.ts`):

```
admin → iframe   anvl-preview/hello · anvl-preview/draft { payload } · anvl-preview/focus { target } · anvl-preview/hover { target|null }
iframe → admin   anvl-preview/ready · anvl-preview/located { target, found }
```

- **Handshake is bidirectional** (hydration inside the iframe finishes long after `load`, so a single parent `hello` would be lost): the storefront announces `ready` once hydrated, the admin replies `hello` and also retries hello until the first `ready`. Requires same-origin framing — `X-Frame-Options: SAMEORIGIN` + `frame-ancestors 'self'` in `src/start.ts` (`DENY`/`'none'` would block the preview entirely; third-party framing stays blocked).
- **Inspection-style hover** (`hover`): while the mouse/focus is on an editor field/section, the preview rings the matching storefront element (persistent ring, cleared on `target: null`) — wired via `usePreviewHoverProps` on `ContentSection`s, About orb fieldsets, and asset-slot panel rows (slot→scene mapping). Locate (`focus`) keeps the scroll-and-flash behavior. The `data-anvl-preview-target` attr carries the id only (kind is admin-side metadata); About orb targets are index-based (`about:orb-N`).

- `payload` = the editors' UNSAVED in-memory working copies, keyed by the persisted slices (`themeLibrary`, `fontLibrary`, `assetConfig`, `landingContent`, `shopConfig`, `pdpContent`, `comingSoon`); each slice is re-parsed with its existing `parse*` on receipt. Editors push via `usePushPreviewDraft(field, config)` (debounced; draft dropped on unmount).
- Storefront activation is **SSR-safe and visitor-safe**: `PreviewDraftProvider` (mounted once in `__root.tsx`) stays `null` on the server and first paint, and activates only when the query param is present AND the page runs inside an iframe AND a `hello` arrives from the **same origin** (re-checked per message). Consumers (`SiteThemeProvider`, home/about/PDP routes, `useShopConfig`, `useComingSoonConfig`) prefer a present draft slice, else published data.
- **Locate**: editors' crosshair buttons send `focus`; the storefront scrolls to and rings the element carrying `data-anvl-preview-target` (via `usePreviewTargetProps`) — Oath scenes resolve through their existing `data-scene` contract, so the cinematic components carry no new attributes.
- Save still = publish (dual-write untouched); the preview covers only the pre-save gap.

### Preview target-id vocabulary

`src/features/cms/preview/previewTargetRegistry.ts` is the single source mapping every `data-anvl-preview-target` (and the Oath's `data-scene` fallback) id the storefront can emit to the admin editor route that owns it, so locate/hover always resolves to something meaningful. The registry is pattern-matched, first-match-wins:

| Target id pattern | Owning editor |
|---|---|
| `site:page` | None (`adminRoute: null`) — the whole-page marker every editor can ring, but which no single editor owns |
| `shop:(hero\|toolbar\|grid)` | `/admin/shop` |
| `pdp:(materials\|care\|details)` | `/admin/products` |
| `passport:(identity\|piece\|material\|blueprint\|specs\|care\|fit\|details\|forge-notes\|origin\|authenticity\|story)` | `/admin/passports` |
| `the-oath:(hero\|manifesto\|tenets\|products\|finale)` | `/admin/content` |
| `about:(hero\|marquee)` and `about:orb-\d+` | `/admin/about` |
| `banner:rail` | `/admin` (the dashboard's `BannerCustomizeModal` — no static page-anchor exists) |
| `coming-soon:page` | `/admin/coming-soon` |

**Deliberate aliasing:** some editor tabs intentionally share one target id rather than each getting a distinct one. The passport content wizard's **"Design details"** tab (`hotspots` step — pin markers on the render) shares `targetId: 'passport:piece'` with **"The piece"** tab (`PassportContentTabsEditor.tsx`), because both edit content anchored to the same hero render — locate/hover rings the piece section for either tab. This is by design, not a gap to "fix" by minting a new id per tab.

> **Story is the one relational CMS surface.** Unlike the singleton-JSON config above, the saga is many rows across three tables with direct Supabase CRUD (editor-role RLS). It is **not** mirrored into `storefront_publication`; the storefront reads published rows directly via anon RLS (`is_published`).

---

## Data flow

```
Admin browser
  └── edits theme / fonts / assets / landing content / active drop (localStorage working copy)
        └── adminCmsRemoteSync → publish_cms_settings() RPC
            └── cms_settings + storefront_publication, in ONE transaction (F-19)

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

Hydration makes **two** waves of Supabase round trips, not nine. The core `select` of 5 columns stays first and serial — its `if (!settings) return` is a real early exit, and the asset/landing pair needs `migrateOathTenetAssetsFromSlots` across both before either is written. The **eight tolerant column pulls** then run CONCURRENTLY (fixed 2026-08-05; they were a `for…await` costing 8 sequential round trips with the whole shell behind "Loading CMS…"). They remain **eight single-column requests rather than one combined `select`** — that is precisely what makes them *tolerant*: a column missing on a pre-migration deployment fails only its own request, whereas a combined select would fail for all eight and silently reset every blob to code defaults. `adminCmsHydration.test.ts` pins this by failing one specific column, so collapsing them turns that test red. Fetching is parallel; the WRITES stay sequential and in declaration order, so a throwing Zod parser aborts the remainder exactly as before.

The 10-minute session heartbeat refreshes the session ALWAYS, but the **heartbeat does NOT re-pull the CMS while any editor is dirty** (`isAnyAdminEditorDirtyNow()`): `hydrateAdminCmsFromSupabase` overwrites the localStorage working copy, so re-pulling mid-edit silently threw away whatever the operator had typed and not yet saved. Foreground pulls (login, mount) are unaffected — nothing is unsaved at those moments.

Hydration is gated by `beginAdminCmsRemoteHydration` / `endAdminCmsRemoteHydration` so push does not race pull. `AdminLayout` blocks editors until `isRemoteCmsReady`. On pull, `migrateOathTenetAssetsFromSlots` moves legacy tenet asset slots into `landing_content`.

> **The Supabase client here is loaded lazily, deliberately.**
> `adminCmsRemoteSync` and `mediaAssets.service` reach `adminSupabaseBrowserClient`
> through `await import(...)`, never a static import. Both modules share a chunk
> with the storefront's CMS Zod schemas — which the entry needs for the SSR
> projection — so a static import anchors `createAnvlSupabaseClient` and all of
> `@supabase/supabase-js` (~200 KB) onto every storefront visitor's first paint.
> The same rule is why `autoImportRun.ts` imports `cmsWriteThrough` dynamically:
> one static importer anywhere defeats the lazy imports of every storefront
> `*.settings.ts` module at once (Rolldown reports it as
> `[INEFFECTIVE_DYNAMIC_IMPORT]`). Check with `ANVL_IMPORTERS=1 pnpm build`
> before changing any of these imports.

### Whole-map clobber guard (`adminCmsRemoteSync.ts`)

Some columns store the WHOLE authored map rather than a field patched in place, so publishing one replaces everything in it — in `cms_settings` **and** the anon-readable `storefront_publication` mirror — in a single UPDATE. A browser that never hydrated that column (fresh machine, incognito, cleared site data, `/admin/settings` local reset, or a hydration pull that failed on that column) would publish a map containing only what this session happened to touch and **destroy the rest**.

`WHOLE_MAP_GUARDS` is an **exhaustive** `Record<CmsSettingsFieldKey, WholeMapColumn | null>`: every column must be classified, so adding a key to `CMS_SETTINGS_FIELD_KEYS` without classifying it is a `pnpm typecheck` failure. That structure replaced a hand-maintained array on 2026-08-04 — `passport_content` had shipped as a per-slug map with no guard precisely because the array let a new column slip in unnoticed.

Guarded: `pdp_content`, `passport_content`, `shop_config`. `null` (unguarded) is correct for singleton blobs — republishing theme/fonts/banner/legal/SEO from defaults is immediately visible and re-editable, whereas a per-slug map silently loses entries the operator never saw.

> **Known gap:** `support_content` also carries per-slug care lines and size tables, so it has the same shape of exposure. It is deliberately left `null` for now because guarding it changes save behaviour for a never-hydrated editor; tracked as a follow-up.

A scoped publish of an unhydrated guarded column **hard-fails before any network write** (reload `/admin` to re-pull, then save). The unscoped debounced auto-sync instead omits the column from the patch, so the remote value is left alone — the same "omit, never wipe" rule already applied to `media_index`.

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
landing_content jsonb NOT NULL -- { [landingKey]: { ...page-shaped copy overrides }, about: {...} }
shop_config jsonb NOT NULL     -- /admin/shop: shop layout, product cards, filters, sort, toggles, state copy, and shop_config.pdp (PDP section toggles + related count + animation)
pdp_content jsonb NOT NULL     -- /admin/products: { [slug]: {...} } per-product PDP editorial content (bento copy + editorial assets); commerce data stays on the product
passport_content jsonb NOT NULL -- /admin/passports (Passport content tab): { [slug]: {...} } per-product passport section content (identity/piece/material/care/details/origin copy + assets)
coming_soon jsonb NOT NULL     -- /admin/coming-soon: site-mode enabled toggle + reveal-page copy/countdown/CTAs/email-capture/assets/SEO
banner_config jsonb NOT NULL   -- dashboard drop-status modal: storefront announcement banner (enabled, message, optional href/label/image, colors, optional schedule)
legal_content jsonb NOT NULL   -- /admin/legal: privacy/terms/cookies/accessibility copy (title, updatedAt, intro, sections)
support_content jsonb NOT NULL -- /admin/support: faq/contact/shipping/returns/care/size copy + per-product care lines & size tables keyed by slug
site_seo jsonb NOT NULL        -- /admin/analytics: global SEO defaults, per-page SEO, technical (robots/sitemap), analytics/marketing tags (GA4/GTM/Meta Pixel/Hotjar/verification/custom script)
updated_at timestamptz
```

`landing_content` is validated client-side by each page's own Zod schema
(`oathContent.schema.ts`); blank/missing fields fall back to designed code
defaults at render (`resolveOathContent`). The single Drop 01 page (The Oath)
stores its copy under key `the-oath`.

`storefront_publication` mirrors the same eight jsonb blobs (`shop_config`
through `site_seo`) alongside its own copies of `theme_config`/`font_config`/
`asset_config`/`landing_content` — see `src/features/admin/cmsRemote/adminCmsRemoteSync.ts`'s
`CmsSettingsFieldKey` union for the authoritative list of every column this
sync module knows how to scope a write to.

> **Relational tables alongside the blobs.** Not everything in the CMS is a
> singleton jsonb column — `product_passports` (+ transfer/review/feats
> tables), the `gamification_*` tables, the `story_*` tables, and
> `techpacks`/`techpack_images` are ordinary relational tables with direct
> Supabase CRUD (editor-role RLS), documented in full in `CLAUDE.md`'s
> Supabase schema table. `cms_settings.passport_content` /
> `storefront_publication.passport_content` above is the jsonb **editorial
> copy** for a passport's sections — it is separate from the relational
> `product_passports` row that tracks claim/ownership/QR state.

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
shop_config jsonb          -- published mirror of cms_settings.shop_config
pdp_content jsonb          -- published mirror of cms_settings.pdp_content
passport_content jsonb     -- published mirror of cms_settings.passport_content
coming_soon jsonb          -- published mirror of cms_settings.coming_soon
banner_config jsonb        -- published mirror of cms_settings.banner_config
legal_content jsonb        -- published mirror of cms_settings.legal_content
support_content jsonb      -- published mirror of cms_settings.support_content
site_seo jsonb             -- published mirror of cms_settings.site_seo
media_index jsonb          -- denormalized public URLs for assigned assets
revision bigint
published_at timestamptz
```

#### `public.storefront_profiles`
Customer accounts (unchanged; not CMS).

#### Story saga tables (`story_chapters` → `story_acts` → `story_cast`)
Relational content for the `/story` page. Each **chapter** is a book on the shelf; each chapter has ordered **acts**; **cast** are CMS-authored characters attached to a chapter (or a specific act). Chapters may link to a product via `product_slug` (= Shopify handle) — **multiple chapters may share a product_slug** (the one-per-product unique index was dropped in `20260720100000_story_chapters_many_per_product.sql`); the PDP and passport embeds show the first book by `sort_order` (`StoryClient.getChapterByProductSlug`).

```sql
story_chapters(id, slug UNIQUE, chapter_number, title, subtitle, description,
               product_slug, drop_label, drop_slug,
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
- Browser client: **memory-only session** — `persistSession: false`, `autoRefreshToken: false`, CMS reads only. It used to persist under `anvl.supabase.admin.v1`, which put the admin's Supabase **refresh token in same-origin localStorage** (F-20, fixed 2026-08-04) — readable by any injected script, and the second half of an editor → admin takeover chain whose first half was the CMS SVG sink. Nothing is lost by not persisting: the sealed cookie is already the sole authority and `AdminAuthProvider` re-applies fresh tokens on login, on mount and on every heartbeat.
  - **`setSession` is awaited before any CMS pull.** With no persisted copy, nothing covers the window between "tokens arrived" and "client can authenticate" — `applyAuthenticatedResult` previously fired `setSession()` with `void` while `startRemoteCmsPull()` ran immediately after, which would now hit RLS unauthenticated. All three call sites (login, mount bootstrap, heartbeat) await it.
  - **Not yet eliminated:** the token still *reaches* the browser. Removing it entirely means supabase-js's `accessToken` factory, which disables `supabase.auth.*` — and `auth.getSession()` is called by 8 admin services (`adminCmsRemoteSync`, media, passports, fontFamilies, storyMedia, techpacks ×2). Tracked as Phase 2.
- **Sign-in is rate limited** (F-07, 2026-08-04): `ADMIN_LOGIN_RATE_LIMIT`, 20 attempts / 60 s, keyed by `CF-Connecting-IP` so rotating the email tried does not dodge it. Fails open when the binding is absent — see `docs/deployment.md`.
- **Server-validated (SEC-11, resolved 2026-07-04):** `/admin/*` access is checked in `beforeLoad` on every SSR request and client navigation via a sealed HttpOnly session cookie (`src/features/admin/auth/adminAuthSession.server.ts`) holding the Supabase refresh token; every validation call refreshes + re-verifies `cms_profiles.role = admin` and rotates the cookie. The static env-file username/password gate was removed in this same pass — Supabase is the only admin auth path.

---

## Edge functions (in repo)

| Function | Deployed? | Purpose |
|---|---|---|
| `shopify-webhook` | Yes | Verifies Shopify HMAC; ack-only — no DB writes |
| `techpack-ai` | Yes (`verify_jwt: true`) | Techpack ingestion AI parsing for `/admin/techpacks` |
| `medusa-webhook-stub` | No — never deployed | Validates `x-anvl-medusa-secret`; placeholder for future Medusa sync |

> **Removed:** `publish-storefront` and `process-scheduled-drops` Edge Functions. Admin sync writes directly to `cms_settings` + `storefront_publication` via `adminCmsRemoteSync`. See `docs/technical-debt.md` (MIG-01) for orphaned publish RPC migrations still in the migration history.

---

## Security checklist

- [ ] All CMS JSON writes validated with Zod before Supabase upsert
- [ ] `storefront_publication` updated only via authenticated admin sync paths
- [ ] CMS-driven `href`/`src` pass through `sanitizeHref()` before DOM insertion
- [ ] No service-role keys in client code
- [ ] localStorage stores use `createJsonStore` with strict Zod schemas
