import type { PresetDrawArgs, ShareCanvas, SharePreset } from '../../types'
import { alpha, drawImageInRoundedBox, fitText, strokeCrispRect } from '../drawKit'
import { frameBox, FRAMED_FOOTER_LIFT, TYPE } from '../layout'
import {
  drawFooterLink,
  FONT_BODY,
  FONT_DISPLAY,
  payloadEyebrow,
  payloadText,
  pieceLabel,
} from './hudParts'
import { drawStage, pieceArt, stageIsTight, stageOwnsArt } from './stage'

/** Fill caps for the XP bars — friendly, not literal maxima. */
const BAR_CAPS = { feats: 10, wears: 50 } as const

const PLATE_W = 340
const PLATE_H = 104
const SLOT = 132
const BAR_W = 380
/** 16, not 14: a thinner track disappears into Instagram's recompression. */
const BAR_H = 16
const BAR_STRIDE = 74
/** The equipped block: the socket, plus the row of air under it. */
const BLOCK_H = SLOT + BAR_STRIDE
/** Without the socket the block is only its three lines — the last at +150. */
const BLOCK_H_SOLO = 190
/** From `L.bottom` up to the first bar's label, with the bars stacked... */
const BARS_TOP = 216
/** ...and with them laid out side by side, one row instead of two. */
const BARS_TOP_COMPACT = 120
/** Air between the stage's lower edge and the equipped block. */
const BAND_GAP = 40
/** Clearance under the level plate (which starts 44 ABOVE the first baseline). */
const HEAD_H = 96
const HEAD_H_COMPACT = 80

/**
 * GAME — a videogame heads-up display. Corner brackets, a level plate, the
 * piece in an equipped-item slot, and XP-style bars for the record.
 *
 * The plate, slot and bars keep a CONSTANT pixel size in every format: they are
 * chrome, and chrome that shrinks by 44% between a story and a DM stops reading
 * as a HUD at all.
 *
 * WITHOUT A PHOTO the equipped slot is removed OUTRIGHT — box, gold stroke and
 * all. An empty item socket next to the very item it is supposed to hold is the
 * one thing a HUD must never show, and the piece is already equipped in the
 * middle of the brackets. The EQUIPPED line and its stack simply move to the
 * left margin; the brackets, plate and bars are untouched.
 *
 * ON A SHORT CANVAS the two XP bars go side by side instead of stacked. A HUD
 * lays its meters out to fit the screen it is on — that is what a HUD IS — so
 * this costs the look nothing and hands 96 design units back to the subject.
 */
function draw(args: PresetDrawArgs): void {
  const { ctx, colors, content, layout: L } = args
  const { champagne, bone } = colors
  const s = L.s

  const blockH = stageOwnsArt(args) ? BLOCK_H_SOLO : BLOCK_H
  const compact = stageIsTight(args, HEAD_H, BARS_TOP + blockH + BAND_GAP)
  const headH = compact ? HEAD_H_COMPACT : HEAD_H

  const barsTop = L.bottom - (compact ? BARS_TOP_COMPACT : BARS_TOP) * s
  const slotY = barsTop - blockH * s

  drawStage(args, { bandTop: slotY - BAND_GAP * s, headBottom: L.top + headH * s })

  drawBrackets(ctx, args, champagne)

  /* Level plate ---------------------------------------------------------- */
  const plateY = L.top - 44 * s
  ctx.fillStyle = alpha(champagne, 0.14)
  ctx.fillRect(L.left, plateY, PLATE_W * s, PLATE_H * s)
  ctx.strokeStyle = champagne
  ctx.lineWidth = Math.max(2, 2 * s)
  strokeCrispRect(ctx, L.left, plateY, PLATE_W * s, PLATE_H * s)

  // One box, computed once, for both plate columns — the rank title used to be
  // drawn unfitted, so a CMS-authored rank ran straight out of the gold plate.
  const lvX = L.left + 20 * s
  const plateTextX = L.left + 140 * s
  const plateTextMax = L.left + (PLATE_W - 16) * s - plateTextX

  ctx.textAlign = 'left'
  ctx.font = `700 ${TYPE.title * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = bone
  ctx.fillText(
    fitText(ctx, `LV ${content.stats.pieceCount}`, plateTextX - lvX - 12 * s),
    lvX,
    plateY + 62 * s,
  )
  ctx.font = `500 ${TYPE.micro * s}px ${FONT_BODY}`
  ctx.fillStyle = champagne
  ctx.fillText(
    fitText(ctx, content.owner.rankTitle.toUpperCase(), plateTextMax),
    plateTextX,
    plateY + 44 * s,
  )
  ctx.fillStyle = alpha(bone, 0.8)
  ctx.fillText(
    fitText(ctx, content.owner.name.toUpperCase(), plateTextMax),
    plateTextX,
    plateY + 74 * s,
  )

  /* Equipped slot — the piece, only when the stage is not already showing it */
  const art = pieceArt(args)
  if (art) {
    ctx.fillStyle = alpha(colors.black, 0.55)
    ctx.fillRect(L.left, slotY, SLOT * s, SLOT * s)
    ctx.strokeStyle = alpha(champagne, 0.7)
    ctx.lineWidth = Math.max(2, 2 * s)
    strokeCrispRect(ctx, L.left, slotY, SLOT * s, SLOT * s)
    drawImageInRoundedBox(ctx, art, L.left + 6 * s, slotY + 6 * s, (SLOT - 12) * s, (SLOT - 12) * s, 4 * s)
  }

  const textX = art ? L.left + (SLOT + 24) * s : L.left
  const textMax = L.right - textX
  ctx.textAlign = 'left'
  ctx.font = `500 ${TYPE.micro * s}px ${FONT_BODY}`
  ctx.fillStyle = alpha(champagne, 0.9)
  ctx.fillText(fitText(ctx, `EQUIPPED · ${payloadEyebrow(content)}`, textMax), textX, slotY + 30 * s)
  ctx.font = `700 ${TYPE.title * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = alpha(bone, 0.74)
  ctx.fillText(fitText(ctx, pieceLabel(content), textMax), textX, slotY + 84 * s)
  ctx.font = `700 ${TYPE.hero * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = bone
  ctx.fillText(fitText(ctx, payloadText(content), textMax), textX, slotY + 150 * s)

  /* XP bars — stacked, or side by side on a short canvas ------------------ */
  const bars: Array<[string, number, number]> = [
    ['FEATS', content.stats.featCount, BAR_CAPS.feats],
    ['WEARS', content.stats.totalWears, BAR_CAPS.wears],
  ]
  const column = L.cw / bars.length
  const barW = compact ? Math.min(BAR_W * s, column - 32 * s) : BAR_W * s
  bars.forEach(([label, value, cap], i) => {
    const x = compact ? L.left + column * i : L.left
    const y = compact ? barsTop : barsTop + i * BAR_STRIDE * s
    ctx.textAlign = 'left'
    ctx.font = `600 ${TYPE.meta * s}px ${FONT_BODY}`
    ctx.fillStyle = bone
    ctx.fillText(`${label}  ${value}`, x, y)
    ctx.fillStyle = alpha(bone, 0.16)
    ctx.fillRect(x, y + 14 * s, barW, BAR_H * s)
    ctx.fillStyle = champagne
    ctx.fillRect(x, y + 14 * s, barW * Math.min(1, value / cap), BAR_H * s)
  })

  drawFooterLink(ctx, L, {
    champagne,
    url: content.url,
    align: 'right',
    y: L.bottom - FRAMED_FOOTER_LIFT * s,
  })
}

/** Four corner brackets on the safe box — the HUD's outer chrome. */
function drawBrackets(ctx: ShareCanvas, args: PresetDrawArgs, champagne: string): void {
  const { layout: L } = args
  const box = frameBox(L, 34)
  const arm = 54 * L.s
  const corners: Array<[number, number, number, number]> = [
    [box.x, box.y, 1, 1],
    [box.x + box.w, box.y, -1, 1],
    [box.x, box.y + box.h, 1, -1],
    [box.x + box.w, box.y + box.h, -1, -1],
  ]
  ctx.strokeStyle = champagne
  ctx.lineWidth = Math.max(3, 4 * L.s)
  for (const [x, y, dx, dy] of corners) {
    ctx.beginPath()
    ctx.moveTo(x + dx * arm, y)
    ctx.lineTo(x, y)
    ctx.lineTo(x, y + dy * arm)
    ctx.stroke()
  }
}

export const gamePreset: SharePreset = { key: 'game', draw }
