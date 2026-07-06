import type { FuseResultMatch } from 'fuse.js'

/**
 * One searchable unit. `url` is fully resolved at corpus-assembly time (route
 * path + hash/search params where relevant) so the matching engine and UI
 * never need type-specific routing knowledge — only `navigateToResult`
 * (storefront-specific) interprets `url`/`meta` to actually navigate.
 */
export type SearchDocumentType =
  | 'product'
  | 'story-chapter'
  | 'story-act'
  | 'story-cast'
  | 'about-orb'
  | 'pdp-tile'
  | 'static-page'

export interface SearchDocument {
  id: string
  type: SearchDocumentType
  title: string
  subtitle?: string
  body: string
  /** Human-readable target — shown in result rows, not used for routing. */
  url: string
  /**
   * Structured routing data — `navigateToResult` reads this per `type` to
   * build a type-safe `navigate()` call instead of parsing `url`.
   */
  meta: SearchDocumentMeta
}

export type SearchDocumentMeta = {
  /** Product slug (`product`, `pdp-tile`). */
  slug?: string
  /** Story chapter slug (`story-chapter`, `story-act`, `story-cast`). */
  chapterSlug?: string
  /** Story act id (`story-act`). */
  actId?: string
  /** Element id to scroll/highlight to on arrival (`about-orb`, `pdp-tile`). */
  hash?: string
  /** Static route path (`static-page`). */
  path?: string
}

export interface SearchResult {
  document: SearchDocument
  score: number
  matches: readonly FuseResultMatch[]
}

export type GroupedResults = Partial<Record<SearchDocumentType, SearchResult[]>>

export const SEARCH_DOCUMENT_TYPE_LABELS: Record<SearchDocumentType, string> = {
  product: 'Products',
  'story-chapter': 'The Saga',
  'story-act': 'The Saga',
  'story-cast': 'The Saga',
  'about-orb': 'About',
  'pdp-tile': 'Products',
  'static-page': 'Pages',
}

/** Display order for grouped result categories. */
export const SEARCH_CATEGORY_ORDER: SearchDocumentType[] = [
  'product',
  'pdp-tile',
  'story-chapter',
  'story-act',
  'story-cast',
  'about-orb',
  'static-page',
]
