import {
  formatChapterNumber,
  type StoryChapter,
} from '@/features/story/schemas/story.schema'

/**
 * Small chapter helpers shared by the book spread model and the page views.
 * (Spread assembly itself lives in `bookSpreads.ts`.)
 */

/**
 * The chapter's cast. Every enlisted member appears in the whole chapter — the
 * old per-act "appears in" scoping was removed, so this is the full roster.
 */
export function chapterCastMembers(chapter: StoryChapter) {
  return chapter.cast
}

export function chapterDropLabel(chapter: StoryChapter): string {
  return chapter.subtitle || `Chapter ${formatChapterNumber(chapter.chapterNumber)}`
}
