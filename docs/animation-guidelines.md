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
`≥768px` + `prefers-reduced-motion: no-preference`, with the three.js import
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

Every GSAP animation must use `gsap.matchMedia` with both viewport AND reduced-motion gates:

```tsx
const mm = gsap.matchMedia()

// Desktop + full motion: run the cinematic animation
mm.add(
  '(min-width: 768px) and (prefers-reduced-motion: no-preference)',
  () => {
    // full GSAP animation here
    return () => ctx.revert() // cleanup
  }
)

// Mobile or reduced motion: snap to final state immediately
mm.add(
  '(max-width: 767px), (prefers-reduced-motion: reduce)',
  () => {
    gsap.set('.element', { opacity: 1, y: 0 }) // final state, no animation
  }
)

// Always clean up
return () => mm.revert()
```

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
- `webgl/` — `OathCanvasGate` (client + `isWebglAvailable()` + `≥768px` + reduced-motion gate, three.js behind `React.lazy` → `vendor-three` chunk), `OathCanvas`, `Monolith`, `DustMotes`.
- `content/` — `oathContent.schema.ts` + `resolveOathContent.ts`: CMS copy overrides with designed code defaults.

Mobile / reduced motion: `buildOathStatic.ts` `gsap.set`s every scene to its final state and the WebGL canvas never mounts — the page renders as a static stacked layout.

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

Standard durations:
- Micro (hover, focus): 150–220ms
- Component (mount, modal): 300–400ms
- Section reveal: 500–700ms
- Cinematic sequence: 600ms–1200ms per beat

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
