import { BRAND } from '@/shared/constants/brand'
import type { ShareContext } from './types'

/**
 * The words that travel with the image. Derived, never authored — the caption
 * has to stay true when the user switches feat or piece mid-flow.
 */

/** Post caption: the feat leads when there is one, else the piece. */
export function buildShareCaption(context: ShareContext): string {
  const { piece, feat, owner } = context
  if (feat && piece) {
    return `${feat.title} — in the ${piece.name}. ${BRAND.tagline}.`
  }
  if (feat) {
    return `${feat.title}. ${BRAND.tagline}.`
  }
  if (piece) {
    return `${piece.name} — forged by ${owner.name} at ${BRAND.shortMark}.`
  }
  return `${owner.name}'s ${BRAND.shortMark} armory — ${owner.rankTitle}.`
}

/** Short title for the OS share sheet. */
export function buildShareTitle(context: ShareContext): string {
  if (context.feat) return context.feat.title
  if (context.piece) return context.piece.name
  return `${BRAND.shortMark} Armory`
}

/** Everything the sheet posts: caption + link, one string. */
export function buildShareMessage(context: ShareContext): string {
  return `${buildShareCaption(context)} ${context.url}`
}

/** `anvl-oath-stringer-deadlift-pr.png` — kebab, safe, never empty. */
export function buildShareFilename(context: ShareContext): string {
  const parts = [
    BRAND.shortMark,
    context.piece?.name,
    context.feat?.title,
  ].filter((p): p is string => Boolean(p && p.trim()))

  const slug = parts
    .join(' ')
    .toLowerCase()
    .normalize('NFKD')
    // Drop accents and anything that is not a word character or a separator.
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
    .replace(/-+$/g, '')

  return `${slug || 'anvl-share'}.png`
}

/** Just the host — what the generated image prints, never the full handle URL. */
export function displayLink(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0] ?? url
  }
}
