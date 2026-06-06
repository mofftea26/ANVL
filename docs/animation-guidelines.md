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

Reference: `src/features/marketing/components/HeroForgeSequence.tsx`, `src/features/marketing/cinematic-hero/`

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
import { useGSAP } from '@gsap/react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAP, ScrollTrigger)
}

export { gsap, ScrollTrigger, useGSAP }
```

Always import from `src/shared/lib/gsap.ts`, never directly from the `gsap` package in component files.

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

## Cinematic Hero System

The cinematic scroll hero (`cinematicScrollHero` preset) is the most complex animation in the project.

Architecture:
- `CinematicHeroRoot` — top-level container
- `CinematicScrollHero` — main scroll timeline
- `useCinematicHeroTimeline` — GSAP timeline builder
- `CinematicHeroBackground` — background media handler
- `CinematicHeroSectionView` — individual section renderer
- `cinematicHeroPhase.store.ts` — Zustand store for phase state (cinematic vs commerce nav)

The CMS config (`CinematicConfig`) controls:
- `scrollLength`: `compact | standard | extended` (maps to GSAP scroll distances)
- `navMode`: `auto | transparentTopbar | sideRail | cornerDock | commandOverlay`
- `backgroundMode`: `image | video | gradient | forgeScene`
- `sections[]`: ordered sections with content, media, animation presets

Mobile behavior: All cinematic hero sections snap to final state via `gsap.set`. The hero renders as a static stacked layout.

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

## Act Preset Animation Patterns

Reusable animation utilities for act presets (in `src/features/marketing/act-presets/shared/`):

| Utility | Purpose |
|---|---|
| `actAnimationConfig.ts` | Standard easing, duration, and timing values for acts |
| `actMotionHelpers.ts` | Framer Motion variant factory helpers |
| `useActScrollReveal.ts` | GSAP scroll reveal hook (dual-gated) |
| `useActIdleMotion.ts` | Subtle idle/ambient motion for atmospheric effect |
| `actTransitionBridge.ts` | Smooth transitions between consecutive acts |

Every act preset that uses GSAP must:
1. Import from `src/shared/lib/gsap.ts`
2. Gate animations with `gsap.matchMedia` (viewport + reduced motion)
3. Clean up with `mm.revert()` on unmount

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
