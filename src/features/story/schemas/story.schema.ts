import { z } from 'zod'

/**
 * Canonical Story saga schemas — single source of truth shared by the
 * storefront reader (`src/features/story`) and the admin editor
 * (`src/features/admin/story`). Domain shapes are camelCase; the Supabase
 * adapter maps snake_case rows into these.
 */

export const STORY_RANKS = ['General', 'Captain', 'Veteran', 'Recruit'] as const
export type StoryRank = (typeof STORY_RANKS)[number]

export const storyAssetKindSchema = z.enum(['image', 'video', 'embed', 'none'])
export type StoryAssetKind = z.infer<typeof storyAssetKindSchema>

/**
 * Asset payload stored as jsonb on chapters/acts/cast.
 * - `image` / `video` → uploaded to the `story-media` bucket (`storagePath`).
 * - `embed` → external player URL (Mux / YouTube / Vimeo) in `url`.
 */
export const storyAssetSchema = z.object({
  kind: storyAssetKindSchema.default('none'),
  mediaId: z.string().nullable().default(null),
  storagePath: z.string().nullable().default(null),
  url: z.string().nullable().default(null),
  alt: z.string().default(''),
  width: z.number().nullable().default(null),
  height: z.number().nullable().default(null),
  poster: z.string().nullable().default(null),
})
export type StoryAsset = z.infer<typeof storyAssetSchema>

export const EMPTY_STORY_ASSET: StoryAsset = {
  kind: 'none',
  mediaId: null,
  storagePath: null,
  url: null,
  alt: '',
  width: null,
  height: null,
  poster: null,
}

/** Tolerant parse for jsonb columns that may be `{}` or malformed. */
export function parseStoryAsset(raw: unknown): StoryAsset {
  const result = storyAssetSchema.safeParse(raw ?? {})
  return result.success ? result.data : EMPTY_STORY_ASSET
}

export const storyCastMemberSchema = z.object({
  id: z.string(),
  actId: z.string().nullable().default(null),
  name: z.string(),
  rank: z.string().default('Recruit'),
  blurb: z.string().default(''),
  avatar: storyAssetSchema.default(EMPTY_STORY_ASSET),
  sortOrder: z.number().default(0),
})
export type StoryCastMember = z.infer<typeof storyCastMemberSchema>

/**
 * Per-book colour theme — drives the 3D book's cloth cover, foil stamping, and
 * gilded page edges. Defaults match the house "forged" book so existing
 * chapters render unchanged.
 */
export const bookColorsSchema = z
  .object({
    cover: z.string().default('#26211d'),
    foil: z.string().default('#c8a45a'),
    pageEdge: z.string().default('#efe4c6'),
    /** Open-page heading colour. */
    heading: z.string().default('#221b10'),
    /** Open-page body-text colour. */
    text: z.string().default('#4c4030'),
  })
  .default({
    cover: '#26211d',
    foil: '#c8a45a',
    pageEdge: '#efe4c6',
    heading: '#221b10',
    text: '#4c4030',
  })
export type BookColors = z.infer<typeof bookColorsSchema>

export const DEFAULT_BOOK_COLORS: BookColors = {
  cover: '#26211d',
  foil: '#c8a45a',
  pageEdge: '#efe4c6',
  heading: '#221b10',
  text: '#4c4030',
}

export const storyActSchema = z.object({
  id: z.string(),
  actNumber: z.number().default(1),
  title: z.string(),
  story: z.string().default(''),
  asset: storyAssetSchema.default(EMPTY_STORY_ASSET),
})
export type StoryAct = z.infer<typeof storyActSchema>

export const storyChapterSchema = z.object({
  id: z.string(),
  slug: z.string(),
  chapterNumber: z.number().default(1),
  title: z.string(),
  subtitle: z.string().default(''),
  description: z.string().default(''),
  /** Product this book belongs to (= Shopify handle). Empty = standalone chapter. */
  productSlug: z.string().default(''),
  /** Drop grouping label/slug for the shelf (e.g. "Drop 01 — The Oath"). */
  dropLabel: z.string().default(''),
  dropSlug: z.string().default(''),
  cover: storyAssetSchema.default(EMPTY_STORY_ASSET),
  /** Drop logo stamped on the book cover (image upload). */
  coverLogo: storyAssetSchema.default(EMPTY_STORY_ASSET),
  /** Book cloth / foil / page-edge colours. */
  colors: bookColorsSchema,
  isPublished: z.boolean().default(true),
  acts: z.array(storyActSchema).default([]),
  cast: z.array(storyCastMemberSchema).default([]),
})
export type StoryChapter = z.infer<typeof storyChapterSchema>

/** Two-digit display label for a chapter number ("01", "02", ...). */
export function formatChapterNumber(n: number): string {
  return String(Math.max(0, Math.trunc(n))).padStart(2, '0')
}
