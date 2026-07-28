# Animation Guidelines

## Philosophy

Animation at ANVL is brand communication, not decoration. Every animation should:
- Reinforce the brand identity (forged, disciplined, cinematic, industrial)
- Guide the user's attention or reveal content meaningfully
- Feel premium and intentional — never cheap, random, or performative

Avoid animations that:
- Distract from product or content
- Feel over-engineered or show-offy
- Hurt readability or usability
- Slow down the page

---

## Three Animation Systems

### 1. GSAP (cinematic desktop sequences)

Use for: hero sections, scroll-pinned storytelling, ScrollTrigger reveals, product reveals, cinematic timelines.

Best for: complex, multi-step, scroll-driven experiences.

Reference: `src/features/landingPages/pages/TheOathLanding/` — its `hooks/useTheOathScrollTimeline.ts` orchestrates the per-scene `motion/buildOath*.ts` builders.

### 2. Framer Motion (lightweight browser animations)

Use for: page transitions, component mount/unmount, UI micro-interactions, staggered list reveals, modal animations.

Best for: simple declarative animations tied to state changes.

### 3. CSS transitions / animations

Use for: hover states, focus rings, button press effects, color transitions.

Best for: purely presentational, immediate, state-driven.

---

## GSAP Rules

### Registration (one place only)

```ts
// src/shared/lib/gsap.ts — the ONLY place plugins are registered
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)
}

export { gsap, ScrollTrigger, SplitText, useGSAP }
```

Always import from `src/shared/lib/gsap.ts`, never directly from the `gsap` package in component files.

### SplitText (char/word/line reveals)

SplitText is free since GSAP 3.13 and registered alongside ScrollTrigger. Use
the page-level wrapper (`TheOathLanding/motion/splitTextReveal.ts` is the
reference — it also drives the hero's blur-rise) with `mask` for the
overflow-clipped reveal look; SplitText's
default `aria: 'auto'` keeps the original text readable to assistive tech.
**Always call the returned `revert()` in the matchMedia cleanup** so static
branches get the untouched DOM back. Only split inside desktop/tablet motion
branches — static branches reveal the unsplit block.

### DOM ⇄ WebGL motion bridge (The Oath pattern)

When GSAP must drive WebGL uniforms, never subscribe React state to scroll.
Use a plain mutable object held in a ref (`motion/oathMotionState.ts`):
ScrollTrigger `onUpdate` **writes** progress numbers; the R3F `useFrame`
**reads** and lerps real uniforms toward them. The lerp smooths scrub jitter
and the bridge costs zero re-renders. The same object also carries the single
smoothed **pointer** position (`usePointerMotion`), so the custom cursor and
the hero spotlight reveal share one source instead of running parallel RAF
loops. WebGL itself mounts only behind a gate: client + `isWebglAvailable()` +
`≥1280px` + `prefers-reduced-motion: no-preference` (The Oath — see `oathBreakpoints.ts`), with the three.js import
behind `React.lazy` so it stays in the `vendor-three` chunk.

### useGSAP hook

Always use `useGSAP` from `@gsap/react`. It handles cleanup automatically.

```tsx
import { useGSAP } from '@/shared/lib/gsap'

useGSAP(() => {
  gsap.from('.element', { opacity: 0, y: 20, duration: 0.6 })
}, { scope: containerRef })
```

### The dual gate (REQUIRED for all GSAP animations)

Every GSAP animation must use `gsap.matchMedia` with both viewport AND reduced-motion gates.

**Default storefront pattern** (non-Oath components):

```tsx
mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => { /* animation */ })
mm.add('(max-width: 767px), (prefers-reduced-motion: reduce)', () => {
  gsap.set('.element', { opacity: 1, y: 0 })
})
```

**The Oath landing** — import from `oathBreakpoints.ts`:

```tsx
mm.add(OATH_DESKTOP_CINEMATIC_MQ, () => { /* pinned cinematic */ })
mm.add(OATH_STATIC_MQ, () => { /* buildOathStatic — no pins */ })
```

### Gotcha: `ctx.contextSafe()` inside `matchMedia().add()` type-checks but throws at runtime

`gsap.matchMedia().add(queries, (ctx) => { ... })` passes each callback a
`Context`-shaped first argument. Calling `ctx.contextSafe()` on it **compiles
cleanly** — GSAP's `Context` type carries an index signature alongside its
declared `add`/`ignore`/`kill`/`revert`/`clear` methods, so TypeScript accepts
any property name off it, `contextSafe` included. It is not actually there:
`mm.add()` invokes the callback with `contextSafe` as its **second**
parameter, not a method on the first. The call throws at runtime —
`ctx.contextSafe is not a function`.

```tsx
// Wrong — type-checks, throws when the media query first matches:
mm.add(queries, (ctx) => {
  const safe = ctx.contextSafe() // TypeError at runtime
})

// Right — contextSafe is the callback's second argument:
mm.add(queries, (ctx, contextSafe) => {
  const safe = contextSafe!(() => { /* ... */ })
})
```

**No test in this codebase catches this.** jsdom has no layout engine, so a
`ScrollTrigger`-gated callback (`onEnter`, etc.) that would exercise the code
path calling `contextSafe()` never actually fires under Vitest — the test
suite stays green while the real browser throws. This cost real debugging
time once (`src/features/support/hooks/useSchematicDrawIn.ts`, guide
schematic draw-in, 2026-07-28) — if a `matchMedia` callback needs a
GSAP-context-scoped async handler, hold the timeline in a closure variable
and `revert()`/`kill()` it from the outer cleanup instead of reaching for
`contextSafe()`.

### ScrollTrigger

- Refresh after content changes: `ScrollTrigger.refresh()`
- Add `markers: true` during development for debugging
- Use `pin: true` for cinematic pinned sequences
- Use `scrub` for scroll-tied animations
- Avoid scroll-jacking (`scrub` with long durations can feel like jacking — test carefully)
- Always clean up: `ScrollTrigger.getAll().forEach(st => st.kill())`

### Cleanup

`useGSAP` handles this automatically. For raw GSAP code outside a hook:
```ts
const ctx = gsap.context(() => {
  // animations
}, containerRef)

return () => ctx.revert()
```

### What to animate

Good: `transform` (x, y, scaleX, scaleY, rotation), `opacity`, `filter` (blur, brightness)

Bad (causes layout): `width`, `height`, `top`, `left`, `margin`, `padding`

---

## Lenis (smooth scroll)

- Only use via `useLenisScroll()` hook (`src/shared/hooks/useLenisScroll.ts`).
- Lenis is desktop-only (≥768px breakpoint) AND `prefers-reduced-motion: no-preference`.
- Never call `new Lenis()` directly in a component.
- Lenis and GSAP ScrollTrigger must be connected (`ScrollTrigger.scrollerProxy`).

---

## The Oath cinematic landing

The single code-owned landing page `TheOathLanding` (`src/features/landingPages/pages/TheOathLanding/`) is the most complex animation in the project — it merges the former Oath I + Oath II pages into one scroll-pinned WebGL + GSAP experience.

Architecture:
- `index.tsx` — page shell; mounts scenes (`OathHero`, `OathManifesto`, `OathTenets`, `ProductRevealSequence`, `OathFinale`) + the lazy WebGL canvas.
- `hooks/useTheOathScrollTimeline.ts` — the single GSAP `matchMedia` timeline that sequences the per-scene `motion/buildOath*.ts` builders (hero, manifesto, tenets, products, rail, finale, plus `buildOathStatic.ts` for the reduced-motion / mobile branch).
- `motion/oathMotionState.ts` — the mutable ref bridge: ScrollTrigger `onUpdate` writes progress; R3F `useFrame` reads + lerps WebGL uniforms (zero re-renders). Also carries the smoothed pointer.
- `webgl/` — `OathCanvasGate` (client + `isWebglAvailable()` + **`≥1280px`** + reduced-motion gate, three.js behind `React.lazy` → `vendor-three` chunk), `OathCanvas`, `Monolith`, `DustMotes`.
- `content/` — `oathContent.schema.ts` + `resolveOathContent.ts`: CMS copy overrides with designed code defaults.

Mobile / tablet / reduced motion: `buildOathStatic.ts` — no pins, no WebGL; static stacked layout with light reveals. Manifesto and tenets are hidden below `xl` in DOM.

---

## The About page — "The Forge Altar" (interaction-driven, not scroll-driven)

`src/features/about/` is a standalone feature (not in `landingPages/registry.ts` — About is a fixed page, never swapped like a drop) and deliberately **does not** reuse The Oath's scroll-film language. Two experiences behind one CMS contract:

- **Desktop altar** (`altar/AboutAltar.tsx`, ≥1280px + no reduced motion + WebGL, lazy chunk): a **non-scrollable** 100svh stage — a normalized, **grabbable** anvil GLB (`altar/useFittedGltf.ts`, drag to spin with inertia; bundled default `public/about/anvil.glb`, CMS-overridable) under a shader **aurora** (`altar/shaders/aurora.ts`), with the CMS-defined orbs in slow orbit (`altar/AltarOrb.tsx` — per-orb CMS color, fresnel halo + ember heart, drei `Html` labels; orbit params derived from index/count in `altar/altarOrbs.ts`). Selecting an orb (click, or its top picker chip for keyboard/AT) runs a GSAP strike timeline against the mutable `altar/altarState.ts` bridge: the orb glides to the anvil face, the hammer GLB **winds up, drops, and recoils** on a handle-end pivot constructed one arm-length from the orb seat (so the head lands on the orb), and the impact **explodes** the orb — shard burst + shockwave ring in the orb's color (`altar/AltarBurst.tsx`) plus flash light spike, camera shake, and a dust glint — then a focus-trapped modal (`altar/AboutOrbModal.tsx`) forges open out of the burst, tinted by the orb. Closing re-materializes the orb in orbit. No ScrollTrigger anywhere — event-driven GSAP timelines + `useFrame` reads only. The footer is CSS-hidden at `xl+` on `/about` so nothing scrolls.
- **`altar/altarForgeTiming.ts` is the altar's choreography clock — rule 5 of the particle-forge standard, below.** `AboutAltar` (strike timeline, 3D disintegration, the DOM ember hand-off) and `AboutOrbModal` (backdrop, panel, ignition, content stagger, stat counters) never call each other; both schedule GSAP against this module's exported `ALTAR_STRIKE` / `ALTAR_FORGE` / `ALTAR_MODAL` constants instead. Before this module existed, `AboutOrbModal` hardcoded five delays (`1.6 / 1.68 / 1.7 / 1.92 / 2.1`) that had to be hand-kept in sync with `AboutAltar`'s own tween chain — the exact drift rule 5 exists to prevent. The hand-off itself (impact → the DOM ember swarm launching from the orb's seat toward the opening modal panel) runs on the **shared canvas-2D ember-forge engine** (`src/shared/lib/forge/emberForge.ts` + `<ForgeEmberCanvas>` — see below), the same engine backing `Modal` and the toast layer, via `useAltarEmberHandoff`; the WebGL shroud burst in `altar/AltarModalForge.tsx` reads the struck orb's color through the engine's own `resolveForgeRamp(tint)`, so the 3D shroud and the DOM swarm cross-fade in the exact same color.
- **Normal page** (`mobile/AboutMobilePage.tsx`): mobile/tablet, reduced-motion, no-WebGL, and SSR/first-paint all render a clean scrolling About page (framer-motion `RevealOnScroll` only — no GSAP, no pins). **The orbs render as stacked sections** in order, each accented by its orb color.
- `content/aboutContent.schema.ts` + `resolveAboutContent.ts` — the CMS-override-with-code-defaults contract. The **orbs array is the content model** (add/edit/remove in `/admin/about`, tenets-style list ownership); per-orb images resolve from `mediaId` via the media index, falling back to the orb's page asset slot (`orbImage()`); the anvil/hammer GLBs stay asset-slot based via `resolveStorefrontPageAssets` (`asset_config.pages.about`).

## Site-wide cursor dust (`src/shared/webgl/`)

The pointer-parting dust is one shared implementation used everywhere:

- `DustField.tsx` + `dustShaders.ts` — the canonical `<points>` field; mounts inside **any** R3F canvas and lerps toward a mutable `DustDrive` (lift/glint/pointer targets). Colors read from the theme's `--particle-*` CSS vars.
- `SiteDustGate.tsx` → lazy `SiteDustLayer.tsx` — the global layer mounted once in `__root.tsx` for every storefront route: own passive pointer listener, gated to fine-pointer + no-reduced-motion + WebGL, idle-deferred so it never competes with LCP. Pages can modulate it through `siteDustState` (`pulseSiteDust()`).
- Routes with their own scene canvas (home's Oath landing, the About altar) are excluded from the global layer and mount `DustField` inside their canvas instead (Oath maps its motion state onto a drive via `OathDustDriver`) — one field, never two.

---

## Framer Motion Patterns

### Page transitions

Wrap route content in a motion container:
```tsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
>
```

### Stagger reveals

```tsx
const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08 }
  }
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
}
```

### Reduced motion

Use `useReducedMotion()` from `src/shared/hooks/useReducedMotion.ts` and short-circuit:
```tsx
const shouldReduce = useReducedMotion()
const transition = shouldReduce ? { duration: 0 } : { duration: 0.5 }
```

---

## Easing Reference

ANVL uses an ease that feels like a heavy object decelerating:

```
cubic-bezier(0.22, 1, 0.36, 1)  — fast start, smooth landing
```

For button/control transitions: `--anvl-control-transition-ease: cubic-bezier(0.22, 1, 0.36, 1)` at `--anvl-control-transition-duration: 220ms`.

Standard durations — tokenized as CSS custom properties (`MOTION_CSS_VARS` in `cmsSiteConfig.zod.ts`, theme-independent, emitted alongside the palette):
- Micro (hover, focus): `--motion-duration-fast` (140ms) / `--motion-duration-normal` (220ms)
- Component (mount, modal): `--motion-duration-slow` (320ms)
- Section reveal: `--motion-duration-section` (600ms)
- Cinematic sequence: `--motion-duration-cinematic` (900ms) per beat — a representative single value; individual Oath timeline beats still vary by hand-tuned GSAP durations, this token is a default/fallback, not a hard cap

---

## Landing motion utilities (`TheOathLanding/motion/`)

The act-preset animation system was removed. Landing motion now lives co-located with `TheOathLanding`:

| Module | Purpose |
|---|---|
| `oathMotionHelpers.ts` | Shared easing / progress helpers for the scene builders |
| `splitTextReveal.ts` | SplitText mask reveal (hero blur-rise); returns `revert()` for matchMedia cleanup |
| `oathMotionState.ts` | Mutable DOM⇄WebGL bridge ref (scroll progress + smoothed pointer) |
| `attachMagnetics.ts` / `buildOathSpotlight.ts` | Pointer-driven magnetics + hero spotlight reveal |
| `buildOath{Hero,Manifesto,Tenets,Products,Rail,Finale,Static}.ts` | Per-scene timeline builders, sequenced by `useTheOathScrollTimeline.ts` |

Any landing motion that uses GSAP must:
1. Import from `src/shared/lib/gsap.ts`
2. Gate animations with `gsap.matchMedia` (viewport + reduced motion)
3. Clean up with `mm.revert()` (and any SplitText `revert()`) on unmount

---

## The shared canvas-2D ember-forge engine (`src/shared/lib/forge/`)

A smaller, sibling system to the WebGL particle-forge standard below — a
lightweight canvas-2D ember burst for **UI chrome**, not full cinematic
scenes. One engine now backs three call sites:

- `Modal` (via `ModalForgeEffect` → `<ForgeEmberCanvas>`) — the forge burst
  that plays under every modal panel materializing.
- The toast layer (`ToastForgeEffect`, `AnvlToaster`) — a persistent
  full-viewport canvas juggling several concurrent per-toast passes; it calls
  the engine's functions directly rather than mounting `<ForgeEmberCanvas>`
  (toasts can restack and forge concurrently, which doesn't fit a
  single-target-single-pass component).
- The About altar's ember hand-off (`useAltarEmberHandoff`,
  `altar/altarEmberHandoff.ts`) — the DOM swarm that launches from the struck
  orb's seat toward the opening modal panel, cross-fading with the WebGL
  shroud burst inside `altar/AltarModalForge.tsx`.

Architecture:

- `src/shared/lib/forge/emberForge.ts` — the framework-agnostic maths. No
  React, no DOM mounting. Exports `ForgeRect`, `ForgeRamp`, `Ember`,
  `ForgeMotionTuning`, `walkRectPerimeter`, `resolveForgeRamp`, `buildEmbers`,
  `drawForgeFrame`, `projectEmber`, `FORGE_DURATION_MS` (950 — the one
  canonical pass length every dialog/toast/hand-off shares), and two tuning
  presets, `MODAL_FORGE_TUNING` / `TOAST_FORGE_TUNING` — each surface's
  dissolve curve, stagger rate, alpha weighting, spread/radius ranges and
  landing jitter are independently pinned by a regression test, so the two
  presets can never silently re-converge or drift apart.
- `src/shared/lib/forge/forgeSurface.ts` — the surface-sizing maths split out
  once `emberForge.ts` hit the 500-line hard limit: `FORGE_MAX_DPR` (1.5 — a
  measured no-op for raster cost but a real win for compositor surface size),
  `forgeSwarmBounds`, `clampBoxToViewport`, `containsBox`, `unionBox`.
- `src/shared/components/ui/ForgeEmberCanvas.tsx` — the React shell: sizes and
  positions the `<canvas>` to the swarm's own bounding box (not the whole
  viewport) when it can, the rAF loop, DPR-clamped sizing, teardown, and a
  self-contained reduced-motion gate (renders `null`).
- `resolveForgeRamp(tint?)` derives a `{ cold, ember, hot }` ramp from any
  brand or CMS color (near-white hot stop via `color-mix`), so a tinted burst
  (the About altar) and the untinted site-default burst (a plain modal or
  toast) share one formula.

**Performance note (measured, not assumed):** on this engine, pre-rendered
sprite blits measured 2.3–2.5× **slower** than the current `arc` + `fill`
path at the sizes it draws (per-draw-call bound, not fill-rate bound — see
`emberForge.ts`'s header comment for the numbers). Do not "optimize" this
engine toward sprites without re-measuring; batching `fillStyle` writes by
ramp tier and shrinking the canvas to the swarm's actual bounding box are the
two changes that measured real wins.

---

## The ANVL particle-forge standard (THE quality benchmark)

The Coming Soon ember anvil (`src/features/comingSoon/scene/`) and The Oath
hero product forge (`TheOathLanding/webgl/HeroProductParticles.tsx` +
`heroForgeShaders.ts`) define the visual bar every new cinematic surface must
meet (the product passport experience is built on the same engine —
`src/features/passport/webgl/`). The recipe, so we can repeat it:

1. **One fixed particle pool, morphed in the vertex shader.** Allocate N
   points once (10–14k). Never add/remove points — morph between pre-sampled
   targets via `aFrom`/`aTo` buffers and a `uMorph` uniform. React only writes
   uniforms/buffers; all motion is GPU work.
2. **Silhouette sampling registers particles to real pixels.**
   `sampleImageSilhouette(url, count, fit, zThickness)`
   (`src/shared/webgl/particleShapes.ts`) alpha-gates a transparent PNG into a
   particle cloud + per-point luminance `shades` (bright print details burn
   hotter). Because targets come from the same pixels as the DOM render, the
   ember form and the revealed image are registered 1:1 — the thing genuinely
   *becomes* the image.
3. **Per-seed stagger on every transition.** Each point owns an `aSeed`;
   morphs/assembly are staggered by seed (`clamp(u * (1.25 + seed*0.5) -
   seed*0.35)` + smoothstep) so the cloud dissolves and reforms organically,
   never sliding as a rigid block.
4. **The uniform vocabulary:** `uAssemble` (scatter nebula → form, entry),
   `uMorph` (shape → shape), `uBurst` (heat pulse, decays ~1.4s),
   `uReveal` (fusion: the cloud condenses/flattens/stills/all-but-vanishes
   INTO the resolving DOM render — never "parks behind" it), `uZoom` (hover
   magnetism breathe ~1.035), plus `uTime` shimmer that stills as forms settle.
5. **A shared choreography clock.** WebGL tree and DOM tree never call each
   other — both schedule GSAP against exported timing constants
   (`heroForgeTiming.ts` / `passportForgeTiming.ts`), so ember settle and DOM
   reveal land in lock-step by construction.
6. **A mutable motion-state bridge** (`oathMotionState.ts` pattern): DOM
   writes plain mutable fields (strike counters, hover 0..1, reveal 0..1,
   pointer); the R3F `useFrame` loop lerps uniforms toward them. No React
   state in the hot path.
7. **Brand-token colors only** — read `--particle-*` / palette vars at mount
   (`readOathBrandColors()` / `readThemeCssColor`); additive blending,
   `depthWrite: false`, point size hard-capped (a near-camera additive point
   can wedge the GPU).
8. **Gate + degrade:** lazy `vendor-three` import behind
   `isWebglAvailable()` + reduced-motion + viewport gates, canvas
   teardown-guard (`useCanvasTeardownMark`/`useCanvasMountGate`), context-lost
   self-heal remount. The DOM-only choreography must stand alone as the
   fallback — WebGL is a layer, never a dependency.
9. **Feel targets:** entry assembly ~2.4s, morphs ~1.6s `power2.inOut`,
   bursts decay ~1.4s `power2.out`, reveal ~0.9s starting ~0.1s before the
   morph settles (the render resolves *out of* the settled cloud). Everything
   eases; nothing pops.

---

## Performance

- Never block the main thread with heavy GSAP setup — defer to `useGSAP` lifecycle
- Avoid creating thousands of GSAP tweens (batch with `gsap.utils.toArray`)
- Use `will-change: transform` sparingly — only on actively animating elements
- Remove `will-change` after animation completes
- Preload hero images before starting scroll-triggered reveals
- On mobile: zero GSAP, minimum Framer Motion, CSS only

---

## CSS Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  /* Tighten all CSS transitions */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

This is handled globally in `src/styles.css`. The GSAP `mm.add` approach handles it for JS animations.

---

## What Not To Do

- Never register GSAP plugins in component files
- Never call `new Lenis()` directly
- Never animate `width`, `height`, `top`, `left` — use `transform`
- Never run GSAP/ScrollTrigger code on server (guard with `typeof window !== 'undefined'`)
- Never run cinematic animations on mobile
- Never ignore `prefers-reduced-motion`
- Never scatter animation timelines across unrelated files — keep them co-located with the component or in a dedicated hook
- Never forget to clean up GSAP contexts and ScrollTriggers
