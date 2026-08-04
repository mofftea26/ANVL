import { useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import type { PassportEffectProps } from '../effectTypes'
import { containedRect, sampleSilhouette2D } from '../lib/silhouette2d'
import {
  buildClothPanel,
  buildNaps,
  clamp01,
  COUNTS,
  easeInOut,
  FALLBACK_H,
  FALLBACK_W,
  KEEP,
  MAX_FRAME_S,
  MOTE_ALPHA,
  NAP_BUCKETS,
  NAP_MAX_ALPHA,
  NAP_TONES,
  POOL_ALPHA,
  rand,
  readKeepPalette,
  RIM_ALPHA,
  RIM_ARC,
  settleForStill,
  shortestTurn,
  STILL_AT,
  TAU,
  toCareShape,
  type CareShape,
  type Mote,
  type Pass,
} from './effectCareCloth'

/**
 * Care ritual — "The Keeping".
 *
 * Care is not something done TO the piece once; it is the hand that keeps
 * coming back. So this is the nap of the cloth being smoothed, forever. The
 * garment's real interior is filled with fine pile strokes — rejection-sampled
 * from the silhouette MASK, so every tuft sits on actual fabric, never on the
 * stage — and they start disordered and dull: a piece just come off the body.
 *
 * The pile is ALIVE at all times, not only under the hand: every tuft rotates
 * and breathes its length on its own rate and phase (`KEEP.swayAmp`,
 * `lenBreath`), so the field scintillates like real pile catching light. At
 * 0.35s the hand arrives — a palm-sized POOL of light (deliberately not a
 * scan band; two neighbouring sections already open on a sweeping line)
 * travelling across the piece, clipped to the silhouette so the light lands
 * on cloth and never washes the copy. Every tuft the front touches combs into
 * the pass direction over ~0.6s and warms champagne, cooling back through a
 * middle tone to a kept bone sheen over ~3s, while motes lift off where the
 * hand just went. When the pass clears the hem, a restored highlight runs the
 * piece's TRUE contour once — returned to service. Then it never stops: the
 * hand comes back every ~5.5s (before the field has fully settled) from a NEW
 * direction, alternating down the piece and across it, so the nap re-lays
 * differently every time and the composition never loops identically.
 *
 * This replaces "The Immersion" (a rising waterline), rejected 2026-08-04 for
 * reading static.
 *
 * Geometry + palette live in `./effectCareCloth` (pure, unit-testable): mask
 * rejection-sampling for the pile, the true outline, and the folded-panel
 * fallback. CHUNK HYGIENE — never import `@/shared/webgl/particleShapes`,
 * whose top-level three.js import would drag `vendor-three` into this lazy 2D
 * chunk (docs/animation-guidelines.md, "Passport section effects"). The
 * product <img> is a SIBLING layer, so image-box coords map through
 * `containedRect` of the stage box each frame and survive any resize.
 *
 * Degradation: sample null (opaque photo, failed decode, jsdom) → the same
 * ritual on a FOLDED CLOTH panel (a creased superellipse of the same pile,
 * combed by the same passes) — designed, standing alone. Reduced motion → a
 * STILL: the field fully combed and staggered through the cool-down so all
 * three tones show at once, the palm's light held mid-pass, the rim lit,
 * motes settled — authored at rest, no clock. Null 2D context → nothing,
 * cleanly. Own clamped rAF clock, parked on `document.hidden`, resuming
 * without fast-forward; DPR ≤2.
 *
 * Over the 300-line soft limit deliberately (EffectDetails' dispensation):
 * this lazy chunk confines BOTH regimes (live + still) and the whole
 * choreography to one file, with every pure geometry already extracted to the
 * sibling `effectCareCloth` module.
 */

type ShapeState = CareShape | 'pending'

export default function EffectCare({ imageUrl, tier }: PassportEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reducedMotion = useReducedMotion()
  const napCount = COUNTS[tier].nap
  // One stable fallback instance, so re-resolving to it never remounts the
  // engine (a fresh object identity would tear down and rebuild the ritual).
  const cloth = useMemo(() => buildClothPanel(napCount), [napCount])
  const [shape, setShape] = useState<ShapeState>(() => (imageUrl ? 'pending' : cloth))

  useEffect(() => {
    if (!imageUrl) {
      setShape(cloth)
      return
    }
    let cancelled = false
    setShape('pending')
    // The shared sampler resolves null on ANY failure — the designed fallback.
    void sampleSilhouette2D(imageUrl).then((s) => {
      if (cancelled) return
      setShape((s && toCareShape(s, napCount)) || cloth)
    })
    return () => {
      cancelled = true
    }
  }, [imageUrl, napCount, cloth])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || shape === 'pending') return // wait dark — the ritual needs cloth
    const ctx = canvas.getContext('2d')
    if (!ctx) return // jsdom / blocked canvas: the layer simply stays empty

    const pal = readKeepPalette()
    const tones = [pal.bone, pal.warm, pal.ember] // the cool-down, in three steps
    const geom = shape
    const moteMax = COUNTS[tier].motes
    const dpr = Math.min(window.devicePixelRatio || 1, 2) // DPR ≤2 — retina is enough
    let w = FALLBACK_W
    let h = FALLBACK_H
    let rect = { x: 0, y: 0, w: 0, h: 0 }

    const resize = () => {
      const box = canvas.getBoundingClientRect()
      w = box.width >= 2 ? box.width : FALLBACK_W
      h = box.height >= 2 ? box.height : FALLBACK_H
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      rect = containedRect(w, h, geom.aspect)
    }
    resize()

    const px = (x: number) => rect.x + x * rect.w
    const py = (y: number) => rect.y + y * rect.h
    const span = () => Math.min(rect.w, rect.h)

    const naps = buildNaps(geom)
    // Scratch segment buffers — the field draws in batched paths, so the
    // per-tuft geometry is computed ONCE per frame, never once per bucket.
    const segs = new Float32Array(naps.length * 4)
    const grp = new Uint8Array(naps.length)
    const groups = NAP_BUCKETS.length * NAP_TONES

    /** Everything inside the ritual is clipped to the cloth itself. */
    const clipCloth = () => {
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(px(geom.outline[0]), py(geom.outline[1]))
      for (let i = 1; i < geom.outline.length / 2; i += 1)
        ctx.lineTo(px(geom.outline[i * 2]), py(geom.outline[i * 2 + 1]))
      ctx.closePath()
      ctx.clip()
    }

    const strokeSeg = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    /**
     * The pile, in `NAP_BUCKETS × NAP_TONES` batched paths. Every tuft moves
     * EVERY frame — the sway/length breath is geometry, which the loop below
     * is already paying for, so the field is alive between the hand's passes
     * and not merely between its alpha buckets.
     */
    const drawNapField = (t: number) => {
      const u = span()
      const breath = KEEP.breathBase + KEEP.breathAmp * Math.sin((TAU * t) / KEEP.breathS)
      for (let i = 0; i < naps.length; i += 1) {
        const nap = naps[i]
        const kept = nap.combedAt >= 0
        const settle = kept ? easeInOut(clamp01((t - nap.combedAt) / KEEP.combS)) : 0
        const fresh = kept ? Math.exp(-(t - nap.combedAt) / KEEP.freshS) : 0
        const wave = Math.sin(t * nap.rate + nap.ph)
        const a = (kept ? nap.from + nap.turn * settle : nap.angle) + KEEP.swayAmp * wave
        const half = (nap.lenN * (1 + KEEP.lenBreath * wave) * u) / 2
        const cx = px(nap.x)
        const cy = py(nap.y)
        const dx = Math.cos(a) * half
        const dy = Math.sin(a) * half
        segs[i * 4] = cx - dx
        segs[i * 4 + 1] = cy - dy
        segs[i * 4 + 2] = cx + dx
        segs[i * 4 + 3] = cy + dy
        // Alpha rides the SAME wave as the geometry: a fibre turning into the
        // light gets brighter, which is why the shimmer reads as physical.
        const shimmer = 0.68 + 0.32 * wave
        const alpha = (kept ? 0.13 + 0.13 * fresh : 0.075) * nap.gain * shimmer * breath
        const bucket = Math.max(
          0,
          Math.min(NAP_BUCKETS.length - 1, Math.floor((alpha / NAP_MAX_ALPHA) * NAP_BUCKETS.length)),
        )
        const tone = fresh > 0.62 ? 2 : fresh > 0.24 ? 1 : 0
        grp[i] = tone * NAP_BUCKETS.length + bucket
      }
      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      for (let g = 0; g < groups; g += 1) {
        let any = false
        ctx.beginPath()
        for (let i = 0; i < naps.length; i += 1) {
          if (grp[i] !== g) continue
          ctx.moveTo(segs[i * 4], segs[i * 4 + 1])
          ctx.lineTo(segs[i * 4 + 2], segs[i * 4 + 3])
          any = true
        }
        if (!any) continue
        ctx.globalAlpha = NAP_BUCKETS[g % NAP_BUCKETS.length]
        ctx.strokeStyle = tones[(g / NAP_BUCKETS.length) | 0]
        ctx.stroke()
      }
      // The folds of a cloth at rest — fallback only; a garment has its own.
      ctx.globalAlpha = 0.16
      ctx.strokeStyle = pal.graphite
      for (let k = 0; k < geom.creases.length; k += 4)
        strokeSeg(
          px(geom.creases[k]),
          py(geom.creases[k + 1]),
          px(geom.creases[k + 2]),
          py(geom.creases[k + 3]),
        )
    }

    /**
     * The hand's light: a palm-sized POOL riding the pass front, finite across
     * the axis as well as along it — so what crosses the piece reads as a
     * hand, not an instrument. (A full-width band would have been the third
     * sweeping line in this passport; the comb is the loud element here.)
     */
    const drawPool = (cos: number, sin: number, front: number, wander: number, alpha: number) => {
      if (alpha <= 0.002) return
      const u = span()
      const mx = rect.x + rect.w / 2
      const my = rect.y + rect.h / 2
      const along = front - (mx * cos + my * sin)
      const cx = mx + cos * along - sin * wander
      const cy = my + sin * along + cos * wander
      const r = Math.max(u * KEEP.poolR, 12)
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      grad.addColorStop(0, pal.bone)
      grad.addColorStop(0.45, pal.poolMid)
      grad.addColorStop(1, 'transparent')
      ctx.globalAlpha = alpha
      ctx.fillStyle = grad
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    }

    /** The kept rim, plus the restored highlight running the true contour. */
    const drawRim = (alpha: number, arcAt: number, arcAlpha: number) => {
      const n = geom.outline.length / 2
      ctx.lineWidth = 1
      ctx.globalAlpha = alpha
      ctx.strokeStyle = pal.bone
      ctx.beginPath()
      ctx.moveTo(px(geom.outline[0]), py(geom.outline[1]))
      for (let i = 1; i < n; i += 1) ctx.lineTo(px(geom.outline[i * 2]), py(geom.outline[i * 2 + 1]))
      ctx.closePath()
      ctx.stroke()
      if (arcAt < 0 || arcAlpha <= 0.002) return
      const steps = Math.max(2, Math.round(n * RIM_ARC))
      const i0 = Math.floor(arcAt * n)
      ctx.globalAlpha = arcAlpha
      ctx.strokeStyle = pal.ember
      ctx.lineWidth = 1.6
      ctx.beginPath()
      for (let k = 0; k <= steps; k += 1) {
        const i = (i0 + k) % n
        const x = px(geom.outline[i * 2])
        const y = py(geom.outline[i * 2 + 1])
        if (k === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    const drawMotes = (list: Mote[], t: number) => {
      ctx.fillStyle = pal.bone
      for (const m of list) {
        const p = clamp01((t - m.born) / m.life)
        ctx.globalAlpha = Math.sin(Math.PI * p) * MOTE_ALPHA
        ctx.beginPath()
        ctx.arc(m.x * w, m.y * h, m.r, 0, TAU)
        ctx.fill()
      }
    }

    const drawStill = () => {
      if (w < 2 || h < 2) return
      ctx.clearRect(0, 0, w, h)
      // A STILL composition, not a paused animation: the piece freshly kept,
      // its pile staggered through the cool-down so ember, warm and bone are
      // all on screen at once.
      settleForStill(naps)
      clipCloth()
      drawNapField(STILL_AT)
      drawPool(0, 1, rect.y + rect.h * 0.55, span() * 0.08, POOL_ALPHA) // the palm, held
      ctx.restore()
      drawRim(RIM_ALPHA + 0.04, 0.12, 0.3)
      drawMotes(
        [0, 1, 2].map((k) => ({
          x: 0.4 + k * 0.1,
          y: 0.3 + (k % 2) * 0.06,
          vx: 0,
          vy: 0,
          born: -KEEP.moteLife / 2,
          life: KEEP.moteLife,
          r: 1.4,
        })),
        0,
      )
      ctx.globalAlpha = 1
    }

    const observer = new ResizeObserver(() => {
      resize()
      if (reducedMotion) drawStill()
    })
    observer.observe(canvas)
    if (reducedMotion) {
      drawStill()
      return () => observer.disconnect()
    }

    // ——— The living ritual ———
    const motes: Mote[] = []
    let pass: Pass | null = null
    let passId = 0
    let nextPassAt = KEEP.firstPass
    let rimAt = -1
    let t = 0
    let last = 0
    let raf = 0

    /** Alternates down the piece / across it, so the nap never re-lays alike. */
    const openPass = (): Pass => {
      const dir = passId % 2 === 0 ? Math.PI / 2 + rand(-0.3, 0.3) : rand(-0.25, 0.25)
      const cos = Math.cos(dir)
      const sin = Math.sin(dir)
      let d0 = Infinity
      let d1 = -Infinity
      for (const [x, y] of [
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
      ]) {
        const d = x * cos + y * sin
        d0 = Math.min(d0, d)
        d1 = Math.max(d1, d)
      }
      const pad = Math.max(span() * 0.2, 12)
      passId += 1
      return { id: passId, cos, sin, d0: d0 - pad, d1: d1 + pad, start: t, wander: rand(0, TAU) }
    }

    /** A mote leaving the cloth at (nx, ny) — stage-normalized so it survives
     *  a resize, and slow: this is the calm pole of the whole suite. */
    const liftMote = (nx: number, ny: number, slow: number) =>
      motes.push({
        x: px(nx) / w,
        y: py(ny) / h,
        vx: rand(-0.012, 0.012) * slow,
        vy: rand(-0.045, -0.016) * slow,
        born: t,
        life: rand(KEEP.moteLife * 0.7, KEEP.moteLife * 1.3),
        r: rand(0.9, 1.7),
      })

    const step = (dt: number) => {
      t += dt
      if (!pass && t >= nextPassAt) pass = openPass()
      // Between passes the piece is never inert: motes keep leaving the pile,
      // half as fast as under the hand — over a field that is itself swaying.
      if (!pass && naps.length > 0 && motes.length < moteMax / 2 && Math.random() < dt * 1.3) {
        const nap = naps[(Math.random() * naps.length) | 0]
        liftMote(nap.x, nap.y, 0.55)
      }
      if (pass) {
        const p = clamp01((t - pass.start) / KEEP.passS)
        const front = pass.d0 + (pass.d1 - pass.d0) * easeInOut(p)
        const target = Math.atan2(pass.sin, pass.cos)
        for (const nap of naps) {
          if (nap.pass === pass.id) continue
          if (px(nap.x) * pass.cos + py(nap.y) * pass.sin > front) continue
          const now = nap.combedAt < 0 ? nap.angle : nap.from + nap.turn
          nap.from = now
          nap.turn = shortestTurn(target + rand(-0.22, 0.22) - now)
          nap.combedAt = t
          nap.pass = pass.id
          // A few motes lift where the hand just passed, and drift away.
          if (motes.length < moteMax && Math.random() < 0.09) liftMote(nap.x, nap.y, 1)
        }
        if (p >= 1) {
          rimAt = t // the piece returned to service
          pass = null
          nextPassAt = t + KEEP.passEvery * rand(0.88, 1.14)
        }
      }
      for (let i = motes.length - 1; i >= 0; i -= 1) {
        const m = motes[i]
        if (t - m.born >= m.life) {
          motes.splice(i, 1)
          continue
        }
        m.x += m.vx * dt
        m.y += m.vy * dt
      }
    }

    const draw = () => {
      if (w < 2 || h < 2) return
      ctx.clearRect(0, 0, w, h)
      clipCloth()
      drawNapField(t)
      if (pass) {
        const p = clamp01((t - pass.start) / KEEP.passS)
        drawPool(
          pass.cos,
          pass.sin,
          pass.d0 + (pass.d1 - pass.d0) * easeInOut(p),
          Math.sin(t * KEEP.poolWanderRate + pass.wander) * span() * KEEP.poolWander,
          POOL_ALPHA * Math.sin(Math.PI * p),
        )
      }
      ctx.restore()
      const rimP = rimAt < 0 ? -1 : (t - rimAt) / KEEP.rimS
      const running = rimP >= 0 && rimP <= 1
      const breath = KEEP.breathBase + KEEP.breathAmp * Math.sin((TAU * t) / KEEP.breathS)
      drawRim(RIM_ALPHA * breath, running ? rimP : -1, running ? 0.5 * Math.sin(Math.PI * rimP) : 0)
      drawMotes(motes, t)
      ctx.globalAlpha = 1
    }

    const frame = (nowMs: number) => {
      raf = requestAnimationFrame(frame)
      const now = nowMs / 1000
      const dt = last === 0 ? 0 : Math.min(Math.max(now - last, 0), MAX_FRAME_S)
      last = now
      step(dt)
      draw()
    }
    // Park outright while hidden; rebase the clock on resume so the pause
    // never reads as a fast-forward lurch.
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (raf === 0) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    if (!document.hidden) raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      observer.disconnect()
    }
  }, [shape, reducedMotion, tier])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-motion={reducedMotion ? 'still' : 'live'}
      data-care-effect={shape === 'pending' ? 'pending' : shape.mode}
      className="absolute inset-0 h-full w-full"
    />
  )
}
