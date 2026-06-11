import {
  formatChapterNumber,
  type StoryChapter,
} from '@/features/story/schemas/story.schema'

/**
 * Small chapter helpers shared by the book spread model and the page views.
 * (Spread assembly itself lives in `bookSpreads.ts`.)
 */

/** Cast attached to the chapter as a whole (not a specific act). */
export function chapterCastMembers(chapter: StoryChapter) {
  return chapter.cast.filter((m) => m.actId === null)
}

export function chapterDropLabel(chapter: StoryChapter): string {
  return chapter.subtitle || `Chapter ${formatChapterNumber(chapter.chapterNumber)}`
}
