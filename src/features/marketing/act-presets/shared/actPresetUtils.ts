import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import { cn } from '@/shared/lib/cn'

/** Per-act min-height modifiers (see `styles.css`). */
export type ActSectionSize =
  | 'default'
  | 'standard'
  | 'tall'
  | 'compact'
  | 'content'
  | 'showcase'
  | 'reveal'

export const ACT_SECTION_SIZE_CLASS: Record<ActSectionSize, string> = {
  default: 'anvl-act-section--standard',
  standard: 'anvl-act-section--standard',
  tall: 'anvl-act-section--tall',
  compact: 'anvl-act-section--compact',
  content: 'anvl-act-section--content',
  showcase: 'anvl-act-section--showcase',
  reveal: 'anvl-act-section--reveal',
}

/** Landing act shell — grows with content; optional size modifier. */
export const ACT_SECTION_CLASS =
  'anvl-screen-section relative w-full overflow-visible border-b border-[var(--color-line)]'

export function actSectionClassName(size: ActSectionSize = 'default', extra?: string): string {
  return cn(ACT_SECTION_CLASS, ACT_SECTION_SIZE_CLASS[size], extra)
}

/** Inner column — vertical padding only; no height clamp. */
export const ACT_CONTENT_CLASS =
  'anvl-act-content relative z-10 px-4 py-5 sm:py-7 md:px-8 md:py-8'

export const ACT_CONTENT_INNER_CLASS = 'anvl-act-content-inner'
import { readActStr } from '@/features/cms/landing/landingActPreviewOverlay'
import {
  hasActLayerMedia,
} from './actLayerMedia'

export type TenetLike = { label?: string; body?: string; text?: string; id?: string }

export function formatTenetLine(tenet: TenetLike): string {
  if (typeof tenet.text === 'string' && tenet.text.trim()) return tenet.text.trim()
  const label = typeof tenet.label === 'string' ? tenet.label.trim() : ''
  const body = typeof tenet.body === 'string' ? tenet.body.trim() : ''
  if (label && body) return `${label} — ${body}`
  return label || body
}

export function resolveActRowImage(row?: LandingAct, contentKey?: string): string | undefined {
  const fromMedia = row?.media?.imageUrl?.trim()
  if (fromMedia) return fromMedia
  if (contentKey && row?.content) {
    const fromContent = readActStr(row.content as Record<string, unknown>, contentKey)
    if (fromContent) return fromContent
  }
  return undefined
}

export function resolveActRowVideo(row?: LandingAct): string | undefined {
  return row?.media?.videoUrl?.trim() || undefined
}

/** True when the act row has dedicated background image or video media. */
export function hasActRowMedia(row?: LandingAct): boolean {
  return hasActLayerMedia(row, 'background')
}

export function resolveActRowMediaAlt(row?: LandingAct): string | undefined {
  return row?.media?.alt?.trim() || undefined
}

export { hasActForegroundMedia, hasActLayerMedia, resolveActLayerMedia } from './actLayerMedia'

export type CountdownParts = { days: number; hours: number; minutes: number; seconds: number }

export function getCountdownParts(targetIso: string): CountdownParts | null {
  const target = new Date(targetIso).getTime()
  if (!Number.isFinite(target)) return null
  const diff = Math.max(0, target - Date.now())
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

export function formatEventDate(iso: string): string {
  if (!iso.trim()) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
