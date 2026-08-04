# Feature — SEO & Analytics

## Goal
Let the admin control SEO and analytics/marketing tags from the CMS without touching code.

## Where SEO is authored
SEO and analytics are authored at **`/admin/analytics`** ("Analytics & SEO") — see
`src/routes/admin/analytics.tsx` (lazy route) →
`src/features/admin/analytics/AdminAnalyticsEditor.tsx`. There is no `/admin/seo` route.

The editor writes a single `SiteSeoContent` blob (`src/features/cms/siteSeo.local.ts`) via
`saveSiteSeoContentAsync`, which persists to `localStorage` (`anvl.siteSeo.v1`) and then flushes
through the standard admin write-through path to **`cms_settings.site_seo`** /
**`storefront_publication.site_seo`** (same dual-write pattern as `banner_config`,
`legal_content`, etc.).

The editor exposes three sections:
1. **Analytics & marketing tags** — an ordered list of `MarketingToolEntry` (`provider`,
   `snippetId`, `enabled`). Providers: `ga4`, `gtm`, `metaPixel`, `hotjar`,
   `googleSiteVerification`, `customScript`.
2. **Search-engine visibility** — `technical.robotsIndex` (site-wide index toggle) and
   `technical.sitemapEnabled` (sitemap-exposure toggle).
3. **Global SEO defaults** — `globalDefaults.metaTitle` / `metaDescription` /
   `defaultShareImage`, used as fallbacks when a page doesn't set its own.

There is no drop builder and no `DropSeo` entity in the current codebase — both were removed
with the drop-builder teardown. Per-page SEO for `/`, `/shop`, `/about`, `/size-guide`,
`/care-guide` has a data shape (`SiteSeoContent.staticPages`, keyed by path, merged via
`mergeSeoWithStaticPagePatch` in `src/features/cms/seoMeta.ts`) but **no admin UI currently
edits it** — those per-path SEO base documents still come from the hardcoded
`cmsMockData.seoByPath` map (`src/features/cms/data/cms.mock.ts`), with only the global
defaults above CMS-editable on top of them. The legacy `seoDocumentSchema` / `SeoDocument` type
in `src/features/seo/schemas/seo-document.schema.ts` is not imported or used anywhere else in
the codebase — treat it as orphaned scaffolding, not the current model.

## Runtime contracts
- `SeoClient` (`src/app/config/clients.ts`) has two methods: `getSeoByPath(path)` (per-path
  `SeoContent` — title/description/canonical/OG/Twitter/robots/structured-data-type,
  `src/features/cms/types/cms.types.ts`) and `getSiteSeo()` (the `SiteSeoContent` blob above).
- `seedSeoClient` / `localStorageSeoClient` (`src/features/cms/api/seoClient.seed.ts` /
  `.localStorage.ts`) resolve `getSeoByPath` from `resolveSeoByPath` (the mock map) and
  `getSiteSeo` from `defaultSiteSeoContent()` / `getSiteSeoContent()` respectively.
- When Supabase env is configured, `createSupabaseSeoReadSlice` (in
  `src/features/cms/api/supabaseStorefrontReaders.ts`) overrides `getSiteSeo` to read the
  published `site_seo` column via the coalesced storefront projection fetch, falling back to
  code defaults on error.
- `createRuntimeClients({ isServer })` in `src/app/config/runtime.ts` selects the SSR vs.
  browser variant identically on server and client.
- Routes that call both `runtimeClients.seo.getSeoByPath(path)` and
  `runtimeClients.seo.getSiteSeo()` in their loader and merge them via
  `buildSeoHeadForSiteStaticPath` (`src/features/cms/seoMeta.ts`): `/shop`
  (`src/routes/shop/index.tsx`), `/about`, `/size-guide`, `/care-guide`.

## Meta tag construction
- `buildSeoMeta()` in `src/app/seo/meta.ts` is the single low-level builder: resolves the
  canonical URL (via `resolveCanonical`), the OG/Twitter image (`resolveAssetUrl`, defaulting to
  `/brand/og-default.png`), the `robots` meta (`noindex,nofollow` vs `index,follow`), and the
  full `<meta>` + `<link rel="canonical">` list consumed by TanStack Router's `head()`.
- `src/features/cms/seoMeta.ts` sits above it: `seoContentToMetaSource` / `productSeoToMetaSource`
  merge a per-page `SeoContent`/product doc with `SiteSeoGlobalDefaults`, and
  `buildSeoMetaFromCmsSource` calls through to `buildSeoMeta()`.
- `computeSeoWarnings()` (same file) flags empty/too-long title or description — used by
  editors that want SERP-length warnings.

## Robots & sitemap
- `public/robots.txt` and `public/sitemap.xml` are static files in the repo — the
  `technical.sitemapEnabled` toggle is persisted in `site_seo` but is **not currently wired** to
  regenerate or hide the static sitemap file.
- `technical.robotsIndex` is applied **client-side only**, after hydration: `MarketingToolsHead`
  sets/overwrites a `<meta name="robots">` tag in a `useEffect` when `robotsIndex === false`. It
  is not baked into the SSR `head()` output. Separately, `src/routes/__root.tsx` always injects
  `noindex, nofollow` (SSR, all routes except `/` and `/admin/*`) while Coming Soon mode is
  enabled — that mechanism is independent of `site_seo.technical`.

## Analytics & marketing tag injection
- `MarketingToolsHead` (`src/shared/components/seo/MarketingToolsHead.tsx`) is mounted once in
  `src/routes/__root.tsx`, fed the SSR-published `siteSeo` loader value as its `siteSeo` prop.
  Inside the admin live-preview (or any browser where the admin has hydrated a local `site_seo`
  blob), it re-subscribes to the localStorage copy so unsaved edits show without a reload; the
  local copy only wins when `hasStoredSiteSeo()` is true, so real storefront visitors always get
  the SSR-published blob.
- For each enabled `MarketingToolEntry` with a non-empty `snippetId`, `injectTool()` appends the
  matching script/meta tag once (de-duplicated by DOM id): GA4 (`gtag.js` + inline config), GTM
  (loader snippet), Meta Pixel (`fbevents.js` snippet), Hotjar (tracking snippet), Google site
  verification (`<meta name="google-site-verification">`), or a custom async `<script src>` for
  `customScript` (only if the value starts with `http`).

## JSON-LD (structured data)
- `src/shared/components/seo/structuredData.ts` builds three shapes:
  `organizationJsonLd()`, `productJsonLd(product)`, `breadcrumbJsonLd(items)`.
- `organizationJsonLd()` is rendered on the home route (`src/routes/index.tsx`) via `<JsonLd>`.
- `productJsonLd()` + `breadcrumbJsonLd()` are rendered on the PDP
  (`src/features/products/pdp/ProductDetailPage.tsx`).
- `JsonLd` (`src/shared/components/seo/JsonLd.tsx`) serializes with `<` escaped to `<` so
  untrusted CMS copy embedded in the JSON cannot break out of the `<script>` tag.

## UX rules
- Show enabled/disabled state per tag clearly (the editor's per-row "On" checkbox) rather than
  deleting a tag to pause it.
- Warn when a global default title/description is too long or too short (`computeSeoWarnings`).
- Never let SEO fields break rendering when empty — every consumer falls back through
  `pickStr()` to a coded default.

## Technical rules
- Route head/meta must use data from the route loader/server-safe data — never read
  `window`/`localStorage` during SSR.
- Organization JSON-LD should use the official ANVL brand identity (`BRAND` constants).
- Product/Breadcrumb structured data must stay in sync with the real commerce data
  (`productJsonLd` reads `Product.shop`, `Product.price`, `Product.images`).
