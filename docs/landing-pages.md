# Landing Pages — Code-Owned Architecture

ANVL landing pages are **static, cinematic, code-owned experiences**. They live in the codebase (one folder per page), not in the CMS. The CMS does not compose landing sections anymore — it only stores **which** coded page is active.

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

- A fixed `ForgeAtmosphere` (`shared/components/premium`) sits behind every scene. Scenes are transparent (`MediaPlane transparent`, transparent section backgrounds) so the shared ember/grain environment bleeds through — no opaque per-section seams.
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

## Drop 01 — The Oath (cinematic scroll experience)

`pages/TheOathLanding` is a **scroll-driven cinematic brand film** — full-bleed media planes with parallax (scroll = camera), not stacked fade-in sections. The whole journey is one continuous pinned + scrubbed timeline; scene components only render markup + `data-*` hooks; **all** GSAP logic lives in `hooks/useTheOathScrollTimeline.ts`. Media falls back to duotone + Drop-logo placeholders, so the page is award-clean even with zero real assets.

| Scene | File | Motion (desktop/tablet) |
|---|---|---|
| Intro | `components/LandingPreloader.tsx` | CSS veil: Drop mark + `DROP 01 — THE OATH` resolve, then lifts to hero |
| 01 Hero | `components/CinematicHero.tsx` | **Scroll-scrubbed background video** (`/videos/WarriorHero1.mp4`): the hero pins and the video's `currentTime` is driven by scroll progress (`buildHero` in the timeline hook). Line-masked `FORGED UNDER PRESSURE` over it. Mobile = muted loop; reduced-motion = first frame held |
| 02 Manifesto | `components/ManifestoScene.tsx` | Pinned; slow media push-in; two lines mask up |
| 03 Tenets (chapter gallery) | `components/ChapterGallery.tsx` | Pinned; four full-bleed chapters **cross-dissolve** as you scrub (the Lando gallery feel). Mobile: vertical full-bleed blocks |
| 04 Product reveal | `components/ProductRevealSequence.tsx` (`ProductScene`) | Each piece near-full-viewport; product plane scrubs scale + rotateY in, type slides; live images/price/links → curated copy + placeholders |
| 05 The Drop | `components/FinalDropCTA.tsx` | `#oath` anchor; CTA + ANVL wordmark/tagline mask up; releases into the normal footer (never trapped) |
| — Media plane | `components/MediaPlane.tsx` | **Core building block**: full-bleed video/image, else duotone + Drop-logo placeholder; carries the parallax `data-*` marker; vignette/grain |
| — Primitives | `SceneMeta.tsx`, `ScrollCue.tsx`, `OathCtaLink.tsx` | Coordinate metadata, scroll affordance, hash-aware CTA |

**Responsive motion** (`useTheOathScrollTimeline`, via `gsap.matchMedia`):
- **Desktop ≥1024px** — full pinned/scrubbed cinematic at intensity 1.
- **Tablet 768–1023px** — same pins, intensity 0.7 (shorter scrub distances).
- **Mobile <768px OR `prefers-reduced-motion`** — **no pinning**; scenes lay out in normal flow (CSS-visible) and reveal with light `[data-reveal-m]` fade-ins. No scroll-jacking, no hidden-content failure mode.

`mm.revert()` on cleanup kills every pinned ScrollTrigger. Copy lives in `data.ts`. Lenis smooth-scroll is enabled by the home route (`useLenisScroll`, self-gating to desktop + no-reduced-motion) and kept in lockstep with ScrollTrigger.

---

## Entry moment + assets

- **Preloader** (`components/LandingPreloader.tsx`) — the Drop 01 mark resolves with a thin progress line, then the veil lifts. Pure CSS (`.anvl-preloader*` in `styles.css`): renders in SSR, no hydration state, `pointer-events-none` (never traps the page), auto-dismisses, and collapses instantly under `prefers-reduced-motion`.
- **Asset fallback** (`theOathAssets.ts`) — code defaults; CMS overrides via `bindOathCmsAssets(props.assets)`. Missing media resolves to duotone + Drop-logo placeholder via `MediaPlane`.
- **Hooks** — `usePreloadLandingAssets` (warms only assets that exist), `useResponsiveMotionConfig` (component-level tier/reduced/cinematic view).

### Required assets (drop real exports in, then fill `theOathAssets.ts`)

Put files under `public/brand` or `public/drops/oath/`, then set the matching key:

| # | Asset | `theOathAssets.ts` key |
|---|---|---|
| 1 | Drop 01 — The Oath logo (SVG/PNG) | `dropLogo` ✅ exists (`/brand/the-oath-shape.svg`) |
| 2 | ANVL wordmark (SVG) | `anvlWordmark` ✅ exists |
| 3 | ANVL crest/emblem (SVG) | `crestSvg` |
| 4 | Hero forge/industrial/smoke background (image or video) | `forgeBackgroundImage` |
| 5 | Smoke overlay (transparent WebM/MP4) | `smokeVideo` |
| 6 | Sparks overlay (transparent WebM/MP4) | `sparksVideo` |
| 7 | Metal / noise texture | `metalTexture`, `noiseTexture` |
| 8–13 | Product renders (Oversized Tee, Stringer, Compression Tee — front/back) | `productImages[slug]` |
| 14 | Optional athlete/model in ANVL | `heroAthleteImage` |
| 15 | Optional product rotation videos / sequences | (add when needed) |
| 16 | No audio — do not add autoplay sound | — |

Until provided, the page renders fully with the Drop logo placeholder + CSS-only forge embers (no missing-file requests).

## What remains for Shopify

The banner cards already consume the storefront `Product` shape via the commerce client, so no card changes are needed when Shopify is connected. When `VITE_SHOPIFY_*` is set, `createCommerceClient` returns the Shopify adapter and `getHomeProducts()` returns live Shopify products — the landing page renders them automatically.
