# Feature — SEO CMS

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

## CMS SEO sections
1. Global SEO defaults.
2. Landing page SEO.
3. Active drop page SEO — `buildSeoMeta` uses `DropSeo.title` / `description` for the HTML title and meta description; optional `ogTitle` and `ogDescription` override Open Graph and Twitter title/description while the HTML `<title>` and `description` meta stay on the primary fields.
4. Shop SEO.
5. Product SEO.
6. About and Size Guide SEO.
7. Social share preview.
8. Robots/noindex controls.
9. Redirects later.
10. Sitemap settings later.

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
