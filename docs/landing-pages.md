# Landing Pages — Code-Owned Architecture

ANVL landing pages are **static, cinematic, code-owned experiences**. They live in the codebase (one folder per page), not in the CMS. The CMS stores **which** coded page is active, assigns media to code-defined asset slots, and may override per-scene **copy** through `landing_content` — with code defaults filling every gap, so an empty CMS still renders the complete designed page. Drop 01 — The Oath is currently the only registered page.

This replaces the legacy drop-builder "acts" system on the public home route.

---

## How it works

```
CMS (activeLandingPageKey)
   → getActiveLandingPageKey()                  src/features/landingPages/activeLandingPage.ts
   → resolveLandingPage(key)  ── invalid? ──▶ DEFAULT_LANDING_PAGE_KEY ('the-oath')
   → <LandingPageRenderer>    (Suspense + branded fallback)
   → lazy page component      e.g. pages/TheOathLanding
```

- **Registry** (`src/features/landingPages/registry.ts`) is the single source of truth. Each entry is metadata + a `lazy()` component, so only the active page's JS chunk ships to the browser.
- **Resolution never throws.** An unknown, missing, or disabled key degrades to the default page — the storefront is never blank.
- **Products flow in at runtime** (`LandingPageComponentProps.products` + `props.assets`) from the storefront loader. Commerce: Shopify when configured, else seed/mock. CMS asset overrides merge via `resolvePublishedAssets`.

The home route (`src/routes/index.tsx`) resolves the key in its loader and renders `<LandingPageRenderer>`.

### The Oath — continuous forge + horizontal banner reveal (2026-06-06)

The Oath is composed to read as **one continuous scene**, not stacked sections:

- A fixed themed void backdrop + transparent WebGL canvas sit behind every scene. Scenes are transparent (transparent section backgrounds, `OathMediaFallback`) so the monolith + dust environment bleeds through. Adjacent scenes **dissolve into shadow** at their seams via `OathSceneSeam` — a decorative, theme-driven (`--color-bg`) top/bottom feather overlay (below copy `z-10`, above scene media) so boundaries never meet at a hard edge.
- **Product reveal** (`components/ProductRevealSequence.tsx`) is a single pinned scene where the three pieces assemble **horizontally** as `WarBanner`s: the outer two slide in from the left/right edges and the centre drops onto a forged rail, so vertical scroll reads as a sideways march. All motion lives in `buildProducts` (`hooks/useTheOathScrollTimeline.ts`) under `gsap.matchMedia` — desktop/tablet pin + scrub; mobile + reduced-motion stack vertically and reveal (no pin, content always CSS-visible). Live product images/prices/links drop in via the existing `ResolvedProduct` map; missing art falls back to the banner's duotone + emblem placeholder.

---

## Adding a new landing page

1. Create the page folder:

   ```
   src/features/landingPages/pages/<PascalName>/
     index.tsx          # exports a component taking LandingPageComponentProps
     data.ts            # static copy (+ product fallback)
     hooks/             # scroll/timeline GSAP hooks (logic lives here, not in components)
     components/         # thin scene components (markup + data-* motion hooks)
   ```

   `index.tsx` must export a named component **and** a default:

   ```tsx
   export function MyLanding({ products }: LandingPageComponentProps) { /* ... */ }
   export default MyLanding
   ```

2. Register it in `src/features/landingPages/registry.ts`:

   ```ts
   'my-landing': {
     key: 'my-landing',
     name: 'Drop 02 — My Landing',
     description: 'Short picker description.',
     previewImage: '/brand/my-preview.svg',
     isAvailable: true,
     component: lazyPage(() => import('./pages/MyLanding'), 'MyLanding'),
   },
   ```

3. Insert a `landing_pages` row (key must match registry) and add asset slots to `assetSlots.ts`.

4. (Optional) Activate from the CMS Dashboard picker.

### Animation rules (non-negotiable)

Mirror `pages/TheOathLanding/hooks/useTheOathScrollTimeline.ts`:

- All GSAP uses `gsap.matchMedia` with desktop / tablet / static branches; pinned + scrubbed cinema runs only on `(min-width: 768px) and (prefers-reduced-motion: no-preference)`. Mobile + reduced-motion get a **no-pin** branch with light reveals.
- Content is **CSS-visible by default** — initial hidden states are set INSIDE the motion branches only. No hidden-content failure mode on mobile / reduced motion / no-JS.
- Animate `transform`/`opacity` only (no layout props). `mm.revert()` on cleanup (kills pinned ScrollTriggers). Use `useGSAP` with a `scope` ref; keep timeline logic in the hook, not the components.
- Import GSAP from `@/shared/lib/gsap`, never from `gsap` directly. Lenis via `useLenisScroll` only.

---

## Activating a landing page from the CMS

1. Admin **Dashboard** loads picker options from Supabase `landing_pages`, intersected with the code registry (fallback: registry only when offline).
2. Editor selects a drop → confirms in a modal → writes `cms_settings.active_landing_page_key`.
3. `adminCmsRemoteSync` mirrors the key onto `storefront_publication`.
4. Storefront loader calls `getActiveLandingPageKey()` → `resolveLandingPage(key)` with registry fallback.

---

## CMS asset overrides

Asset slots are **code-defined**; the CMS assigns media library IDs to slots.

1. Each page exports slots (e.g. `theOathAssetSlots.ts`) and registers them in `src/features/landingPages/assetSlots.ts`.
2. Admin **Assets** (`/admin/assets`) uploads files and assigns slots under **General** or per-drop tabs.
3. Assignments persist to `cms_settings.asset_config` as `{ general: { slot: mediaId }, drops: { dropKey: { slot: mediaId } } }`.
4. On publish/sync, `media_index` on `storefront_publication` carries public URLs.
5. `resolvePublishedAssets` merges general + active-drop slots; landing components read `props.assets` first, then code fallbacks in `theOathAssets.ts`.

When adding a new drop landing page, add slots in code and `INSERT INTO landing_pages` with a matching `key`.

---

## Drop 01 — The Oath (merged cinematic WebGL + GSAP film, 2026-06-20)

`pages/TheOathLanding` (`key: 'the-oath'`) is the **single** Drop 01 landing — one continuous pinned/scrubbed scroll film that merges both former Oath experiences: the scroll-scrubbed video hero + horizontal product assembly, and the true-3D drop emblem, particle field, custom cursor, magnetic CTAs, manifesto, tenets, and forge-in finale. Scene components render only markup + `data-*` hooks; **all** GSAP logic lives in `hooks/useTheOathScrollTimeline.ts`, which composes the per-scene `motion/buildOath*.ts` builders. Copy and media are CMS-editable with code defaults filling every gap.

A **fixed transparent WebGL canvas** (the 3D monolith logo + dust particles) sits *above* the hero video film but *below* all DOM content, so the emblem reads over the video, drifts to centre at a **constant small size** through the hero, recedes (darkens, sinks in Z — **no shrink**) through the middle scenes, then returns centre, **enlarges**, and lerps to a **primary→accent theme gradient** for the finale.

> **Gotcha (load-bearing):** the WebGL scene has **no environment map**, so high-metalness PBR materials render near-black — emblem/monument materials must stay low-metalness and rely on explicit lights. And `SVGLoader` parses as strict `image/svg+xml`: a drop-mark SVG with any invalid-XML byte (e.g. a stray control char) yields **0 paths silently** and the emblem won't render even though it displays fine as an `<img>`. Keep brand SVGs valid XML.

| Scene | `data-scene` | DOM (GSAP) | WebGL |
|---|---|---|---|
| Intro | — | `components/LandingPreloader.tsx` — CSS veil: Drop mark + `DROP 01 — THE OATH` resolve, then lifts | — |
| 01 Hero | `hero` | **Exactly one screen tall** (`--anvl-section-h` = svh − header, so the "Approach" cue shows without scrolling) and flush under the nav (the copy scrim extends up under the header — no seam at rest). Pinned; a **contained, right-anchored video panel** (`[data-hero-media]`, full-bleed on mobile, width-capped on tablet/desktop) whose **edges feather into shadow** (`MEDIA_FEATHER_MASK`, esp. the right edge — no hard cut-off) and whose video is **fully opaque** (legibility via a left copy scrim, not by dimming). Scroll-scrubbed (`buildOathHero` drives `currentTime`) **and drifts right→centre** across the pin; blur-rise headline + Ken Burns intro, magnetic CTAs, and the **cursor spotlight reveal** (`buildOathSpotlight`) — a full-bleed, stationary layer exposing `heroRevealMedia` over the base video | Monolith emblem sits **small, above the eyebrow**, and **only drifts to centre — staying the same small size** through the hero/middle (`heroProgress`); it enlarges **only at the finale**. dust drifts and parts around the cursor (`DustMotes`) |
| 02 Manifesto | `manifesto` | Pinned; creed lines reveal word-by-word (SplitText), backdrop push-in | Emblem recedes/darkens at its **constant small size** — no shrink (`manifestoProgress`); dust slows |
| 03 Tenets | `tenets` | Pinned **horizontal panorama** — four vows pan sideways on an `xPercent` track during the vertical pin | Emblem held receded behind the panel (`tenetsActive`) |
| 04 Products | `products` | Pinned **horizontal banner assembly**: the three pieces march in as `WarBanner`s; live images/price/links → curated taglines + duotone placeholders | Hovered piece lifts the dust glint (`hoveredPiece`) |
| 05 Finale | `finale` | Crest forge-in + SplitText title + rule ignition + brand block rise; CTAs release into the normal footer (never trapped) | Emblem returns centre + front, **enlarges**, and tints to a **primary→accent gradient** so it separates from the heading-coloured copy (`finaleProgress`) |

**Responsive motion** (`useTheOathScrollTimeline`, via `gsap.matchMedia`):
- **Desktop ≥1024px** — full pinned/scrubbed cinematic at intensity 1, WebGL + cursor + spotlight on.
- **Tablet 768–1023px** — same pins, intensity 0.7 (shorter scrub distances), smaller spotlight radius.
- **Mobile <768px OR `prefers-reduced-motion`** — `buildOathStatic`: **no pinning**, no WebGL, no spotlight; scenes lay out in normal flow (CSS-visible) and reveal with light fade-ins; videos held on frame 0 under reduced motion. No scroll-jacking, no hidden-content failure mode.

`mm.revert()` on cleanup kills every pinned ScrollTrigger. Lenis smooth-scroll is enabled by the home route (`useLenisScroll`, self-gating to desktop + no-reduced-motion) and kept in lockstep with ScrollTrigger.

## Entry moment + assets

- **Preloader** (`components/LandingPreloader.tsx`) — the Drop 01 mark resolves with a thin progress line, then the veil lifts. Pure CSS (`.anvl-preloader*` in `styles.css`): renders in SSR, no hydration state, `pointer-events-none` (never traps the page), auto-dismisses, and collapses instantly under `prefers-reduced-motion`.
- **Asset fallback** (`theOathAssets.ts`) — code defaults; CMS overrides via `bindOathCmsAssets(props.assets)`. Missing media resolves to duotone + Drop-logo placeholder via `OathMediaFallback`. The Drop logo (`dropLogo`, `/brand/the-oath-shape.svg`) doubles as the 3D extrude source — keep it valid SVG XML.

### Architecture (mirror this for future WebGL pages)

- **Motion state bridge** (`motion/oathMotionState.ts`, `OathMotionState`) — a plain mutable object in a ref, provided via `OathMotionContext`. ScrollTrigger callbacks and the pointer hook **write** progress/pointer numbers; the canvas's `useFrame` **reads** and lerps shader uniforms toward them. No React state, no re-renders, scrub jitter never reaches the GPU. A **single smoothed pointer source** (`hooks/usePointerMotion.ts`) feeds both the cursor dot/ring and the spotlight reveal — no second RAF loop.
- **Canvas gate** (`webgl/OathCanvasGate.tsx`) — three.js loads only when: client-mounted + `isWebglAvailable()` + `≥768px` + no reduced motion. `OathCanvas` is a `React.lazy` default export, so three lands in the existing `vendor-three` chunk; phones never download it.
- **Content model** (`content/`) — `oathContent.schema.ts` (Zod, all-optional, strict) + `oathContent.defaults.ts` (the complete designed copy: hero, manifesto, tenets×4, products heading + per-slug taglines, finale) + `resolveOathContent` (per-field merge; blank/whitespace = use default). The raw slice arrives via `LandingPageComponentProps.landingContent` from `storefront_publication.landing_content['the-oath']`; edited at `/admin/content`.
- **Assets** (`theOathAssetSlots.ts` / `theOathAssets.ts`) — hero video/image slots (`heroDesktopVideo`, `heroMobileVideo`, `heroMedia`), the SVG `dropLogo` (3D extrude source) + `crestSvg`, `manifestoMedia`, `chapterMedia1–4` (tenet planes), `productImage1–3`, and the optional **`heroRevealMedia`** (revealed under the spotlight; falls back to a theme-tinted gradient). Missing media falls back to `OathMediaFallback` (DOM duotone + drop mark via `OathCmsMark`).
- **Cursor spotlight reveal (Lithos-adapted)** — `buildOathSpotlight` drives `--spotlight-x/--spotlight-y` CSS vars via `gsap.quickSetter` inside a single `gsap.ticker` lerp; a `radial-gradient` `mask-image` exposes the reveal layer. No per-frame `toDataURL`. Desktop fine-pointer only; hidden under reduced-motion/mobile/no-WebGL.
- **Micro-interactions** — `motion/attachMagnetics.ts` (`[data-magnetic]` lean-in), `components/OathCursor.tsx` (page-scoped dot+ring cursor, `data-cursor` states, fine-pointer desktop only), `components/OathProgressRail.tsx` (fixed scene rail), `components/OathCtaLink.tsx` (shared `buttonVariants` + magnetic + `data-cursor`). A fixed top scrim keeps the transparent nav legible over the scene.
- **Hero polish tokens** — shared premium ease `cubic-bezier(0.16, 1, 0.3, 1)`; headline blur-rise via the extended `motion/splitTextReveal.ts`; Ken Burns intro on the hero media; the hero uses `100dvh` so mobile browser chrome doesn't clip it.
- **SplitText** — registered in `src/shared/lib/gsap.ts` (free since GSAP 3.13); use the `motion/splitTextReveal.ts` wrapper and always revert in cleanup.
- **Theme** — one global CMS theme. DOM uses `--color-*` CSS vars; WebGL reads the **same** vars via `readOathBrandColors()` (`webgl/oathBrandColors.ts`). No per-page palette override.

## What remains for Shopify

The banner cards already consume the storefront `Product` shape via the commerce client, so no card changes are needed when Shopify is connected. When `VITE_SHOPIFY_*` is set, `createCommerceClient` returns the Shopify adapter and `getHomeProducts()` returns live Shopify products — the landing page renders them automatically.
