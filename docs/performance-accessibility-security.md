# Performance / Accessibility / Security

## Performance goals
- Mobile first.
- Keep mobile animations minimal.
- Lazy-load heavy sections and GSAP logic.
- Use optimized image/video assets.
- SSR important public pages for SEO and first paint.
- Code split admin and heavy CMS builders away from storefront.
- Avoid hydration mismatches.
- Avoid loading admin-only libraries in the public storefront bundle.

## Bundling rules
- Dynamic import heavy act renderers.
- Dynamic import GSAP modules only on client.
- Split CMS route group from public route group.
- Keep 3D/model viewers optional and lazy.
- Use bundle analyzer before release: run `pnpm analyze` (sets `ANVL_ANALYZE=1` for `vite build` and writes `dist/stats.html` via `rollup-plugin-visualizer`). Review gzip/brotli sizes and large entry chunks after each major feature.
- Vite `manualChunks` isolates `gsap`, `lenis`, `framer-motion`, `zod`, `@tanstack/*`, and `react`/`react-dom` into `vendor-*` chunks to keep them out of the main application graph where possible.

## Accessibility checklist
- Semantic headings in order.
- Buttons are buttons, links are links.
- Every input has a label.
- Every product image has meaningful alt text.
- Keyboard usable menus, dialogs, filters, cart drawer.
- `Modal` / `Drawer`: focus trap while open, restore focus on close, Escape closes, `aria-modal="true"`, and `aria-labelledby` (preferred) or `aria-label` on the dialog surface. Shared logic lives in `useDialogFocusTrap` (client-only `useLayoutEffect`).
- Storefront navigation: apply the `focus-ring` utility on header links, drawer links, and key CTAs so keyboard users get a visible outline.
- Visible focus states.
- Sufficient contrast.
- Respect `prefers-reduced-motion`.
- Do not rely only on color for status.
- Target sizes comfortable on mobile.

## Security checklist
- Never expose API keys or admin secrets in frontend.
- **`publicEnv`:** client-visible `VITE_*` values used in-app (demo admin login, feature flags) are parsed through `src/app/config/publicEnv.ts` (Zod) for a consistent shape; they are still bundled for the browser and must be replaced with real server auth before production.
- Validate all CMS/product/SEO data with schemas.
- Sanitize rich text and HTML.
- Persisted drops in `localStorage` are validated with `persistedDropSchema` (`drops.persistence.zod.ts`) before merge — malformed rows are skipped so tampered JSON cannot drive the UI.
- Strip angle-bracket tag patterns from CMS plain-text fields where editors might paste HTML (`stripAngleBracketTags`) so screen readers do not announce stray markup tokens.
- Escape JSON-LD / `application/ld+json` payloads so string values cannot inject `</script>` (see `JsonLd` helper).
- Validate uploads by MIME, size, extension, dimensions.
- Use CSP later.
- Secure cookies later: HttpOnly, Secure, SameSite.
- Rate-limit auth, checkout, forms.
- Prevent account enumeration.
- Protect admin routes with real auth before production.
- Keep dependencies audited and pinned.

## SSR safety checklist
- No direct browser APIs during SSR.
- Use client-only hooks for media queries, localStorage, GSAP, ResizeObserver, IntersectionObserver.
- Use stable data between server and client to avoid hydration mismatch.
