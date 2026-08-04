import type { PresetDrawArgs, SharePreset } from '../../types'
import {
  alpha,
  drawImageInRoundedBox,
  fitText,
  hairlineWidth,
  strokeCrispRect,
  strokeRoundRect,
} from '../drawKit'
import { frameBox, FRAMED_FOOTER_LIFT, TYPE } from '../layout'
import {
  drawFooterLink,
  FONT_BODY,
  FONT_DISPLAY,
  payloadEyebrow,
  payloadText,
  pieceLabel,
  statRows,
} from './hudParts'
import { drawStage, pieceArt, stageIsTight, stageOwnsArt } from './stage'

/**
 * LUXE — double gold frame and a monogram. The piece rides in a gold-framed
 * medallion above the FEAT, with a divided stat strip closing the composition.
 *
 * The strip now OWNS the last band and the payload is anchored above it. In the
 * old version both were positioned from opposite ends and overprinted each
 * other by 16px in every format, with a divider rule bisecting the feat.
 *
 * WITHOUT A PHOTO the medallion is not merely dropped — its ROLE is handed
 * upward. The piece becomes the framed object in the middle of the gold rules
 * (which is what the medallion was always miniaturising), and the space the
 * medallion held is given back to it, so the centred stack closes up under a
 * full-size piece instead of leaving a 178px hole where a thumbnail used to be.
 *
 * ON A SHORT CANVAS the masthead and the strip both close up and the eyebrow
 * comes off. It is the one line that names a category rather than saying
 * something — the piece name and the FEAT under it carry the meaning — and
 * dropping it is far cheaper than a monogram frame around a 231px garment.
 */
const STRIP_TOP = 176
const STRIP_TOP_COMPACT = 146
const MED_W = 150
const MED_H = 178
/** Clearance under the three-line centred masthead, set loose and then tight. */
const HEAD_H = 154
const HEAD_H_COMPACT = 116
/** Masthead baselines under `L.top`: monogram, name, rank. */
const MAST = [34, 84, 118] as const
const MAST_COMPACT = [30, 72, 102] as const
/** Payload baselines ABOVE the strip. */
const PAYLOAD = { feat: 44, piece: 106, eyebrow: 146 } as const
/** Air between the stage's lower edge and the topmost payload line. */
const BAND_GAP = 44

function draw(args: PresetDrawArgs): void {
  const { ctx, colors, content, layout: L } = args
  const { champagne, bone } = colors
  const s = L.s

  const solo = stageOwnsArt(args)
  // The full stack runs from the strip up past the eyebrow the payload sits on.
  const compact = stageIsTight(args, HEAD_H, STRIP_TOP + PAYLOAD.eyebrow + BAND_GAP)
  const mast = compact ? MAST_COMPACT : MAST

  const stripTop = L.bottom - (compact ? STRIP_TOP_COMPACT : STRIP_TOP) * s
  const featY = stripTop - PAYLOAD.feat * s
  const pieceY = stripTop - PAYLOAD.piece * s
  const eyebrowY = compact ? null : stripTop - PAYLOAD.eyebrow * s
  const payloadTop = eyebrowY ?? pieceY
  const medY = payloadTop - 40 * s - MED_H * s
  const medX = (L.W - MED_W * s) / 2

  // The stage runs down to whichever object is actually there: the medallion's
  // own top edge, or — once the piece has been promoted — the topmost line of
  // the centred stack it sits on.
  drawStage(args, {
    bandTop: solo ? payloadTop - BAND_GAP * s : medY - 52 * s,
    headBottom: L.top + (compact ? HEAD_H_COMPACT : HEAD_H) * s,
  })

  /* Double frame --------------------------------------------------------- */
  const outer = frameBox(L, 34)
  ctx.strokeStyle = alpha(champagne, 0.9)
  ctx.lineWidth = Math.max(2, 3 * s)
  strokeCrispRect(ctx, outer.x, outer.y, outer.w, outer.h)
  ctx.strokeStyle = alpha(champagne, 0.34)
  ctx.lineWidth = hairlineWidth(s)
  strokeCrispRect(ctx, outer.x + 16 * s, outer.y + 16 * s, outer.w - 32 * s, outer.h - 32 * s)

  /* Masthead — set below the inner rule, not against it. */
  ctx.textAlign = 'center'
  ctx.font = `700 ${TYPE.title * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = champagne
  ctx.fillText('A N V L', L.W / 2, L.top + mast[0] * s)
  ctx.font = `700 ${TYPE.lead * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = bone
  ctx.fillText(
    fitText(ctx, content.owner.name.toUpperCase(), L.cw * 0.8),
    L.W / 2,
    L.top + mast[1] * s,
  )
  ctx.font = `400 ${TYPE.micro * s}px ${FONT_BODY}`
  ctx.fillStyle = alpha(champagne, 0.85)
  ctx.fillText(
    fitText(ctx, content.owner.rankTitle.toUpperCase(), L.cw * 0.8),
    L.W / 2,
    L.top + mast[2] * s,
  )

  /* Gold-framed medallion ------------------------------------------------ */
  const art = pieceArt(args)
  if (art) {
    drawImageInRoundedBox(ctx, art, medX, medY, MED_W * s, MED_H * s, 8 * s)
    ctx.strokeStyle = champagne
    ctx.lineWidth = Math.max(2, 2.5 * s)
    strokeRoundRect(ctx, medX, medY, MED_W * s, MED_H * s, 8 * s)
    ctx.strokeStyle = alpha(champagne, 0.28)
    ctx.lineWidth = hairlineWidth(s)
    strokeCrispRect(ctx, medX - 12 * s, medY - 12 * s, (MED_W + 24) * s, (MED_H + 24) * s)
  }

  /* Payload -------------------------------------------------------------- */
  ctx.textAlign = 'center'
  if (eyebrowY !== null) {
    ctx.font = `500 ${TYPE.micro * s}px ${FONT_BODY}`
    ctx.fillStyle = alpha(champagne, 0.9)
    ctx.fillText(payloadEyebrow(content), L.W / 2, eyebrowY)
  }
  ctx.font = `700 ${TYPE.title * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = alpha(bone, 0.74)
  ctx.fillText(fitText(ctx, pieceLabel(content), L.cw * 0.86), L.W / 2, pieceY)
  ctx.font = `700 ${TYPE.hero * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = bone
  ctx.fillText(fitText(ctx, payloadText(content), L.cw * 0.86), L.W / 2, featY)

  /* Divided stat strip --------------------------------------------------- */
  const strip = statRows(content).slice(1)
  const cell = L.cw / Math.max(1, strip.length)
  strip.forEach(([label, value], i) => {
    const cx = L.left + cell * i + cell / 2
    ctx.textAlign = 'center'
    // A step above its own label, or a single-digit value reads as smaller than
    // the word underneath it and the strip inverts.
    ctx.font = `700 ${TYPE.lead * s}px ${FONT_DISPLAY}`
    ctx.fillStyle = bone
    ctx.fillText(fitText(ctx, value, cell - 24 * s), cx, stripTop + 42 * s)
    ctx.font = `400 ${TYPE.micro * s}px ${FONT_BODY}`
    ctx.fillStyle = alpha(champagne, 0.8)
    ctx.fillText(fitText(ctx, label, cell - 24 * s), cx, stripTop + 74 * s)
    if (i > 0) {
      // Clamped to the strip itself — the old dividers were ±32px around a
      // baseline, which ran them straight through the line above.
      ctx.strokeStyle = alpha(champagne, 0.28)
      ctx.lineWidth = hairlineWidth(s)
      ctx.beginPath()
      ctx.moveTo(L.left + cell * i, stripTop + 10 * s)
      ctx.lineTo(L.left + cell * i, stripTop + 86 * s)
      ctx.stroke()
    }
  })

  drawFooterLink(ctx, L, { champagne, url: content.url, y: L.bottom - FRAMED_FOOTER_LIFT * s })
}

export const luxePreset: SharePreset = { key: 'luxe', draw }
