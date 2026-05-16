# Feature â€” SEO CMS

## Goal
Allow the admin to control SEO clearly from the CMS without touching code.

## SEO document model
```ts
type SeoDocument = {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: MediaAsset;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: MediaAsset;
  structuredDataType?: 'Organization' | 'Product' | 'CollectionPage' | 'WebPage' | 'BreadcrumbList';
  structuredData?: Record<string, unknown>;
};
```

## Runtime contracts
`SeoDocument` is validated by `seoDocumentSchema` in `src/features/seo/schemas/seo-document.schema.ts` with types re-exported from `src/features/seo/types/seo-document.types.ts`. `NavigationItem` and `SiteSettings` schemas live in `src/shared/schemas/navigation.schema.ts` and `src/shared/schemas/site-settings.schema.ts` (types under `src/shared/types/`).

## CMS SEO sections
1. Global SEO defaults.
2. Landing page SEO.
3. Active drop page SEO â€” `buildSeoMeta` uses `DropSeo.title` / `description` for the HTML title and meta description; optional `ogTitle` and `ogDescription` override Open Graph and Twitter title/description while the HTML `<title>` and `description` meta stay on the primary fields.
4. Shop SEO.
5. Product SEO.
6. About and Size Guide SEO.
7. Social share preview.
8. Robots/noindex controls.
9. Redirects later.
10. Sitemap settings later.

Admin navigation surfaces SEO at `/admin/seo` and contextual image URLs in `/admin/media` (guide-only until a standalone asset library exists).

## UX rules
- Show a Google-style snippet preview.
- Show a social card preview.
- Warn when title/description are too long or too short.
- Auto-suggest from product/drop title but allow override.
- Never let SEO fields break rendering when empty.

## Technical rules
- Route head/meta must use data from route loader/server-safe data.
- Product pages need product structured data later.
- Organization JSON-LD should use official ANVL brand identity.
- Sitemap should include active public pages/products only when backend exists.


## Runtime integration
`SeoClient` is defined in `src/app/config/clients.ts` with two implementations:

- `seedSeoClient` â€” SSR-safe; resolves `/`, `/drop/â€¦` from the oath seed snapshot and other paths from `cmsMockData.seoByPath` until a real SEO CMS exists.
- `localStorageSeoClient` â€” browser-only resolution via the same rules against persisted drops + landing CMS.

`createRuntimeClients({ isServer })` selects the correct implementation. The shop index route (`src/routes/shop/index.tsx`) demonstrates loading `/shop` SEO from `runtimeClients.seo.getSeoByPath('/shop')` in the route loader and passing it into `buildSeoMeta()`.

- `JsonLd` serializes structured data with `<` replaced by `\u003c` inside the JSON string so untrusted CMS copy cannot break out of the script tag.