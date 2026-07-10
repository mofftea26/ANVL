/**
 * URL helpers used at every boundary where a CMS-driven (or otherwise
 * untrusted) URL is rendered into the DOM.
 *
 * Rule of thumb (codified in .cursor/rules/10-security.mdc): every
 * CMS-driven `href` / `<Link to>` must funnel through {@link sanitizeHref}
 * before reaching the DOM. Returning `null` means the input failed the
 * allowlist — callers should either skip rendering the link or render the
 * label as plain text.
 *
 * Audit refs: Phase B3 / SEC-04.
 */
export type SanitizedScheme = 'https' | 'http' | 'mailto' | 'tel';
export type SanitizeHrefOptions = {
    /** Allow relative URLs (start with `/`, `#`, `?`). Default true. */
    allowRelative?: boolean;
    /** Allowed URL schemes for absolute URLs. Default `['https','http','mailto','tel']`. */
    schemes?: ReadonlyArray<SanitizedScheme>;
};
/**
 * Returns a sanitized href that's safe to pass to `<a href>` or
 * TanStack Router `<Link to>`. Returns `null` for any input that
 * fails the allowlist.
 *
 * The check is conservative — when in doubt it rejects:
 * - Non-string input.
 * - Strings containing control characters (incl. `\n`, `\r`, `\t`).
 * - URLs with a scheme not on the allowlist (`javascript:`, `data:`,
 *   `vbscript:`, `file:`, `ssh:`, etc.).
 * - Relative URLs when `allowRelative: false`.
 */
export declare function sanitizeHref(raw: unknown, options?: SanitizeHrefOptions): string | null;
/**
 * Returns true when {@link sanitizeHref}-shaped input is an absolute URL
 * (http(s)/mailto/tel) rather than a relative path. Use this to decide
 * between `<a href>` (external) and TanStack `<Link to>` (internal) at
 * render time.
 */
export declare function isExternalHref(href: string): boolean;
/**
 * Normalizes an absolute image URL to HTTPS. Returns the input unchanged
 * for relative paths, mailto/tel, or anything sanitizeHref would already
 * reject. Use at the SEO / JSON-LD / OG boundary so mixed-content `http://`
 * images don't bleed into canonical surfaces.
 *
 * Audit refs: Phase B7 / SEC-15.
 */
export declare function upgradeHttpToHttps(href: string): string;
/**
 * Requests a smaller Shopify CDN rendition via their documented `width` query
 * param — resizing is always available on Shopify's CDN (no plan/feature
 * gating, unlike Supabase Storage's image-transform add-on). No-ops for any
 * URL not served from Shopify's CDN, so it's safe to call on every product
 * image regardless of commerce backend (seed/local adapters return local or
 * Supabase paths, which pass through unchanged).
 *
 * Audit refs: PERF-24 (product card/gallery images requested at full
 * upstream resolution and downscaled with CSS instead of via the CDN).
 */
export declare function withShopifyImageWidth(src: string, width: number): string;
export declare function isLikelySafeMediaSrc(raw: unknown): boolean;
