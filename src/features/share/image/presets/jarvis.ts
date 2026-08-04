import type { PresetDrawArgs, SharePreset } from '../../types'
import {
  alpha,
  drawImageInRoundedBox,
  fitSuffix,
  fitText,
  hairlineWidth,
  strokeRoundRect,
} from '../drawKit'
import { TYPE, type ShareLayout } from '../layout'
import {
  drawFooterLink,
  featMeta,
  FONT_MONO,
  payloadText,
  pieceLabel,
  recordLine,
  statRows,
} from './hudParts'
import { drawStage, pieceArt, stageIsTight, type HeroBox } from './stage'

/** Reticle arcs: [start angle, sweep, alpha]. The RADIUS is not here — see
 *  {@link reticleRings}, which takes it from whatever is under the crosshairs. */
const ARCS = [
  [-0.4, 1.6, 0.67],
  [1.2, 2.2, 0.4],
  [-1.8, 1.1, 0.27],
] as const
/** Radii for the PHOTO path, where the reticle is aimed at a face — an object
 *  with no measurable box — so it keeps a fixed design-unit size. */
const FACE_RINGS = [150, 178, 206] as const
/** How far outside the subject's own corners the innermost ring sits. */
const RING_CLEAR = 1.04
/** Keep the outer ring off the canvas edge... */
const RING_EDGE = 20
/** ...and, when the frame cannot hold a wider one, still spread the three. */
const RING_MIN_SPREAD = 1.12

const COLUMN_W = 440
const BLOCK_H = 200
const BLOCK_H_COMPACT = 170
const THUMB = 104
/** Air between the stage's lower edge and the readout block. */
const BAND_GAP = 40
/** Clearance under the five-row mono data column — and under its short form. */
const HEAD_H = 230
const HEAD_H_COMPACT = 116

/**
 * JARVIS — an assistant readout. Reticle arcs over the subject and a mono data
 * column down the left, with the piece scanned in as a bracketed thumbnail.
 *
 * A uniform mono grid is its identity, so the FEAT leads by ONE step of the
 * scale plus full-strength bone, not by a display face. Every prefixed line is
 * fitted against a MEASURED prefix — the old budgets subtracted guessed pixel
 * widths and one of them was short enough to print past the margin.
 *
 * WITHOUT A PHOTO the reticle is REAIMED rather than removed: with the athlete
 * gone the thing under scan is the piece, so the arcs take their radii from the
 * hero's own box and ring it. They used to be fixed at 150/178/206 against a
 * 584x700 plate — three gold arcs scribbled across the middle of a t-shirt,
 * which is the exact opposite of a reticle acquiring a subject. The bracketed
 * chip in the readout block drops with the photo: the object it was standing in
 * for is now full size, dead centre, inside the crosshairs.
 *
 * ON A SHORT CANVAS the five-row column becomes three: athlete, rank, and one
 * record line carrying the same four numbers. It is still a mono readout — it
 * just stops spending a fifth of a square canvas saying so.
 */
function draw(args: PresetDrawArgs): void {
  const { ctx, colors, content, layout: L } = args
  const { champagne, bone } = colors
  const s = L.s
  const compact = stageIsTight(args, HEAD_H, BLOCK_H + BAND_GAP)
  const blockTop = L.bottom - (compact ? BLOCK_H_COMPACT : BLOCK_H) * s
  const bandTop = blockTop - BAND_GAP * s
  const headBottom = L.top + (compact ? HEAD_H_COMPACT : HEAD_H) * s

  const hero = drawStage(args, { bandTop, headBottom })

  /* Reticle — aimed at whatever the stage is actually showing, and sized to it
   * whenever that thing has an edge to ring. */
  const subjectY = hero ? hero.y + hero.h / 2 : (headBottom + bandTop) / 2
  const cx = args.photo ? L.W * 0.72 : L.W / 2
  const cy = args.photo ? L.top + L.free * 0.28 : subjectY
  reticleRings(L, hero, cx, cy).forEach((radius, i) => {
    const arc = ARCS[i]
    if (!arc) return
    const [start, sweep, a] = arc
    ctx.strokeStyle = alpha(champagne, a)
    ctx.lineWidth = Math.max(2, 2.5 * s)
    ctx.beginPath()
    ctx.arc(cx, cy, radius, start, start + sweep)
    ctx.stroke()
  })
  ctx.strokeStyle = alpha(champagne, 0.53)
  ctx.lineWidth = hairlineWidth(s)
  ctx.beginPath()
  ctx.moveTo(cx - 16 * s, cy)
  ctx.lineTo(cx + 16 * s, cy)
  ctx.moveTo(cx, cy - 16 * s)
  ctx.lineTo(cx, cy + 16 * s)
  ctx.stroke()

  /* Data column ---------------------------------------------------------- */
  ctx.textAlign = 'left'
  ctx.font = `500 ${TYPE.body * s}px ${FONT_MONO}`
  ctx.fillStyle = champagne
  ctx.fillText(
    fitSuffix(ctx, '> ATHLETE: ', content.owner.name.toUpperCase(), COLUMN_W * s),
    L.left,
    L.top,
  )
  if (compact) {
    ctx.fillStyle = alpha(bone, 0.8)
    ctx.fillText(
      fitSuffix(ctx, '> RANK: ', content.owner.rankTitle.toUpperCase(), COLUMN_W * s),
      L.left,
      L.top + 44 * s,
    )
    // The four counters as one detail row. A readout that drops to a summary
    // line when the screen shortens is what a readout does.
    ctx.font = `500 ${TYPE.meta * s}px ${FONT_MONO}`
    ctx.fillStyle = alpha(bone, 0.6)
    ctx.fillText(fitSuffix(ctx, '> RECORD: ', recordLine(content), L.cw), L.left, L.top + 82 * s)
  } else {
    statRows(content).forEach(([label, value], i) => {
      ctx.fillStyle = alpha(bone, 0.8)
      ctx.fillText(
        fitText(ctx, `> ${label}: ${value}`, COLUMN_W * s),
        L.left,
        L.top + (44 + i * 38) * s,
      )
    })
  }

  /* Scanned piece -------------------------------------------------------- */
  const art = pieceArt(args)
  const thumbW = THUMB * 0.86 * s
  if (art) {
    drawImageInRoundedBox(ctx, art, L.left, blockTop, thumbW, THUMB * s, 2 * s)
    ctx.strokeStyle = alpha(champagne, 0.53)
    ctx.lineWidth = hairlineWidth(s)
    strokeRoundRect(ctx, L.left, blockTop, thumbW, THUMB * s, 2 * s)
  }

  const textX = art ? L.left + thumbW + 20 * s : L.left
  const textMax = L.right - textX

  ctx.font = `500 ${TYPE.body * s}px ${FONT_MONO}`
  ctx.fillStyle = alpha(champagne, 0.9)
  ctx.fillText(fitSuffix(ctx, '> PIECE: ', pieceLabel(content), textMax), textX, blockTop + 34 * s)

  ctx.font = `700 ${TYPE.lead * s}px ${FONT_MONO}`
  ctx.fillStyle = bone
  ctx.fillText(fitSuffix(ctx, '> ', payloadText(content), textMax), textX, blockTop + 86 * s)

  const meta = featMeta(content)
  ctx.font = `500 ${TYPE.micro * s}px ${FONT_MONO}`
  ctx.fillStyle = alpha(bone, 0.55)
  ctx.fillText(
    fitText(ctx, meta ? `> LOGGED: ${meta}` : '> STATUS: FORGED', textMax),
    textX,
    blockTop + 132 * s,
  )

  drawFooterLink(ctx, L, { champagne, url: content.url, align: 'left' })
}

/**
 * Three radii that RING the subject rather than crossing it.
 *
 * With no measurable box under the crosshairs — a photo, or a stage showing
 * nothing but atmosphere — the fixed design-unit radii stand: they are aimed at
 * a face. Otherwise the innermost ring clears the hero's own corners (its
 * half-diagonal plus a margin) and the outermost reaches as far as the frame
 * allows on all four sides, with the third spaced between them. An arc that ran
 * off the canvas would read as a rendering fault, not as a HUD.
 */
function reticleRings(
  L: ShareLayout,
  hero: HeroBox | null,
  cx: number,
  cy: number,
): readonly number[] {
  if (!hero) return FACE_RINGS.map((radius) => radius * L.s)
  const inner = (Math.hypot(hero.w, hero.h) / 2) * RING_CLEAR
  const reach = Math.min(cx, L.W - cx, cy, L.H - cy) - RING_EDGE * L.s
  const outer = Math.max(reach, inner * RING_MIN_SPREAD)
  return [inner, (inner + outer) / 2, outer]
}

export const jarvisPreset: SharePreset = { key: 'jarvis', draw }
