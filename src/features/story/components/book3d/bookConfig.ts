import {
  DEFAULT_BOOK_COLORS,
  formatChapterNumber,
  type BookColors,
  type StoryChapter,
} from '@/features/story/schemas/story.schema'
import { resolveStoryAsset } from '@/features/story/lib/resolveStoryAsset'

/** Everything the reusable 3D book needs to render its cover, derived once. */
export interface BookCover {
  title: string
  dropLabel: string
  /** Drop logo stamped on the cover (falls back to cover art, then the crest). */
  logoSrc: string | null
  colors: BookColors
}

export function resolveBookCover(chapter: StoryChapter): BookCover {
  const logo = resolveStoryAsset(chapter.coverLogo)
  const art = resolveStoryAsset(chapter.cover)
  const logoSrc =
    logo.type === 'image' ? logo.src : art.type === 'image' ? art.src : null
  return {
    title: chapter.title,
    dropLabel:
      chapter.subtitle || `Chapter ${formatChapterNumber(chapter.chapterNumber)}`,
    logoSrc,
    colors: chapter.colors ?? DEFAULT_BOOK_COLORS,
  }
}
