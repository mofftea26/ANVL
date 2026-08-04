import type { PresetDrawArgs, SharePreset } from '../../types'
import {
  alpha,
  drawImageInRoundedBox,
  fitText,
  hairlineWidth,
  strokeCrispRect,
} from '../drawKit'
import { frameBox, FRAMED_FOOTER_LIFT, TYPE } from '../layout'
import {
  drawFooterLink,
  FONT_BODY,
  FONT_HERALD,
  payloadEyebrow,
  payloadText,
  pieceLabel,
  recordLine,
} from './hudParts'
import { drawStage, pieceArt, stageIsTight, stageOwnsArt } from './stage'

/**
 * PREMIUM — heraldic. A Cinzel masthead inside a hairline frame, with the piece
 * in a framed plate at the base and the FEAT called out as the plate's headline.
 *
 * The frame sits ON the safe box, so the closing mark lifts clear of its bottom
 * rule instead of resting on it.
 *
 * WITHOUT A PHOTO the plate keeps its rule but gives up its thumbnail: the piece
 * stands in the frame above, and the plate becomes a pure engraved caption —
 * three centred-serif lines set flush inside their own hairline box.
 *
 * ON A SHORT CANVAS the engraved lines close up inside the plate, the plate
 * moves closer to the record line and the stage's gap tightens. Nothing is
 * removed — an engraving is set tighter on a smaller stone.
 */
const PLATE_TOP = 350
const PLATE_H = 210
/**
 * The plate is sized around its THUMBNAIL — 166px of artwork plus 22px of
 * margin top and bottom — while the engraved lines inside it need only ~156.
 * With the piece promoted to the stage, the plate shrinks to what the words
 * actually occupy and hands the 34px back to the piece.
 */
const PLATE_TOP_SOLO = 316
const PLATE_H_SOLO = 176
/** Tighter still: the same three lines on a 1080-tall canvas. */
const PLATE_TOP_COMPACT = 274
const PLATE_H_COMPACT = 158
/** Engraved baselines inside the plate: eyebrow, piece, FEAT. */
const ENGRAVED = [40, 78, 146] as const
const ENGRAVED_COMPACT = [34, 70, 132] as const
/** Air between the stage's lower edge and the plate. */
const PLATE_GAP = 60
const PLATE_GAP_COMPACT = 40
/** How far the record line rides above the closing mark. */
const RECORD_LIFT = 96
const RECORD_LIFT_COMPACT = 80
/** Clearance under the three-line Cinzel masthead. */
const HEAD_H = 116
const HEAD_H_COMPACT = 100

function draw(args: PresetDrawArgs): void {
  const { ctx, colors, content, layout: L } = args
  const { champagne, bone } = colors
  const s = L.s
  const solo = stageOwnsArt(args)
  const compact = stageIsTight(args, HEAD_H, (solo ? PLATE_TOP_SOLO : PLATE_TOP) + PLATE_GAP)
  const engraved = compact ? ENGRAVED_COMPACT : ENGRAVED

  const plateH = (compact ? PLATE_H_COMPACT : solo ? PLATE_H_SOLO : PLATE_H) * s
  const plateY =
    L.bottom - (compact ? PLATE_TOP_COMPACT : solo ? PLATE_TOP_SOLO : PLATE_TOP) * s

  drawStage(args, {
    bandTop: plateY - (compact ? PLATE_GAP_COMPACT : PLATE_GAP) * s,
    headBottom: L.top + (compact ? HEAD_H_COMPACT : HEAD_H) * s,
  })

  const frame = frameBox(L, 22)
  ctx.strokeStyle = alpha(champagne, 0.4)
  ctx.lineWidth = hairlineWidth(s)
  strokeCrispRect(ctx, frame.x, frame.y, frame.w, frame.h)

  /* Masthead ------------------------------------------------------------- */
  ctx.textAlign = 'center'
  ctx.font = `600 ${TYPE.meta * s}px ${FONT_HERALD}`
  ctx.fillStyle = champagne
  ctx.fillText('ANVL ATHLETICS', L.W / 2, L.top)
  ctx.font = `700 ${TYPE.lead * s}px ${FONT_HERALD}`
  ctx.fillStyle = bone
  ctx.fillText(fitText(ctx, content.owner.name.toUpperCase(), L.cw * 0.86), L.W / 2, L.top + 46 * s)
  ctx.font = `500 ${TYPE.micro * s}px ${FONT_HERALD}`
  ctx.fillStyle = alpha(bone, 0.7)
  ctx.fillText(
    fitText(ctx, content.owner.rankTitle.toUpperCase(), L.cw * 0.86),
    L.W / 2,
    L.top + 80 * s,
  )

  /* Framed piece plate --------------------------------------------------- */
  ctx.strokeStyle = alpha(champagne, 0.35)
  ctx.lineWidth = hairlineWidth(s)
  strokeCrispRect(ctx, L.left, plateY, L.cw, plateH)

  const art = pieceArt(args)
  const thumbH = plateH - 44 * s
  const thumbW = thumbH * 0.84
  if (art) drawImageInRoundedBox(ctx, art, L.left + 22 * s, plateY + 22 * s, thumbW, thumbH, 6 * s)

  const textX = art ? L.left + 22 * s + thumbW + 26 * s : L.left + 30 * s
  const textMax = L.right - 30 * s - textX

  ctx.textAlign = 'left'
  ctx.font = `500 ${TYPE.micro * s}px ${FONT_HERALD}`
  ctx.fillStyle = alpha(champagne, 0.9)
  ctx.fillText(payloadEyebrow(content), textX, plateY + engraved[0] * s)
  ctx.font = `600 ${TYPE.title * s}px ${FONT_HERALD}`
  ctx.fillStyle = alpha(bone, 0.74)
  ctx.fillText(fitText(ctx, pieceLabel(content), textMax), textX, plateY + engraved[1] * s)
  ctx.font = `700 ${TYPE.hero * s}px ${FONT_HERALD}`
  ctx.fillStyle = bone
  ctx.fillText(fitText(ctx, payloadText(content), textMax), textX, plateY + engraved[2] * s)

  ctx.textAlign = 'center'
  ctx.font = `400 ${TYPE.micro * s}px ${FONT_BODY}`
  ctx.fillStyle = alpha(bone, 0.6)
  ctx.fillText(
    fitText(ctx, recordLine(content), L.cw),
    L.W / 2,
    L.bottom - (compact ? RECORD_LIFT_COMPACT : RECORD_LIFT) * s,
  )

  drawFooterLink(ctx, L, { champagne, url: content.url, y: L.bottom - FRAMED_FOOTER_LIFT * s })
}

export const premiumPreset: SharePreset = { key: 'premium', draw }
