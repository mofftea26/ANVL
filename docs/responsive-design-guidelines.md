# Responsive Design Guidelines

## Breakpoints

Tailwind v4 defaults (used throughout the project):

| Name | Min width | Typical device |
|---|---|---|
| (base) | 0px | Small phones |
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets, large phones landscape |
| `lg` | 1024px | Laptops, small desktops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large desktops, ultrawide |

**Test all pages at:** 375px, 430px, 768px, 1024px, 1280px, 1440px, 1920px.

---

## Mobile-First Principles

Write base styles for mobile, then enhance with `sm:`, `md:`, `lg:`, `xl:` prefixes.

```css
/* ✓ Mobile-first */
.section { padding: 2rem; }
@media (min-width: 768px) { .section { padding: 4rem; } }

/* ✗ Desktop-first (avoid) */
.section { padding: 4rem; }
@media (max-width: 767px) { .section { padding: 2rem; } }
```

Mobile should feel **intentionally designed**, not like a shrunk desktop.

---

## Typography Scale

Always use responsive type scale — never raw `text-6xl` alone:

| Use | Classes |
|---|---|
| Hero / page titles | `text-4xl sm:text-5xl md:text-6xl lg:text-7xl` |
| Section titles | `text-3xl sm:text-4xl md:text-5xl` |
| Card titles | `text-xl sm:text-2xl` |
| Body | `text-base` (16px — prevents iOS zoom) |
| Input/select | `text-base md:text-sm` (16px on mobile minimum) |
| Caption | `text-sm` |

---

## Touch Targets

Interactive surfaces must be at least **44×44px** for comfortable touch:

```tsx
// Icon buttons
<button className="h-11 w-11 flex items-center justify-center">

// Small buttons (desktop-only chrome)
<button className="h-9 px-3 text-sm">  {/* OK on desktop only */}

// Cart / PDP / quantity controls (mobile-accessible required)
<button className="h-11 min-w-11">
```

**Rule:** `Button size="sm"` (`h-9`) is only allowed in desktop-only chrome, never on cart, PDP, or quantity controls.

---

## Layout Patterns

### Hero sections (full viewport)

```css
height: calc(100svh - var(--anvl-header-h));
/* = var(--anvl-section-h) */
```

Always use `svh` (small viewport height) instead of `vh` for mobile where browser UI collapses.

### Content columns

```css
max-width: var(--anvl-content-max);       /* 80rem — standard */
max-width: var(--anvl-content-max-wide);  /* 96rem — wide/full sections */
```

Use `Container` component (`src/shared/components/ui/Container.tsx`) for standard page content.

### Grid rules

- Never 3+ columns at <360px viewport
- Prefer `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` patterns
- Product grids: 1 col mobile, 2 col tablet, 3-4 col desktop
- `PiecesGrid` is a known example of what not to do — it previously had 3 cols too early (RESP-08)

### Flex rows with text + price

Text in flex rows needs `min-w-0` to prevent overflow:
```tsx
<div className="flex items-center justify-between">
  <span className="min-w-0 truncate">Long product name here</span>
  <span className="shrink-0 ml-4">$49.99</span>
</div>
```

---

## Sticky Elements

### Sticky header

Height is exactly `--anvl-header-h: 4rem`. Every full-viewport section uses `--anvl-section-h: calc(100svh - var(--anvl-header-h))`.

### Sticky bottom bars (mobile)

Always include safe area inset and page spacer:
```tsx
<div className="fixed bottom-0 left-0 right-0 pb-[max(env(safe-area-inset-bottom),1rem)]">
  {/* sticky bar content */}
</div>

{/* Spacer so content isn't covered */}
<div className="h-24" aria-hidden="true" />
```

---

## Navigation

### Storefront nav (PremiumNav)

- **Mobile + tablet (<1024px):** the topbar carries the logo, cart, and a burger
  that opens the nav drawer (`PremiumNavMobile`). There is **no** fixed bottom bar.
- **Desktop (≥1024px):** full topbar with inline nav links + cart badge; the burger
  is hidden.
- **Cinematic mode:** transparent topbar + optional side rail (desktop only)
- `PremiumNavTopbar` owns all triggers (logo / links / cart / burger);
  `PremiumNavMobile` is purely the slide-out drawer.

### Admin nav

- Desktop (≥1024px): sidebar layout (`AdminSidebar`)
- Mobile/tablet (<1024px): sidebar becomes a `Drawer` (slide-in)
- Admin layout must not horizontally scroll the entire viewport

---

## Horizontal Overflow

Zero tolerance for horizontal scroll at any viewport width. Common causes:
- Images without `max-width: 100%`
- Long unbreakable words — add `break-words` or `overflow-wrap: break-word`
- Fixed-width elements — use `max-w-full` or `min-w-0` in flex containers
- GSAP animations that translate elements outside bounds — clip the container

Check with: browser DevTools → Performance → Layout Shifts, or manually scroll horizontally on mobile.

---

## Animation by Device

| Device | The Oath GSAP/WebGL | Lenis | Other GSAP | Framer Motion |
|---|---|---|---|---|
| Mobile (<768px) | Static (`buildOathStatic`) | Disabled | Snap to final | Minimal |
| Tablet (768–1279px) | Static (same branch) | Enabled (≥768px) | Snap to final | Yes |
| Desktop cinematic (≥1280px) | Full pins + WebGL | Enabled | Full if gated at 768px+ | Yes |

The Oath uses `oathBreakpoints.ts` (`OATH_DESKTOP_CINEMATIC_MQ` / `OATH_STATIC_MQ`). Generic GSAP uses the 768px dual gate:

```ts
mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
  // full animation
})
mm.add('(max-width: 767px), (prefers-reduced-motion: reduce)', () => {
  gsap.set('.element', finalState)
})
```

---

## Ultrawide Screens (≥1920px)

Content is constrained by `--anvl-content-max` (80rem) and `--anvl-content-max-wide` (96rem). Full-bleed backgrounds extend to the viewport edge, but text and product content stay within the max-width column.

Never let text blocks stretch to full width on ultrawide — readability breaks at very long line lengths.

---

## Images

- Always set `width` and `height` attributes to prevent layout shift (CLS)
- Use `loading="lazy"` on images below the fold
- Use `loading="eager"` + `fetchpriority="high"` on LCP images (hero)
- Mobile: compress aggressively. Serve AVIF > WebP > JPEG
- Use `object-fit: cover` for images in fixed-size containers

---

## Forms and Inputs

### iOS zoom prevention

iOS Safari zooms in when an input has `font-size < 16px`. Prevent with:
```tsx
<input className="text-base md:text-sm ..." />
```

### Full-width forms on mobile

```tsx
<form className="space-y-4">
  <input className="w-full ..." />
  <button className="w-full sm:w-auto ..." />
</form>
```

---

## Admin Responsiveness

Admin is **desktop-first** (optimized for ≥1024px), but must degrade gracefully:

- Below 1024px: `AdminSidebar` becomes a `Drawer`
- Below 768px: data tables collapse to card/list layouts
- Never ship an admin layout that horizontally scrolls the entire page viewport

---

## Responsive Design Checklist (before merging)

- [ ] Tested at 375px (small phone)
- [ ] Tested at 768px (tablet)
- [ ] Tested at 1280px (desktop)
- [ ] No horizontal scroll on any viewport
- [ ] Touch targets ≥44px for mobile-accessible controls
- [ ] Inputs use `text-base` on mobile (no iOS zoom)
- [ ] Responsive type scale (no raw `text-6xl` on mobile)
- [ ] Images have `width`, `height`, `alt`
- [ ] The Oath cinematic disabled below 1280px; generic GSAP disabled on mobile
- [ ] Sticky bars include safe-area-inset bottom padding
- [ ] Grids not 3+ columns at <360px
