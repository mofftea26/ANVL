# Performance Guidelines

## Philosophy

Performance is not optional at ANVL. The brand is premium — a slow or janky experience breaks the brand identity as much as bad design does.

Key targets:
- Fast first load on mobile (Lebanon has variable mobile network conditions)
- Smooth animations at 60fps on desktop
- No layout shifts (CLS)
- Responsive to user input within 100ms

---

## Bundle Strategy

### Run analyze first

Before adding any heavy dependency or making bundle changes:
```bash
pnpm analyze
```
This builds with `ANVL_ANALYZE=1` and opens `dist/stats.html` with a treemap.

### Current chunk split

| Chunk | What goes in it |
|---|---|
| `vendor-react` | `react`, `react-dom` |
| `vendor-tanstack` | All `@tanstack/*` packages |
| `vendor-gsap` | GSAP + ScrollTrigger + useGSAP |
| `vendor-lenis` | Lenis |
| `vendor-framer-motion` | Framer Motion |
| `vendor-zod` | Zod |
| `act-presets-<nature>` | Act preset per nature (auto-chunked) |
| Admin routes | Lazy via `lazyRouteComponent` |

When adding a new heavy dependency (>50KB gzipped), add it to `manualChunks` in `vite.config.ts`.

### Admin / storefront boundary

The storefront entry chunk must **not** import `src/features/admin/**` runtime code. This is the single biggest bundle-size risk.

Check by running `pnpm analyze` and verifying admin modules don't appear in the storefront chunks.

### Act presets

Act presets are lazily loaded per-component. Each nature's presets share a chunk (`act-presets-hero`, `act-presets-productShowcase`, etc.). A page loads only the act presets that are actually rendered.

---

## Code Splitting Rules

### Admin routes (REQUIRED)

Every admin route **must** use `lazyRouteComponent`:
```ts
const AdminDropEditor = lazyRouteComponent(
  () => import('./-dropEditorPage'),
  'DropEditorPage'
)
```

### Heavy panels

Editor panels over 600 lines (e.g. `DropActsBuilderPanel`) must be loaded behind `React.lazy` + `Suspense`, keyed by tab visibility. Don't load the full editor on page mount — only when the tab is first viewed.

### lucide-react

Always use named imports:
```ts
import { Menu, ShoppingCart, X } from 'lucide-react'  // ✓
import * as Icons from 'lucide-react'                  // ✗ imports entire library
```

---

## Images

- Every `<img>` with a CMS-driven `src` needs: `width`, `height`, `loading="lazy"`, `decoding="async"`, `alt`
- LCP (Largest Contentful Paint) image: use `loading="eager"` + `fetchpriority="high"`
- Prefer AVIF > WebP > JPEG/PNG. Convert product images before adding to `public/brand/`
- Add `<link rel="preload" as="image" fetchpriority="high">` for hero images in route head
- Avoid CLS: always specify `width` and `height` (or `aspect-ratio`) on images

---

## Fonts

- Bebas Neue and Manrope are preloaded via `<link rel="preload">` in `__root.tsx`
- Only the weights actually used are imported (400, 500, 600, 700 for Manrope; 400 for Bebas Neue)
- Font files are served from the package (`@fontsource/*`) — no external requests
- Use `font-display: swap` (default for `@fontsource`)

---

## React Performance

### Avoid unnecessary re-renders

- Don't put everything in a single huge component
- Colocate state with the component that needs it (avoid lifting state unnecessarily)
- Use `React.memo` only when profiling confirms a real problem
- Use `useMemo` and `useCallback` only when profiling confirms a real problem — don't apply blindly

### Virtualization

For long lists (>50 items in shop, admin drops list, media library), consider `@tanstack/react-virtual`:
- It's already installed (`@tanstack/react-virtual`)
- Use `useVirtualizer` for window virtualization
- Use `useWindowVirtualizer` for full-page scrolling lists

### Avoid renders during scroll

- Move scroll-dependent state into Zustand stores with `getState()` access (not `subscribe` + `setState`)
- Use `requestAnimationFrame` for scroll-synced visual updates
- Use `IntersectionObserver` for "enter viewport" checks instead of scroll listeners

---

## Animation Performance

- Animate `transform` and `opacity` only — these are composited and don't trigger layout
- Never animate `width`, `height`, `top`, `left`, `margin`, `padding`
- Use `will-change: transform` on elements with active GSAP animations — remove it after the animation ends
- GSAP on mobile: zero. All GSAP ScrollTrigger sequences are gated at 768px breakpoint
- Framer Motion on mobile: minimal and short-duration only
- Avoid `FOUC` (flash of unstyled content) — preload critical fonts and apply `opacity: 0` until hydrated if needed

### Lenis

Lenis intercepts the native scroll and smooths it. This adds a small JS overhead on every scroll frame. It is therefore:
- Desktop only (≥768px)
- Only when `prefers-reduced-motion: no-preference`
- Uses `useLenisScroll` hook which handles these gates

---

## TanStack Router / Query Performance

- `defaultPreload: 'intent'` — routes preload on hover. This means route loaders run before the user clicks.
- `defaultPreloadStaleTime: 30_000` — reuse preloaded data for 30 seconds.
- Use TanStack Query for data that benefits from caching and background refetch.
- Route loaders for SSR seed data only — don't re-fetch in loaders what TanStack Query already has.
- `Promise.all` for parallel independent fetches in loaders:
  ```ts
  loader: async () => {
    const [products, categories] = await Promise.all([
      runtimeClients.commerce.getProducts(),
      runtimeClients.cms.getNavigation(),
    ])
    return { products, categories }
  }
  ```

---

## SSR Performance

- Route loaders run server-side — keep them fast
- Don't put slow operations (image processing, heavy computation) in route loaders
- Avoid waterfalls: `Promise.all` independent fetches
- The root loader already handles the main storefront projection fetch — don't duplicate in child routes

---

## DevTools (must not ship to production)

Gate all devtools behind `import.meta.env.DEV`:

```tsx
{import.meta.env.DEV && (
  <>
    <TanStackRouterDevtools />
    <ReactQueryDevtools />
    <TanStackDevtools />
  </>
)}
```

---

## Monitoring Bundle Size

After any PR that touches `vite.config.ts`, `package.json`, or adds new heavy components:

1. Run `pnpm analyze`
2. Check that storefront entry chunk is not growing unboundedly
3. Verify admin code is not in storefront chunks
4. Verify GSAP/Lenis/Framer Motion are in their separate vendor chunks
5. Include chunk size delta in PR description

---

## Mobile Performance Checklist

- [ ] GSAP animations disabled on mobile (≤767px)
- [ ] Lenis disabled on mobile
- [ ] Large images lazy-loaded
- [ ] Font weights limited to what's needed
- [ ] Admin routes not in storefront bundle
- [ ] No `import *` from lucide-react
- [ ] Scroll listeners use `{ passive: true }`
- [ ] No forced layout reads in scroll/resize handlers
