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
- Use bundle analyzer before release.

## Accessibility checklist
- Semantic headings in order.
- Buttons are buttons, links are links.
- Every input has a label.
- Every product image has meaningful alt text.
- Keyboard usable menus, dialogs, filters, cart drawer.
- `Modal` / `Drawer`: focus trap while open, restore focus on close, Escape closes, `aria-modal="true"`, and `aria-labelledby` (preferred) or `aria-label` on the dialog surface.
- Visible focus states.
- Sufficient contrast.
- Respect `prefers-reduced-motion`.
- Do not rely only on color for status.
- Target sizes comfortable on mobile.

## Security checklist
- Never expose API keys or admin secrets in frontend.
- Validate all CMS/product/SEO data with schemas.
- Sanitize rich text and HTML.
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
