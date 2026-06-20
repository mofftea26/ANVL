import type { StoryAsset, StoryChapter } from '@/features/story/schemas/story.schema'
import { formatChapterNumber } from '@/features/story/schemas/story.schema'
import { resolveStoryAsset } from '@/features/story/lib/resolveStoryAsset'
import {
  chapterCastMembers,
  chapterDropLabel,
} from '@/features/story/lib/chapterPages'

/**
 * The book is read as *spreads* — two facing pages revealed together by one
 * leaf turn. The left page is always visual (the act's asset, or an
 * illuminated emblem plate); the right page carries the act's text. Long acts
 * flow onto further spreads automatically, like a real book.
 */

/** What the left (verso) page shows. */
export type SpreadLeft =
  | { type: 'media'; asset: StoryAsset }
  | { type: 'emblem' }

export type BookSpread =
  | { kind: 'cover'; key: string }
  | {
      kind: 'spread'
      key: string
      chapterTitle: string
      dropLabel: string
      actTitle: string
      actNumber: number
      left: SpreadLeft
      /** Right-page paragraphs (empty for the roster spread). */
      paras: string[]
      /** 1-based part for acts that span multiple spreads. */
      part: number
      partCount: number
      roster: boolean
    }

/** Conservative line budget so right-page text never overflows. */
export interface PageMetrics {
  charsPerLine: number
  /** Full text budget of a continuation page. */
  linesPerPage: number
  /** Lines the act title block consumes on a part-1 page. */
  titleLines: number
}

/** Tuned for the right page at ~15.5px book type (slightly under-fills, so the
    larger body never overflows the fixed page — text flows to more pages). */
export const DEFAULT_PAGE_METRICS: PageMetrics = {
  charsPerLine: 42,
  linesPerPage: 17,
  titleLines: 5,
}

function paragraphs(story: string): string[] {
  return story
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

function paraLines(text: string, m: PageMetrics): number {
  return Math.ceil(text.length / m.charsPerLine) + 1
}

/** Split a paragraph that exceeds a whole page into sentence-bounded chunks. */
function splitLongParagraph(text: string, maxLines: number, m: PageMetrics): string[] {
  const maxChars = Math.max(1, (maxLines - 1) * m.charsPerLine)
  if (text.length <= maxChars) return [text]
  const sentences = text.split(/(?<=[.!?…])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const s of sentences) {
    if (current && (current.length + s.length + 1) > maxChars) {
      chunks.push(current)
      current = s
    } else {
      current = current ? `${current} ${s}` : s
    }
  }
  if (current) chunks.push(current)
  return chunks
}

/** Greedily flow an act's paragraphs into right pages that fit the budget. */
function paginateAct(
  act: StoryChapter['acts'][number],
  chapter: StoryChapter,
  m: PageMetrics,
): BookSpread[] {
  const budget = (page: number) => m.linesPerPage - (page === 0 ? m.titleLines : 1)
  const blocks = paragraphs(act.story).flatMap((p) =>
    splitLongParagraph(p, budget(1), m),
  )

  const pages: string[][] = []
  let current: string[] = []
  let lines = 0
  for (const text of blocks) {
    const cost = paraLines(text, m)
    if (current.length > 0 && lines + cost > budget(pages.length)) {
      pages.push(current)
      current = []
      lines = 0
    }
    current.push(text)
    lines += cost
  }
  if (current.length > 0 || pages.length === 0) pages.push(current)

  const hasAsset = resolveStoryAsset(act.asset).type !== 'none'
  return pages.map((paras, i) => ({
    kind: 'spread',
    key: `${act.id}-${i}`,
    chapterTitle: chapter.title,
    dropLabel: chapterDropLabel(chapter),
    actTitle: act.title,
    actNumber: act.actNumber,
    left: i === 0 && hasAsset ? { type: 'media', asset: act.asset } : { type: 'emblem' },
    paras,
    part: i + 1,
    partCount: pages.length,
    roster: false,
  }))
}

export function buildBookSpreads(
  chapter: StoryChapter,
  metrics: PageMetrics = DEFAULT_PAGE_METRICS,
): BookSpread[] {
  const spreads: BookSpread[] = [{ kind: 'cover', key: 'cover' }]
  for (const act of chapter.acts) {
    spreads.push(...paginateAct(act, chapter, metrics))
  }
  if (chapterCastMembers(chapter).length > 0) {
    spreads.push({
      kind: 'spread',
      key: 'roster',
      chapterTitle: chapter.title,
      dropLabel: chapterDropLabel(chapter),
      actTitle: 'The Army',
      actNumber: chapter.acts.length + 1,
      left: { type: 'emblem' },
      paras: [],
      part: 1,
      partCount: 1,
      roster: true,
    })
  }
  return spreads
}

/** Facing page numbers — cover is unnumbered; spread i shows pages 2i-1 / 2i. */
export function spreadPageNumbers(
  spreads: BookSpread[],
  index: number,
): { left: number; right: number; total: number } {
  const count = spreads.filter((s) => s.kind === 'spread').length
  let nth = 0
  for (let i = 1; i <= index && i < spreads.length; i++) {
    if (spreads[i].kind === 'spread') nth++
  }
  return { left: nth * 2 - 1, right: nth * 2, total: count * 2 }
}

export function spreadLabel(spread: BookSpread | undefined): string {
  if (!spread || spread.kind === 'cover') return 'Cover'
  if (spread.roster) return 'The Army'
  const part = spread.partCount > 1 ? ` (${spread.part}/${spread.partCount})` : ''
  return `Act ${formatChapterNumber(spread.actNumber)} — ${spread.actTitle}${part}`
}
