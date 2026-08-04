import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/shared/hooks/useReducedMotion'
import type { PassportEffectProps } from '../effectTypes'
import { containedRect, sampleSilhouette2D } from '../lib/silhouette2d'
import {
  archived,
  clamp01,
  correctionLife,
  CORRECTION_TICKS,
  COUNTS,
  easeInOut,
  easeOutCubic,
  FALLBACK_H,
  FALLBACK_W,
  makeCorrection,
  makeRevision,
  MAX_FRAME_S,
  NOTES,
  rand,
  readNotePalette,
  supersedeCurrent,
  TAU,
  toShape,
  type Correction,
  type Loop,
  type Revision,
  type Shape,
} from './effectNotesRecord'

/**
 * Forge notes — "The Revision Stack".
 *
 * Forge notes are the maker's DEVELOPMENT RECORD: attempts, corrections,
 * rejected work. So the effect is a pattern-maker's light table. THIS
 * garment's real contour is traced again and again — each revision its own
 * deviated copy, the older ones ghosted behind the newer like tracing paper
 * stacked on glass, every sheet shifting on its own slow cycle so the stack
 * is physically in motion at all times.
 *
 * On mount the archive assembles ALREADY STRUCK — a record opens on history,
 * so cross-outs are on screen inside the first second, and the newest
 * archived sheet is struck live at 0.45s. A graphite pen (a 1px bone
 * crosshair, no glow — a development record is a technical pen, and the
 * burning nib belongs to the chronicle next door) laps the contour drawing
 * the current attempt. Then it never stops. Every ~5s the current revision is
 * struck out, demoted, and a freshly deviated copy is begun while the oldest
 * sheet retires off the back. Between revisions come CORRECTIONS: a span of
 * the superseded contour is lifted off the piece and held beside the span
 * that replaced it, the deviation ticked off point-to-point between the two,
 * then rejected with an ember x and thrown away. A tally column logs every
 * revision the record has taken.
 *
 * Nothing here is another section's language. The story writes letterforms
 * along ONE contour segment with a burning nib; this traces the WHOLE loop
 * repeatedly, strikes it out, and holds the old edge against the new one.
 * There is no ringed anchor and no margin annotation — that is the
 * instrument panel's vocabulary, not a workbook's.
 *
 * Geometry + palette live in `./effectNotesRecord` (pure, unit-testable).
 * Registered to the piece via `../lib/silhouette2d` — CHUNK HYGIENE: never
 * `@/shared/webgl/particleShapes`, whose top-level three.js import would drag
 * `vendor-three` into this lazy 2D chunk (docs/animation-guidelines.md,
 * "Passport section effects").
 *
 * Degradation: sample null (opaque photo, failed decode, jsdom) → the same
 * record language on stacked SPEC SHEETS (offset ruled sheets, struck and
 * superseded, same corrections and tally) — a designed composition that
 * stands alone. Reduced motion → a STILL record: the struck archive, the
 * current attempt crisp on top, one correction held at full lift with its
 * deviation ticked and rejected, the tally — authored at rest, no clock.
 * Null 2D context → nothing, cleanly. Own clamped rAF clock that parks on
 * `document.hidden` and resumes without fast-forwarding; DPR ≤2.
 *
 * Over the 300-line soft limit deliberately (EffectDetails' dispensation):
 * this lazy chunk confines BOTH regimes (live + still) and the whole
 * choreography to one file, with every pure geometry already extracted to the
 * sibling `effectNotesRecord` module.
 */

type ShapeState = Shape | 'pending' | null

export default function EffectForgeNotes({ imageUrl, tier }: PassportEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const reducedMotion = useReducedMotion()
  const [shape, setShape] = useState<ShapeState>(() => (imageUrl ? 'pending' : null))

  useEffect(() => {
    if (!imageUrl) {
      setShape(null)
      return
    }
    let cancelled = false
    setShape('pending')
    // The shared sampler resolves null on ANY failure — the designed fallback.
    void sampleSilhouette2D(imageUrl).then((s) => void (cancelled || setShape(s ? toShape(s) : null)))
    return () => {
      cancelled = true
    }
  }, [imageUrl])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || shape === 'pending') return // wait, dark, for real geometry
    const ctx = canvas.getContext('2d')
    if (!ctx) return // jsdom / blocked canvas: the layer simply stays empty

    const pal = readNotePalette()
    const geom = shape
    const c = COUNTS[tier]
    const aspect = geom ? geom.aspect : 4 / 5
    const cx = geom ? geom.cx : 0.5
    const cy = geom ? geom.cy : 0.52
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
      rect = containedRect(w, h, aspect)
    }
    resize()

    const px = (x: number) => rect.x + x * rect.w
    const py = (y: number) => rect.y + y * rect.h
    const span = () => Math.min(rect.w, rect.h)

    /** Stroke a closed loop at its sheet's offset, optionally only part of it. */
    const strokeLoop = (loop: Loop, progress: number, ox: number, oy: number) => {
      const n = loop.pts.length / 2
      const count = Math.max(2, Math.min(n, Math.round(progress * n)))
      ctx.beginPath()
      ctx.moveTo(px(loop.pts[0] + ox), py(loop.pts[1] + oy))
      for (let i = 1; i < count; i += 1)
        ctx.lineTo(px(loop.pts[i * 2] + ox), py(loop.pts[i * 2 + 1] + oy))
      if (count >= n) ctx.closePath()
      ctx.stroke()
    }

    const strokeSeg = (x1: number, y1: number, x2: number, y2: number) => {
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }

    /** One attempt: its loop, plus the rules if it is a spec sheet. */
    const drawRevision = (
      rev: Revision,
      alpha: number,
      progress: number,
      ink: string,
      width: number,
      ox: number,
      oy: number,
    ) => {
      if (alpha <= 0.004) return
      ctx.globalAlpha = alpha
      ctx.strokeStyle = ink
      ctx.lineWidth = width
      strokeLoop(rev.loop, progress, ox, oy)
      const rules = rev.loop.rules
      ctx.lineWidth = 1
      ctx.globalAlpha = alpha * 0.72
      for (let k = 0; k < rules.length; k += 4)
        strokeSeg(px(rules[k] + ox), py(rules[k + 1] + oy), px(rules[k + 2] + ox), py(rules[k + 3] + oy))
    }

    const drawStrike = (rev: Revision, alpha: number, drawn: number, ox: number, oy: number) => {
      const s = rev.strike
      if (!s || alpha <= 0.004) return
      ctx.globalAlpha = alpha
      ctx.strokeStyle = pal.ember
      ctx.lineWidth = 1.6
      const x1 = px(s[0] + ox)
      const y1 = py(s[1] + oy)
      strokeSeg(x1, y1, x1 + (px(s[2] + ox) - x1) * drawn, y1 + (py(s[3] + oy) - y1) * drawn)
    }

    /** The pen head: a 1px bone crosshair. No ember, no halo — this is a
     *  technical pen recording a measurement, not a nib burning a chronicle. */
    const drawPenHead = (loop: Loop, pen: number, ox: number, oy: number) => {
      const n = loop.pts.length / 2
      const i = Math.min(n - 1, Math.max(0, Math.round(pen * n) - 1))
      const hx = px(loop.pts[i * 2] + ox)
      const hy = py(loop.pts[i * 2 + 1] + oy)
      const m = Math.max(3, span() * 0.012)
      ctx.globalAlpha = 0.6
      ctx.strokeStyle = pal.bone
      ctx.lineWidth = 1
      strokeSeg(hx - m, hy, hx + m, hy)
      strokeSeg(hx, hy - m, hx, hy + m)
    }

    /**
     * The correction — the record's signature gesture. Lift the superseded
     * span off the piece, tick the deviation off against the span that
     * replaced it, reject it with an ember x, throw it away.
     */
    const drawCorrection = (cor: Correction, age: number) => {
      const u = span()
      const lift = easeOutCubic(clamp01(age / NOTES.corrLift))
      const drop = clamp01((age - NOTES.corrLift - NOTES.corrHold) / NOTES.corrDrop)
      const fade = 1 - drop
      if (fade <= 0.01) return
      const off = u * (0.05 * lift + 0.09 * easeInOut(drop))
      const n = cor.prev.length / 2
      const oldX = (k: number) => px(cor.prev[k * 2]) + cor.nx * off
      const oldY = (k: number) => py(cor.prev[k * 2 + 1]) + cor.ny * off
      // The old edge, drawn as it is pulled clear of the piece.
      const drawn = Math.max(2, Math.round(n * lift))
      ctx.globalAlpha = 0.44 * fade
      ctx.strokeStyle = pal.graphite
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(oldX(0), oldY(0))
      for (let k = 1; k < drawn; k += 1) ctx.lineTo(oldX(k), oldY(k))
      ctx.stroke()
      if (lift < 1) return
      // The deviation itself: each old point tied to the one that replaced it.
      const tick = clamp01((age - NOTES.corrLift) / 0.4)
      ctx.globalAlpha = 0.32 * fade
      for (let k = 0; k < CORRECTION_TICKS; k += 1) {
        const kp = clamp01(tick * CORRECTION_TICKS - k)
        if (kp <= 0) break
        const i = Math.round(((k + 0.5) / CORRECTION_TICKS) * (n - 1))
        const ax = px(cor.next[i * 2])
        const ay = py(cor.next[i * 2 + 1])
        strokeSeg(ax, ay, ax + (oldX(i) - ax) * kp, ay + (oldY(i) - ay) * kp)
      }
      // Rejected.
      const rej = clamp01((age - NOTES.corrLift - NOTES.corrHold + NOTES.markS) / NOTES.markS)
      if (rej <= 0) return
      const mid = n >> 1
      const mx = oldX(mid)
      const my = oldY(mid)
      const m = u * 0.02
      ctx.globalAlpha = 0.85 * fade
      ctx.strokeStyle = pal.ember
      ctx.lineWidth = 1.6
      strokeSeg(mx - m, my - m, mx - m + 2 * m * rej, my - m + 2 * m * rej)
      if (rej > 0.5)
        strokeSeg(mx + m, my - m, mx + m - 2 * m * (rej - 0.5) * 2, my - m + 2 * m * (rej - 0.5) * 2)
    }

    /** The log column: one tick per revision the record has taken. */
    const drawTally = (marks: number[], t: number) => {
      const u = span()
      const x0 = rect.x + rect.w * 0.07
      const y0 = rect.y + rect.h * 0.1
      ctx.lineWidth = 1.4
      ctx.globalAlpha = 0.34
      for (let i = 0; i < marks.length; i += 1) {
        const fresh = clamp01((t - marks[i]) / 0.9)
        ctx.strokeStyle = fresh >= 1 ? pal.graphite : pal.ember
        const len = u * 0.05 * (fresh >= 1 ? 1 : easeOutCubic(Math.max(fresh, 0.15)))
        const y = y0 + i * u * 0.035
        strokeSeg(x0, y, x0 + len, y)
      }
    }

    /** Tracing paper shifting under the light — every sheet, every frame. */
    const driftAt = (rev: Revision, t: number, arrive: number) => {
      const a = rev.driftAmp * (1 + arrive)
      const ph = (t / rev.driftS) * TAU + rev.ph
      return [a * Math.sin(ph), a * 0.7 * Math.cos(ph + rev.ph)] as const
    }

    const drawStill = () => {
      if (w < 2 || h < 2) return
      // A STILL composition, not a paused animation: the record at rest.
      ctx.clearRect(0, 0, w, h)
      const stack = Array.from({ length: c.revisions }, () => makeRevision(0, false, geom))
      for (let i = stack.length - 1; i >= 1; i -= 1) {
        // History is rejected work: every archived sheet is already struck.
        archived(stack[i], 0)
        drawRevision(stack[i], 0.26 * Math.exp(-(i - 1) * 0.4), 1, pal.graphite, 1, 0, 0)
        drawStrike(stack[i], 0.34, 1, 0, 0)
      }
      drawRevision(stack[0], 0.52, 1, pal.bone, 1.3, 0, 0)
      // One correction, held at full lift with its deviation ticked and its
      // verdict struck — the section's own gesture, authored at rest.
      const cor = makeCorrection(0, stack[0].loop, stack[1].loop, cx, cy)
      if (cor) drawCorrection(cor, NOTES.corrLift + NOTES.corrHold + 0.1)
      drawTally(
        Array.from({ length: c.tally }, () => -10),
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

    // ——— The live record ———
    const revisions: Revision[] = []
    const tally: number[] = []
    const corrections: Correction[] = []
    // The archive assembles ALREADY superseded — a record opens on history —
    // so cross-outs are on screen in the first second, and the sheet that was
    // just replaced strikes live at 0.45s.
    for (let k = c.revisions - 1; k >= 1; k -= 1) {
      const rev = makeRevision((c.revisions - 1 - k) * NOTES.ghostStagger, false, geom)
      rev.rank = k
      archived(rev, k === 1 ? rev.born + NOTES.seedStrikeAt : rev.born - NOTES.strikeS)
      revisions.push(rev)
    }
    // …then the pen starts the current one, and the tally logs it.
    revisions.push(makeRevision(NOTES.penStart, true, geom))
    tally.push(NOTES.penStart)
    let nextReviseAt = NOTES.penStart + NOTES.reviseEvery
    let nextCorrAt = NOTES.corrFirst
    let t = 0
    let last = 0
    let raf = 0

    const step = (dt: number) => {
      t += dt
      if (t >= nextReviseAt) {
        supersedeCurrent(revisions, t) // exactly one attempt is ever struck
        revisions.push(makeRevision(t, true, geom))
        tally.push(t)
        if (tally.length > c.tally) tally.shift()
        nextReviseAt = t + NOTES.reviseEvery * rand(0.9, 1.12)
      }
      for (let i = revisions.length - 1; i >= 0; i -= 1) {
        const rev = revisions[i]
        if (rev.rank >= c.revisions && rev.retiredAt < 0) rev.retiredAt = t
        if (rev.retiredAt >= 0 && t - rev.retiredAt > NOTES.retireS) revisions.splice(i, 1)
      }
      if (corrections.length < c.corrections && t >= nextCorrAt && revisions.length >= 2) {
        const cor = makeCorrection(
          t,
          revisions[revisions.length - 1].loop,
          revisions[revisions.length - 2].loop,
          cx,
          cy,
        )
        if (cor) corrections.push(cor)
        nextCorrAt = t + NOTES.corrEvery * rand(0.85, 1.15)
      }
      for (let i = corrections.length - 1; i >= 0; i -= 1)
        if (t - corrections[i].born > correctionLife()) corrections.splice(i, 1)
    }

    const draw = () => {
      if (w < 2 || h < 2) return
      ctx.clearRect(0, 0, w, h)
      // Oldest first — the current attempt always lies on top of the stack.
      for (let i = 0; i < revisions.length; i += 1) {
        const rev = revisions[i]
        const age = t - rev.born
        if (age < 0) continue
        const retire = rev.retiredAt < 0 ? 1 : 1 - clamp01((t - rev.retiredAt) / NOTES.retireS)
        const current = rev.penned && rev.demotedAt < 0
        const fadeIn = clamp01(age / NOTES.ghostIn)
        // Arriving sheets slide the last of the way into the stack.
        const [ox, oy] = driftAt(rev, t, current ? 0 : (1 - fadeIn) * NOTES.ghostArrive)
        // The one attempt being drawn right now — everything else is archive.
        if (current) {
          const pen = easeInOut(clamp01(age / NOTES.traceS))
          drawRevision(rev, 0.52, pen, pal.bone, 1.3, ox, oy)
          if (pen < 1) drawPenHead(rev.loop, pen, ox, oy)
          continue
        }
        const rank = Math.max(1, rev.rank)
        drawRevision(rev, 0.26 * Math.exp(-(rank - 1) * 0.4) * retire * fadeIn, 1, pal.graphite, 1, ox, oy)
        drawStrike(
          rev,
          0.34 * retire * fadeIn,
          easeOutCubic(clamp01((t - rev.strikeAt) / NOTES.strikeS)),
          ox,
          oy,
        )
      }
      for (const cor of corrections) drawCorrection(cor, t - cor.born)
      drawTally(tally, t)
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
  }, [shape, tier, reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-motion={reducedMotion ? 'still' : 'live'}
      data-notes-mode={shape === 'pending' ? 'resolving' : shape ? 'revisions' : 'sheets'}
      className="absolute inset-0 h-full w-full"
    />
  )
}
