# Prompt 12 — Refactor Shop and Product Detail pages

```txt
Before coding, read AGENTS.md, docs/features/products-commerce.md, docs/design-system.md, docs/performance-accessibility-security.md.

Task: Refactor the public Shop and Product Detail pages using the product model and runtime commerce client.

Requirements:
- Shop page lists all public products.
- Filters: status, drop, source type, color, size availability, price range if already easy.
- Search bar with debounce.
- URL search params for shareable filters where possible.
- Mobile filters use bottom sheet/drawer.
- Desktop filters use sidebar or top toolbar.
- Product detail page has gallery, optional video/3D placeholder, color/size selector, automatic availability, material/fit/care accordions, related products.
- No heavy animation on mobile.
- SSR-safe and SEO-friendly.

Update docs/changelog.md.
```
