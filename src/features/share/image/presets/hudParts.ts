import { displayLink } from '../../captions'
import type { ShareCanvas, ShareContext } from '../../types'
import { alpha, featDate, monthYear } from '../drawKit'
import { TYPE, type ShareLayout } from '../layout'

/**
 * The WORDS every preset shares: the payload, the record rows, the piece's
 * identity, the closing mark. Presets differ in ARRANGEMENT, not in what they
 * say — so all of this lives once, here.
 *
 * What they are arranged ON is the other half, and it lives in `stage.ts`.
 */

export const FONT_DISPLAY = 'Anton, Oswald, sans-serif'
export const FONT_BODY = 'Sora, sans-serif'
export const FONT_HERALD = 'Cinzel, serif'
export const FONT_MONO = "Consolas, 'SF Mono', monospace"

/** The athlete's record, label/value pairs, rank first. */
export function statRows(content: ShareContext): Array<[string, string]> {
  const rows: Array<[string, string]> = [
    ['RANK', content.owner.rankTitle.toUpperCase()],
    ['PIECES', String(content.stats.pieceCount)],
    ['FEATS', String(content.stats.featCount)],
    ['WEARS', String(content.stats.totalWears)],
  ]
  const since = monthYear(content.owner.memberSince)
  if (since) rows.push(['SINCE', since])
  return rows
}

/** The piece's name, or the armory itself when the sheet has no piece yet. */
export function pieceLabel(content: ShareContext): string {
  return (content.piece?.name ?? 'The Armory').toUpperCase()
}

/**
 * THE PAYLOAD — the one thing the image exists to say.
 *
 * The chosen feat wins: it is what the athlete opened the sheet for, and it is
 * what `buildShareCaption` leads the caption with. Every preset sets this at
 * its largest type size, so the image and the caption agree about what the post
 * is for. Without a feat, the piece's wear count carries it, then the rank.
 */
export function payloadText(content: ShareContext): string {
  if (content.feat) return content.feat.title.toUpperCase()
  const wears = content.piece?.wearCount ?? 0
  if (wears > 0) return `WORN ${wears} ${wears === 1 ? 'TIME' : 'TIMES'}`
  return content.owner.rankTitle.toUpperCase()
}

/** The small line that tells the reader what the payload IS. */
export function payloadEyebrow(content: ShareContext): string {
  if (content.feat) return 'FEAT OF STRENGTH'
  if ((content.piece?.wearCount ?? 0) > 0) return 'THE RECORD'
  return 'THE RANK'
}

/** Feat detail for presets with room for a second line. */
export function featMeta(content: ShareContext): string | null {
  if (!content.feat) return null
  return featDate(content.feat.achievedOn).toUpperCase()
}

/**
 * The closing mark — host only; the real URL travels with the post.
 *
 * It is the smallest thing on the image on purpose: a maker's mark, not a call
 * to action. Its baseline IS `layout.bottom`, which is what pins every preset's
 * bottom edge to one line. Framed presets lift it by `FRAMED_FOOTER_LIFT` so a
 * frame rule never crowds it.
 */
export function drawFooterLink(
  ctx: ShareCanvas,
  L: ShareLayout,
  opts: { champagne: string; url: string; align?: CanvasTextAlign; y?: number },
): void {
  const align = opts.align ?? 'center'
  ctx.textAlign = align
  ctx.fillStyle = alpha(opts.champagne, 0.72)
  ctx.font = `600 ${TYPE.micro * L.s}px ${FONT_BODY}`
  const x = align === 'right' ? L.right : align === 'left' ? L.left : L.W / 2
  ctx.fillText(displayLink(opts.url), x, opts.y ?? L.bottom)
}

/** `7 PIECES · 12 FEATS · 48 WEARS · SINCE MAR 2025` — the record as one line. */
export function recordLine(content: ShareContext, includeRank = false): string {
  const parts = [
    `${content.stats.pieceCount} PIECES`,
    `${content.stats.featCount} FEATS`,
    `${content.stats.totalWears} WEARS`,
  ]
  if (includeRank) parts.unshift(content.owner.rankTitle.toUpperCase())
  const since = monthYear(content.owner.memberSince)
  if (since) parts.push(`SINCE ${since}`)
  return parts.join('   ·   ')
}
