import type { PresetDrawArgs, SharePreset } from '../../types'
import { alpha, drawImageInRoundedBox, fitText } from '../drawKit'
import { TYPE } from '../layout'
import {
  drawFooterLink,
  FONT_BODY,
  payloadText,
  pieceLabel,
  recordLine,
} from './hudParts'
import { drawStage, pieceArt } from './stage'

/**
 * MINIMAL — almost nothing. Name and rank top-left, one small piece chip and a
 * single record line at the base. The stage does the talking.
 *
 * It is the only preset that keeps sentence case: no display face, no rules, no
 * frames. Its restraint is the whole idea, so the FEAT leads by being the one
 * large line rather than by being decorated.
 *
 * WITHOUT A PHOTO the chip goes too, which is the most literal reading of the
 * brief this set has: the piece alone in the brand light, two lines above it and
 * two below, and nothing else anywhere on the frame.
 */
const BLOCK_H = 210
const CHIP = 76
/** Clearance under the identity block — where the stage may start. */
const HEAD_H = 76

function draw(args: PresetDrawArgs): void {
  const { ctx, colors, content, layout: L } = args
  const { champagne, bone } = colors
  const s = L.s
  const blockTop = L.bottom - BLOCK_H * s

  drawStage(args, { bandTop: blockTop - 40 * s, headBottom: L.top + HEAD_H * s })

  ctx.textAlign = 'left'
  ctx.font = `600 ${TYPE.lead * s}px ${FONT_BODY}`
  ctx.fillStyle = bone
  ctx.fillText(fitText(ctx, content.owner.name, L.cw * 0.7), L.left, L.top)
  ctx.font = `400 ${TYPE.meta * s}px ${FONT_BODY}`
  ctx.fillStyle = champagne
  ctx.fillText(fitText(ctx, content.owner.rankTitle, L.cw * 0.7), L.left, L.top + 38 * s)

  const art = pieceArt(args)
  if (art) drawImageInRoundedBox(ctx, art, L.left, blockTop, CHIP * 0.86 * s, CHIP * s, 8 * s)

  const textX = art ? L.left + (CHIP * 0.86 + 22) * s : L.left
  const textMax = L.right - textX
  ctx.font = `500 ${TYPE.body * s}px ${FONT_BODY}`
  ctx.fillStyle = alpha(bone, 0.7)
  ctx.fillText(fitText(ctx, pieceLabel(content), textMax), textX, blockTop + 30 * s)
  ctx.font = `600 ${TYPE.title * s}px ${FONT_BODY}`
  ctx.fillStyle = bone
  ctx.fillText(fitText(ctx, payloadText(content), textMax), textX, blockTop + 78 * s)

  ctx.textAlign = 'center'
  ctx.font = `400 ${TYPE.micro * s}px ${FONT_BODY}`
  ctx.fillStyle = alpha(bone, 0.6)
  ctx.fillText(fitText(ctx, recordLine(content), L.cw), L.W / 2, L.bottom - 56 * s)

  drawFooterLink(ctx, L, { champagne, url: content.url })
}

export const minimalPreset: SharePreset = { key: 'minimal', draw }
