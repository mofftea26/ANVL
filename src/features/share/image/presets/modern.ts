import type { PresetDrawArgs, SharePreset } from '../../types'
import { alpha, drawImageInRoundedBox, fitText, hairlineWidth } from '../drawKit'
import { TYPE } from '../layout'
import {
  drawFooterLink,
  featMeta,
  FONT_BODY,
  FONT_DISPLAY,
  payloadEyebrow,
  payloadText,
  pieceLabel,
  recordLine,
  statRows,
} from './hudParts'
import { drawStage, pieceArt, stageIsTight, stageOwnsArt } from './stage'

/**
 * MODERN — editorial blocks. Accent bar and name top-left, then a piece block
 * (thumbnail, piece name, FEAT) above a full-width ruled stat ledger.
 *
 * The ledger runs the whole column rather than stopping at an arbitrary rail,
 * which is what used to leave a 600–800px empty gutter between the ledger and a
 * right-aligned footer.
 *
 * WITHOUT A PHOTO the block's thumbnail drops — the piece is standing above it —
 * and the eyebrow, piece name and feat all set flush to the same left margin as
 * the ledger below, so the whole lower half becomes one aligned editorial column.
 *
 * ON A SHORT CANVAS the ledger is the single most expensive thing in the set:
 * four ruled rows plus their base is 250 design units of a 1080px square, and
 * this was the preset whose hero collapsed hardest because of it. It collapses
 * to the one record line the quiet presets close with — the same five numbers,
 * one row instead of four — whenever the full stack would breach the stage's
 * floor. The story keeps its ledger; the DM keeps its subject.
 */
const LEDGER_STRIDE = 48
/** Room under the ledger's last rule for the closing mark. */
const LEDGER_BASE = 58
const BLOCK_H = 236
/**
 * With the piece promoted to the stage the thumbnail goes, so the block is only
 * as tall as the words in it: the last drawn line is the feat's date at +192 —
 * or the feat itself at +152 when there is no feat to date — plus 20 of
 * descender room under it. (The 44 the full block carries is descender room for
 * the +192 line, NOT air held for the 124-tall thumbnail, whose lower edge is
 * 68px higher up.)
 */
const BLOCK_META_SOLO = 212
const BLOCK_NO_META_SOLO = 172
/** The compact ledger: one record line at `bottom - 56`, block clear above it. */
const RECORD_H = 80
/** Air between the stage's lower edge and the block. */
const BAND_GAP = 40
/** Clearance under the identity block — where the stage may start. */
const HEAD_H = 76

function draw(args: PresetDrawArgs): void {
  const { ctx, colors, content, layout: L } = args
  const { champagne, bone } = colors
  const s = L.s

  const rows = statRows(content).slice(1)
  const solo = stageOwnsArt(args)
  const blockH = solo ? (featMeta(content) ? BLOCK_META_SOLO : BLOCK_NO_META_SOLO) : BLOCK_H
  const ledgerH = LEDGER_BASE + rows.length * LEDGER_STRIDE
  const compact = stageIsTight(args, HEAD_H, ledgerH + blockH + BAND_GAP)

  const ledgerBottomRule = L.bottom - LEDGER_BASE * s
  const ledgerTop = ledgerBottomRule - rows.length * LEDGER_STRIDE * s
  const blockTop = L.bottom - ((compact ? RECORD_H : ledgerH) + blockH) * s

  drawStage(args, { bandTop: blockTop - BAND_GAP * s, headBottom: L.top + HEAD_H * s })

  /* Identity ------------------------------------------------------------ */
  ctx.textAlign = 'left'
  ctx.fillStyle = champagne
  ctx.fillRect(L.left, L.top - 30 * s, 6 * s, 78 * s)
  const idX = L.left + 26 * s
  ctx.font = `700 ${TYPE.lead * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = bone
  ctx.fillText(fitText(ctx, content.owner.name.toUpperCase(), L.cw * 0.62), idX, L.top)
  ctx.font = `400 ${TYPE.meta * s}px ${FONT_BODY}`
  ctx.fillStyle = alpha(champagne, 0.9)
  ctx.fillText(fitText(ctx, content.owner.rankTitle.toUpperCase(), L.cw * 0.62), idX, L.top + 38 * s)

  ctx.textAlign = 'right'
  ctx.font = `700 ${TYPE.body * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = alpha(bone, 0.8)
  ctx.fillText('ANVL', L.right, L.top)

  /* The piece block ----------------------------------------------------- */
  const art = pieceArt(args)
  const thumbW = 104 * s
  if (art) drawImageInRoundedBox(ctx, art, L.left, blockTop, thumbW, 124 * s, 10 * s)
  const textX = art ? L.left + thumbW + 26 * s : L.left
  const textMax = L.right - textX

  ctx.textAlign = 'left'
  ctx.font = `500 ${TYPE.micro * s}px ${FONT_BODY}`
  ctx.fillStyle = alpha(champagne, 0.85)
  ctx.fillText(payloadEyebrow(content), textX, blockTop + 26 * s)
  ctx.font = `700 ${TYPE.title * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = alpha(bone, 0.74)
  ctx.fillText(fitText(ctx, pieceLabel(content), textMax), textX, blockTop + 84 * s)
  ctx.font = `700 ${TYPE.hero * s}px ${FONT_DISPLAY}`
  ctx.fillStyle = bone
  ctx.fillText(fitText(ctx, payloadText(content), textMax), textX, blockTop + 152 * s)

  const meta = featMeta(content)
  if (meta) {
    ctx.font = `400 ${TYPE.micro * s}px ${FONT_BODY}`
    ctx.fillStyle = alpha(bone, 0.5)
    ctx.fillText(meta, textX, blockTop + 192 * s)
  }

  /* Stat ledger — or, on a short canvas, its one-line form ---------------- */
  if (compact) {
    ctx.textAlign = 'left'
    ctx.font = `400 ${TYPE.micro * s}px ${FONT_BODY}`
    ctx.fillStyle = alpha(bone, 0.6)
    ctx.fillText(fitText(ctx, recordLine(content), L.cw), L.left, L.bottom - 56 * s)
  } else {
    rows.forEach(([label, value], i) => {
      const baseline = ledgerTop + i * LEDGER_STRIDE * s + 32 * s
      ctx.font = `400 ${TYPE.meta * s}px ${FONT_BODY}`
      ctx.fillStyle = alpha(bone, 0.55)
      ctx.textAlign = 'left'
      ctx.fillText(label, L.left, baseline)
      ctx.font = `600 ${TYPE.body * s}px ${FONT_BODY}`
      ctx.fillStyle = bone
      ctx.textAlign = 'right'
      ctx.fillText(value, L.right, baseline)
      ctx.strokeStyle = alpha(bone, 0.16)
      ctx.lineWidth = hairlineWidth(s)
      ctx.beginPath()
      ctx.moveTo(L.left, baseline + 16 * s)
      ctx.lineTo(L.right, baseline + 16 * s)
      ctx.stroke()
    })
  }

  drawFooterLink(ctx, L, { champagne, url: content.url, align: 'left' })
}

export const modernPreset: SharePreset = { key: 'modern', draw }
