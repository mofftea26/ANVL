import { useEffect, useRef, type RefObject } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/shared/lib/gsap'
import { cn } from '@/shared/lib/cn'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import { MODAL_FORGE_TUNING, resolveForgeRamp } from '@/shared/lib/forge/emberForge'
import type { PassportEffectProps } from '../effectTypes'

/**
 * The Armory tab's ambient layer — **"The Hall Alive"**: the room notices
 * what it holds.
 *
 * Mounting reality: this layer is `absolute inset-0` inside a NON-scrolling
 * wrapper; the panel content scrolls in a SIBLING div above it (`z-[2]`). So
 * the hall can see its own furniture: `useHallGeometry` measures the armory
 * panel's real `<section>` blocks through `host.parentElement` and stores
 * them in CONTENT space (screen rect + scrollTop); the draw loop subtracts
 * the scroller's cached scrollTop every frame, so registered light stays
 * welded to the cards while the owner scrolls. When nothing measurable
 * exists (jsdom's 0×0 rects, an unexpected host) it degrades DELIBERATELY to
 * synthetic shelves registered to the wrapper's own bounds
 * (`synthesizeBlocks`), flagged `data-armory-geometry="fallback"`.
 *
 * Voices: the perimeter rite (mount narrative — a champagne torch-trace laps
 * the panel's ACTUAL rounded border once and lights it, the held perimeter
 * fading up behind the torch as it closes the round); content-aware
 * glints (every ~6s a thin light runs one REAL block's top seam, one block
 * at a time, re-anchored to scrollTop per frame); edge embers (the v2
 * updraft kept but sparser — 24/10, outer 12% bands, dead by 60% of the
 * climb); and the heart of the hall (the lub-dub warmth, centered under the
 * content column's MEASURED horizontal center, never an assumed 50%).
 * Legibility is absolute — the owner READS this panel: everything bright
 * lives on the edges or the block seams, and the only paint allowed over the
 * copy is the glint's halo (hard-capped ~5% alpha) and the heartbeat wash
 * (≤0.13 at peak, its core below the reading zone).
 *
 * Reduced motion ⇒ a STILL: static warmth + the perimeter trace held
 * complete (authored-at-rest DOM, zero clocks). Null 2D context
 * ⇒ the canvas voices stand down and the DOM voices stand alone. Over the
 * 300-line soft limit deliberately: the effect seam confines the geometry
 * engine, choreography and markup to this one file (the EffectSpecs /
 * EffectBlueprintCanvas dispensation).
 */

/* --- clock: one constants block (the house "shared choreography clock"
       idiom) — the canvas rite and the GSAP perimeter fade read the SAME
       numbers, so the held border lights on the torch's own schedule */
const RITE_S = 1.2 // the torch's full lap of the border
const RITE_FADE_S = 0.3 // afterglow decay once the lap completes
const RITE_TRAIL = 0.1 // trail length, as a fraction of the perimeter
const RITE_SEGS = 18
const RITE_INSET = 3 // px in from the panel edge, matching the held border
const GLINT_FIRST_AT_S = RITE_S + 0.9 // first glint lands just after the rite
const GLINT_EVERY_S = 6
const GLINT_S = 1.5 // one edge-run's duration
const GLINT_TRAIL = 0.2 // trail, as a fraction of the block's width
const GLINT_SEGS = 14
const GLINT_H = 1.4 // hairline height in px — a seam catch, not a band
const GLINT_CORE_ALPHA = 0.34 // hairline peak — rides the gap ABOVE a block
const GLINT_HALO_ALPHA = 0.05 // the only over-copy paint: capped under ~6%
const HEARTBEAT_REST_S = 3.7 // beats ~2.3s of motion → ~6s full cycle

/* ----------------------------------------------------------------- embers */
const EMBER_COUNT = { console: 24, sheet: 10 } as const
const EDGE_BAND = 0.12 // outer bands only — the reading column never burns
const EMBER_SPAWN_Y = 1.04 // just below the visible bottom edge
const EMBER_DEATH_Y = 0.4 // dead by 60% of the climb — the upper hall is dark
const EMBER_RISE_MIN = 0.04 // panel-heights per second — coals, not sparks
const EMBER_RISE_RANGE = 0.05
const EMBER_ALPHA_PEAK = 0.55
const EMBER_R_MIN = 1
const EMBER_R_RANGE = 1.7
const EMBER_HALO_SCALE = 2.6
const EMBER_HALO_ALPHA = 0.22
const TAU = Math.PI * 2
const easeInOut = (x: number) => x * x * (3 - 2 * x)

/** Theme token at runtime; the literal fallback is oath-dark's value. */
function readChampagne(): string {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-highlight-bright')
    .trim()
  return v || '#e08a4a'
}

/* --------------------------------------------------------------- geometry */
/** One content block's top edge, in CONTENT space (y includes scrollTop). */
interface HallBlock { x: number; y: number; w: number }
interface HallGeometry { scrollTop: number; blocks: HallBlock[]; live: boolean }

/** Deliberate degrade (jsdom's 0×0 rects, an unexpected host): register to the
 *  wrapper's own bounds — three shelves across the first viewport of content. */
function synthesizeBlocks(w: number, h: number): HallBlock[] {
  return [0.18, 0.46, 0.74].map((f) => ({ x: w * 0.08, y: h * f, w: w * 0.84 }))
}

/**
 * Measures the hall's real furniture. host → `[data-pp-effect]` layer → the
 * panel wrapper; the content lives in the wrapper's OTHER child (console:
 * the overflow-y-auto div; sheet: a static div, so scrollTop stays 0 and the
 * page carries layer and content together — no offset needed).
 */
function useHallGeometry(
  rootRef: RefObject<HTMLDivElement | null>,
  reduced: boolean,
): RefObject<HallGeometry> {
  const geoRef = useRef<HallGeometry>({ scrollTop: 0, blocks: [], live: false })
  useEffect(() => {
    const host = rootRef.current
    if (!host) return
    const geo = geoRef.current
    const layer = host.parentElement
    const wrapper = layer?.parentElement ?? null
    // The content sibling: the wrapper's first element child that isn't us.
    const contentRoot =
      Array.from(wrapper?.children ?? []).find(
        (c): c is HTMLElement => c !== layer && c instanceof HTMLElement,
      ) ?? null
    const measure = () => {
      const hostRect = host.getBoundingClientRect()
      const [w, h] = [Math.max(1, hostRect.width), Math.max(1, hostRect.height)]
      const st = contentRoot?.scrollTop ?? 0
      const blocks: HallBlock[] = []
      if (contentRoot) {
        // The armory panel's stable landmark: one <section> per group. Rects
        // come back in the SCROLLED screen space — +scrollTop stores them in
        // content space, so any later frame can re-anchor them cheaply.
        for (const el of Array.from(contentRoot.querySelectorAll('section'))) {
          const r = el.getBoundingClientRect()
          if (r.width < 40) continue // 0×0 (jsdom) or collapsed — unusable
          blocks.push({ x: r.left - hostRect.left, y: r.top - hostRect.top + st, w: r.width })
        }
      }
      geo.live = blocks.length > 0
      geo.blocks = geo.live ? blocks : synthesizeBlocks(w, h)
      geo.scrollTop = st
      host.setAttribute('data-armory-geometry', geo.live ? 'live' : 'fallback')
      // The heart hangs under the content column's REAL center.
      const cr = geo.live && contentRoot ? contentRoot.getBoundingClientRect() : null
      const cx = cr ? cr.left - hostRect.left + cr.width / 2 : w / 2
      host.style.setProperty('--armory-heart-x', `${((cx / w) * 100).toFixed(2)}%`)
    }
    measure()
    // The panel's queries land late (owned passports, drop mates) — a settle
    // pass catches the grown layout; the observers cover everything after.
    const settle = window.setTimeout(measure, 700)
    const ro = new ResizeObserver(measure)
    ro.observe(host)
    if (contentRoot) {
      ro.observe(contentRoot)
      // The scroller's own box is fixed (max-h) — content growth shows on its
      // child, so observe that too or async sections would go unmeasured.
      if (contentRoot.firstElementChild) ro.observe(contentRoot.firstElementChild)
    }
    let scrollRaf = 0
    let onScroll: (() => void) | null = null
    const scrollHost = contentRoot
    if (scrollHost && !reduced) {
      // rAF-throttled: coalesce the event burst into one cached read per
      // frame; the draw loop offsets every registered rect by this cache.
      onScroll = () => {
        if (scrollRaf) return
        scrollRaf = requestAnimationFrame(() => {
          scrollRaf = 0
          geoRef.current.scrollTop = scrollHost.scrollTop
        })
      }
      scrollHost.addEventListener('scroll', onScroll, { passive: true })
    }
    return () => {
      window.clearTimeout(settle)
      ro.disconnect()
      if (scrollRaf) cancelAnimationFrame(scrollRaf)
      if (scrollHost && onScroll) scrollHost.removeEventListener('scroll', onScroll)
    }
  }, [rootRef, reduced])
  return geoRef
}

/* -------------------------------------------------------------- perimeter */
/** Point at fraction `f` (clockwise from the top-left corner's end) along a
 *  rounded rect w×h with radius r. Mutates `pt` — no hot-path allocations.
 *  Order: top edge, TR arc, right edge, BR arc, bottom, BL arc, left, TL. */
function perimeterPoint(f: number, w: number, h: number, r: number, pt: { x: number; y: number }): void {
  const cw = Math.max(0, w - 2 * r)
  const ch = Math.max(0, h - 2 * r)
  const arc = (Math.PI * r) / 2
  let d = (((f % 1) + 1) % 1) * (2 * cw + 2 * ch + 4 * arc)
  const rad = (over: number) => (r > 0 ? over / r : 0) // r=0: arcs are 0-length
  if (d < cw) { pt.x = r + d; pt.y = 0; return }
  d -= cw
  if (d < arc) { pt.x = w - r + Math.sin(rad(d)) * r; pt.y = r - Math.cos(rad(d)) * r; return }
  d -= arc
  if (d < ch) { pt.x = w; pt.y = r + d; return }
  d -= ch
  if (d < arc) { pt.x = w - r + Math.cos(rad(d)) * r; pt.y = h - r + Math.sin(rad(d)) * r; return }
  d -= arc
  if (d < cw) { pt.x = w - r - d; pt.y = h; return }
  d -= cw
  if (d < arc) { pt.x = r - Math.sin(rad(d)) * r; pt.y = h - r + Math.cos(rad(d)) * r; return }
  d -= arc
  if (d < ch) { pt.x = 0; pt.y = h - r - d; return }
  d -= ch
  ;[pt.x, pt.y] = [r - Math.cos(rad(d)) * r, r - Math.sin(rad(d)) * r]
}

/* ----------------------------------------------------------------- canvas */
/** bx: 0 (outer edge) → 1 (band's inner rim); y: fraction of panel height. */
interface UpdraftEmber {
  left: boolean; bx: number; y: number; v: number
  r: number; seed: number; color: string; swayAmp: number
}

/** The moving voices: edge embers, the perimeter rite, the content glints. */
function useHallCanvas(
  rootRef: RefObject<HTMLDivElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
  geoRef: RefObject<HallGeometry>,
  tier: 'console' | 'sheet',
  reduced: boolean,
): void {
  useEffect(() => {
    if (reduced) return
    const host = rootRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return // jsdom / lost context — the DOM voices stand alone.
    const geo = geoRef.current
    const ramp = resolveForgeRamp() // the house fire palette
    const clock = MODAL_FORGE_TUNING // flicker idiom only; no swarm maths
    const champagne = readChampagne()
    const dpr = Math.min(window.devicePixelRatio || 1, 2) // ambient cap ≤2
    // The rite traces the panel's ACTUAL border: read the wrapper's real
    // corner radius instead of assuming the console's rounded-2xl.
    const wrapper = host.parentElement?.parentElement
    const radius = wrapper
      ? Number.parseFloat(getComputedStyle(wrapper).borderTopLeftRadius) || 0
      : 0

    let w = 1
    let h = 1
    const resize = () => {
      const rect = host.getBoundingClientRect()
      ;[w, h] = [Math.max(1, rect.width), Math.max(1, rect.height)]
      ;[canvas.width, canvas.height] = [Math.round(w * dpr), Math.round(h * dpr)]
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    const dot = (x: number, y: number, r2: number) => { ctx.beginPath(); ctx.arc(x, y, r2, 0, TAU); ctx.fill() }

    // Fractional positions, so a panel resize costs nothing.
    const rekindle = (e: UpdraftEmber, initial01 = 0) => {
      e.left = Math.random() < 0.5
      e.bx = Math.random()
      e.v = EMBER_RISE_MIN + Math.random() * EMBER_RISE_RANGE
      e.r = EMBER_R_MIN + Math.random() * EMBER_R_RANGE
      e.seed = Math.random()
      e.swayAmp = 0.1 + Math.random() * 0.22
      const heat = Math.random()
      e.color = heat < 0.15 ? ramp.cold : heat < 0.82 ? ramp.ember : ramp.hot
      e.y = EMBER_SPAWN_Y - initial01 * (EMBER_SPAWN_Y - EMBER_DEATH_Y)
    }
    const newEmber = () => {
      const e: UpdraftEmber = { left: true, bx: 0, y: 0, v: 0, r: 0, seed: 0, color: '', swayAmp: 0 }
      rekindle(e, Math.random())
      return e
    }
    // Scattered initial progress: mount shows a settled hall, not a wave.
    const embers: UpdraftEmber[] = Array.from({ length: EMBER_COUNT[tier] }, newEmber)

    const pt = { x: 0, y: 0 }
    let t = 0 // own accumulated clock — a hidden tab resumes where it parked
    let glintIdx = -1
    let glintStart = -1e9
    let glintNextAt = GLINT_FIRST_AT_S

    /** Next block whose top seam is in view — cycling, one at a time, so the
     *  torchlight visits the hall's pieces in turn. */
    const pickBlock = (): number => {
      const blocks = geo.blocks
      for (let k = 1; k <= blocks.length; k += 1) {
        const i = (glintIdx + k) % blocks.length
        const b = blocks[i]
        if (!b) continue
        const sy = b.y - geo.scrollTop
        if (sy > h * 0.08 && sy < h * 0.92) return i
      }
      return -1 // nothing in view this round — the hall waits
    }

    const drawRite = () => {
      const fadeOut = t > RITE_S ? Math.max(0, 1 - (t - RITE_S) / RITE_FADE_S) : 1
      const head = easeInOut(Math.min(1, t / RITE_S))
      const rw = w - RITE_INSET * 2
      const rh = h - RITE_INSET * 2
      const rr = Math.max(0, radius - RITE_INSET)
      for (let k = RITE_SEGS; k >= 0; k -= 1) {
        const f = head - (k / RITE_SEGS) * RITE_TRAIL
        if (f < 0) continue
        perimeterPoint(f, rw, rh, rr, pt)
        const body = (1 - k / RITE_SEGS) ** 2 // tail tapers, the torch burns
        ctx.globalAlpha = (0.08 + 0.5 * body) * fadeOut
        ctx.fillStyle = body > 0.7 ? ramp.hot : champagne
        dot(RITE_INSET + pt.x, RITE_INSET + pt.y, 0.9 + body * 1.9)
      }
      // The torch head's halo — pt still holds the head (k = 0 drew last).
      ctx.globalAlpha = 0.16 * fadeOut
      ctx.fillStyle = champagne
      dot(RITE_INSET + pt.x, RITE_INSET + pt.y, 9)
    }

    const drawGlint = () => {
      const b = geo.blocks[glintIdx]
      if (!b) return
      const p = (t - glintStart) / GLINT_S
      if (p < 0 || p >= 1) return
      // Re-anchored to scrollTop EVERY frame — the glint stays welded to its
      // card while the owner scrolls (block rects live in content space).
      const sy = b.y - geo.scrollTop - 2
      if (sy < 4 || sy > h - 4) return // scrolled away mid-run: light lost
      const head = b.x + easeInOut(p) * b.w
      const fade = p > 0.8 ? (1 - p) / 0.2 : 1 // dies at the far edge
      // The halo is the ONLY paint that may touch the copy below the seam —
      // hard-capped under the ~6% content-column ceiling.
      ctx.globalAlpha = GLINT_HALO_ALPHA * fade
      ctx.fillStyle = champagne
      dot(head, sy, 11)
      // The hairline rides the seam ABOVE the block (the space-y gap): a
      // 1.4px metal-catches-the-torch line, never over the text itself.
      const seg = (b.w * GLINT_TRAIL) / GLINT_SEGS
      for (let k = 0; k < GLINT_SEGS; k += 1) {
        const x1 = head - (k + 1) * seg
        if (x1 + seg < b.x) break
        const body = (1 - k / GLINT_SEGS) ** 2
        ctx.globalAlpha = GLINT_CORE_ALPHA * body * fade
        ctx.fillStyle = k === 0 ? ramp.hot : champagne
        ctx.fillRect(Math.max(b.x, x1), sy - GLINT_H / 2, seg + 0.5, GLINT_H)
      }
    }

    let raf = 0
    let last = 0
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (now - last) / 1000) // clamped: no teleports
      last = now
      t += dt
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      const bandW = w * EDGE_BAND
      for (const e of embers) {
        e.y -= e.v * dt
        const p = (EMBER_SPAWN_Y - e.y) / (EMBER_SPAWN_Y - EMBER_DEATH_Y)
        if (p >= 1) { rekindle(e); continue }
        // Quick kindle, long cool: life² biases the climb toward dimness.
        const life = p < 0.18 ? p / 0.18 : 1 - (p - 0.18) / 0.82
        const flickerPhase = now * clock.flickerTimeScale + e.seed * clock.flickerSeedScale
        const glow = clock.flickerBase + clock.flickerAmplitude * Math.sin(flickerPhase)
        const alpha = EMBER_ALPHA_PEAK * life * life * glow
        if (alpha < 0.01) continue
        const sway = Math.sin(now * 0.0006 + e.seed * clock.flickerSeedScale) * e.swayAmp
        const inBand = Math.min(1, Math.max(0, e.bx + sway)) * bandW
        const x = e.left ? inBand : w - inBand
        const y = e.y * h
        const r = e.r * (1 - p * 0.45) // cooling embers shrink
        ctx.fillStyle = e.color
        ctx.globalAlpha = Math.min(1, alpha * EMBER_HALO_ALPHA)
        dot(x, y, r * EMBER_HALO_SCALE)
        ctx.globalAlpha = Math.min(1, alpha)
        dot(x, y, r)
      }
      if (t < RITE_S + RITE_FADE_S) drawRite()
      if (t >= glintNextAt) { glintIdx = pickBlock(); glintStart = t; glintNextAt = t + GLINT_EVERY_S }
      drawGlint()
      ctx.globalAlpha = 1
    }
    const start = () => { last = performance.now(); raf = requestAnimationFrame(frame) }
    const stop = () => cancelAnimationFrame(raf)
    // A hidden tab burns no frames; `last` resets on resume so dt stays
    // honest and `t` (the scheduler) never fast-forwards.
    const onVisibility = () => { stop(); if (!document.hidden) start() }
    document.addEventListener('visibilitychange', onVisibility)
    if (!document.hidden) start()
    return () => {
      stop()
      ro.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [rootRef, canvasRef, geoRef, tier, reduced])
}

/* -------------------------------------------------------------------- DOM */
export default function EffectArmory({ tier }: PassportEffectProps) {
  const reducedMotion = useReducedMotion()
  const rootRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const geoRef = useHallGeometry(rootRef, reducedMotion)
  useHallCanvas(rootRef, canvasRef, geoRef, tier, reducedMotion)

  // DOM voices. Every tween ends on a class-set resting value (JSX sets no
  // inline opacity), so `revertOnUpdate` lands back on the authored still.
  useGSAP(
    () => {
      if (reducedMotion) return
      // The held perimeter fades up as the torch completes its round — canvas
      // and timeline share the clock constants (the house idiom), so the
      // border finishes lighting exactly as the lap closes.
      gsap.from('[data-armory-perimeter]', { autoAlpha: 0, duration: 0.8, ease: 'sine.out', delay: RITE_S * 0.75 })
      // The heart of the hall: lub, dub, long exhale, rest. Peaks stay soft
      // washes — the gradient's core sits below the reading zone.
      gsap
        .timeline({ repeat: -1, repeatDelay: HEARTBEAT_REST_S })
        .to('[data-armory-heartbeat]', { opacity: 0.11, scale: 1.05, duration: 0.42, ease: 'sine.out' })
        .to('[data-armory-heartbeat]', { opacity: 0.05, scale: 1, duration: 0.34, ease: 'sine.in' })
        .to('[data-armory-heartbeat]', { opacity: 0.13, scale: 1.06, duration: 0.36, ease: 'sine.out' })
        .to('[data-armory-heartbeat]', { opacity: 0.06, scale: 1, duration: 1.2, ease: 'sine.inOut' })
    },
    { scope: rootRef, dependencies: [reducedMotion], revertOnUpdate: true },
  )

  return (
    // Own overflow clip: the rite's halo must not escape the panel edge.
    <div
      ref={rootRef}
      data-armory-effect={tier}
      className={cn('absolute inset-0 overflow-hidden', tier === 'console' && 'rounded-2xl')}
    >
      {!reducedMotion ? (
        <canvas ref={canvasRef} data-armory-canvas="" className="absolute inset-0 h-full w-full" />
      ) : null /* reduced motion: no canvas, no clock — the still stands */}
      {/* The held perimeter — the torch's residue. Doubles as the reduced-motion
          still ("the trace held complete") and stands alone on a null 2D ctx. */}
      <div
        data-armory-perimeter=""
        className="absolute inset-[3px] rounded-[inherit] border opacity-[0.14]"
        style={{ borderColor: 'color-mix(in oklab, var(--color-highlight-bright, #e08a4a) 60%, transparent)' }}
      />
      {/* Static resting warmth = the reduced-motion still. Its x is the
          MEASURED content-column center (set by useHallGeometry). */}
      <div
        data-armory-heartbeat=""
        className="absolute inset-x-0 bottom-[-14%] h-[64%] opacity-[0.06]"
        style={{
          background:
            'radial-gradient(ellipse 55% 60% at var(--armory-heart-x, 50%) 72%, var(--color-highlight-bright, #e08a4a) 0%, transparent 70%)',
        }}
      />
    </div>
  )
}
