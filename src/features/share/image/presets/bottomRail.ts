import type { PresetDrawArgs, SharePreset } from '../../types'
import { alpha, drawImageInRoundedBox, fitText, hairlineWidth, strokeRoundRect } from '../drawKit'
import { TYPE } from '../layout'
import {
  drawFooterLink,
  FONT_BODY,
  FONT_DISPLAY,
  payloadText,
  pieceLabel,
  recordLine,
} from './hudParts'
import { drawStage, pieceArt } from './stage'

/**
 * BOTTOM RAIL — the default look.
 *
 * One rail across the base carries everything, on two shared optical rows: the
 * piece name against the wear count, then the FEAT — set as the headline —
 * against its label. The identity block up top is deliberately quiet; the
 * athlete's name is not the news, the feat is.
 *
 * The rail is pinned ABOVE Instagram's reply bar and the identity sits BELOW
 * its profile row, so nothing the image says can be covered by app furniture.
 * The middle of the frame is left entirely to the stage.
 *
 * WITHOUT A PHOTO the piece is already the hero above the rail, so the rail's
 * thumb collapses and both rows run from the left margin — a single clean bar
 * under the product rather than the same garment printed twice.
 */
const RAIL_H = 268
const THUMB_H = 128
const THUMB_W = 110
const THUMB_R = 12
/** Clearance under the identity block — where the stage may start. */
const HEAD_H = 76

function draw(args: PresetDrawArgs): void {
  const { ctx, colors, content, layout: L } = args
  const { champagne, bone } = colors
  const s = L.s
  const railTop = L.bottom - RAIL_H * s

  drawStage(args, { bandTop: railTop - 40 * s, headBottom: L.top + HEAD_H * s })

  /* Identity, top — small on purpose. */
  ctx.textAlign = 'left'
  ctx.font = `500 ${TYPE.meta * s}px ${FONT_BODY}`
  ctx.fillStyle = champagne
  ctx.fillText(fitText(ctx, content.owner.rankTitle.toUpperCase(), L.cw * 0.6), L.left, L.top)
  ctx.font = `700 ${TYPE.lead * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = bone
  ctx.fillText(fitText(ctx, content.owner.name.toUpperCase(), L.cw * 0.7), L.left, L.top + 42 * s)

  /* The rail ------------------------------------------------------------ */
  ctx.strokeStyle = alpha(champagne, 0.5)
  ctx.lineWidth = hairlineWidth(s)
  ctx.beginPath()
  ctx.moveTo(L.left, railTop)
  ctx.lineTo(L.right, railTop)
  ctx.stroke()

  const thumbY = railTop + 34 * s
  const art = pieceArt(args)
  if (art) {
    drawImageInRoundedBox(ctx, art, L.left, thumbY, THUMB_W * s, THUMB_H * s, THUMB_R * s)
    ctx.strokeStyle = alpha(champagne, 0.45)
    ctx.lineWidth = hairlineWidth(s)
    strokeRoundRect(ctx, L.left, thumbY, THUMB_W * s, THUMB_H * s, THUMB_R * s)
  }

  // Two rows, not four near-misses: the old rail drew paired labels 2px and 8px
  // apart, which reads as a rendering fault rather than as a hierarchy.
  const rowA = railTop + 86 * s
  const rowB = railTop + 148 * s
  const gutter = 40 * s

  /* Right column — measured first so the payload can never run into it. */
  ctx.textAlign = 'right'
  ctx.font = `700 ${TYPE.title * s}px ${FONT_DISPLAY}`
  const statValue = String(content.stats.totalWears)
  const statW = ctx.measureText(statValue).width
  ctx.fillStyle = alpha(bone, 0.9)
  ctx.fillText(statValue, L.right, rowA)
  ctx.font = `500 ${TYPE.meta * s}px ${FONT_BODY}`
  const labelW = ctx.measureText('WEARS').width
  ctx.fillStyle = alpha(champagne, 0.85)
  ctx.fillText('WEARS', L.right, rowB)

  /* Left column — the piece, then the payload. */
  const textX = art ? L.left + (THUMB_W + 28) * s : L.left
  ctx.textAlign = 'left'
  ctx.font = `700 ${TYPE.title * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = alpha(bone, 0.72)
  ctx.fillText(fitText(ctx, pieceLabel(content), L.right - statW - gutter - textX), textX, rowA)

  ctx.font = `700 ${TYPE.hero * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = bone
  ctx.fillText(fitText(ctx, payloadText(content), L.right - labelW - gutter - textX), textX, rowB)

  /* Closing rows -------------------------------------------------------- */
  ctx.textAlign = 'center'
  ctx.font = `400 ${TYPE.micro * s}px ${FONT_BODY}`
  ctx.fillStyle = alpha(bone, 0.6)
  ctx.fillText(fitText(ctx, recordLine(content), L.cw), L.W / 2, L.bottom - 56 * s)

  drawFooterLink(ctx, L, { champagne, url: content.url })
}

export const bottomRailPreset: SharePreset = { key: 'bottom-rail', draw }
