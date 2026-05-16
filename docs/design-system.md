# Design System

## Brand direction
ANVL is premium bodybuilding gymwear: dark, forged, disciplined, industrial, warrior-inspired, and refined.

## Theme model
Use CSS variables so the active drop can theme the full storefront without rewriting styles.

Base variables:
```css
:root {
  --color-bg: #0B0B0C;
  --color-surface: #1D1F21;
  --color-surface-muted: #34373A;
  --color-text: #E7E4DF;
  --color-text-muted: #A7A29A;
  --color-accent: #E7E4DF;
  --color-border: rgba(231, 228, 223, 0.16);
  --font-heading: 'Bebas Neue', Impact, sans-serif;
  --font-body: 'Manrope', system-ui, sans-serif;
}
```

Per active drop, update:
- background colors
- surface colors
- accent color
- glow color
- selection color
- campaign font override if needed
- campaign emblem/watermark references

Never change the official header/footer ANVL logo per drop. Campaign logos/emblems live inside drop sections only.

## Active drop storefront theming
- **CSS variables**: `DropThemePalette` maps to shared custom properties (`--color-bg`, `--color-surface`, `--color-accent`, `--color-hero-glow`, etc.) via `dropPaletteToCssVarsRecord` / `serializeDropPaletteForRootStyle` in `src/features/admin/drops/dropPaletteStyle.ts`.
- **SSR**: The root route loader calls `runtimeClients.cms.getActiveDrop()` for public paths; `head` injects a `<style id="anvl-active-drop-theme">` block so the first paint matches hydration (no client-only `:root` mutation during SSR).
- **Client updates**: `ActiveDropThemeProvider` (public layout only) keeps the same style tag in sync when drops change in admin storage and on navigation; admin routes skip active-drop fetch/injection so CMS chrome stays on base tokens.
- **Preview**: Admin-only previews use `DropPreviewThemeScope`, which applies palette variables on a scoped element, not the global brand header/footer mark.

## Mobile-first rules
- Mobile: minimal motion, no scroll-jacking, no heavy pinned GSAP sequences, compressed media, simple product cards, sticky bottom cart/CTA when useful.
- Tablet/Desktop: cinematic GSAP sections, layered visuals, scroll reveals, parallax, video backgrounds when optimized.
- Always support `prefers-reduced-motion`.

## Component style
- Premium spacing, fewer cramped panels.
- Large preview surfaces in CMS.
- Strong hierarchy: title, status, action.
- Use cards only where they help grouping; avoid dashboard clutter.
- Admin pages should use two-column layouts on desktop: editor on left, live preview on right.
- Admin navigation is grouped (Workspace, Campaigns, Catalog, Site) with compact badges; the dashboard mirrors the same destinations as cards.

## Media rules
- Use responsive images.
- Lazy-load below-the-fold media.
- Use poster images for videos.
- Avoid autoplay with sound.
- Use optimized formats where possible.
