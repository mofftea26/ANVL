import {
  DEFAULT_BOOK_COLORS,
  EMPTY_STORY_ASSET,
  type StoryChapter,
} from '@/features/story/schemas/story.schema'

/**
 * Fallback saga used when Supabase is not configured (no `VITE_SUPABASE_*`).
 * Mirrors the seeded "Chapter 01 — The Oath" so the page is never empty in
 * local/offline development. With Supabase env present, the live tables win.
 */
export const seedStory: StoryChapter[] = [
  {
    id: 'seed-chapter-the-oath',
    slug: 'the-oath',
    chapterNumber: 1,
    title: 'The Oath',
    subtitle: 'Drop 01',
    description:
      'The first vow of the kingdom. A body forged through pressure, repetition, discipline, and heat — discipline repeated until it becomes identity. Every soldier who enlists is written into what comes next.',
    cover: EMPTY_STORY_ASSET,
    coverLogo: EMPTY_STORY_ASSET,
    colors: DEFAULT_BOOK_COLORS,
    isPublished: true,
    acts: [
      {
        id: 'seed-act-pressure',
        actNumber: 1,
        title: 'Pressure',
        story:
          'It starts under load. The bar bends, the lungs burn, the mind asks to stop. Pressure is not the enemy — it is the instrument. Nothing forged was ever shaped in comfort.',
        asset: EMPTY_STORY_ASSET,
      },
      {
        id: 'seed-act-repetition',
        actNumber: 2,
        title: 'Repetition',
        story:
          'One rep proves nothing. Ten thousand prove everything. The Oath is the same strike, repeated past the point of motivation, until the movement is no longer a choice — it is who you are.',
        asset: EMPTY_STORY_ASSET,
      },
      {
        id: 'seed-act-discipline',
        actNumber: 3,
        title: 'Discipline',
        story:
          'Discipline is chaos aligned. The early alarm, the logged set, the meal you did not want. Each one a small order imposed on a loud world. Freedom is what that order buys you.',
        asset: EMPTY_STORY_ASSET,
      },
      {
        id: 'seed-act-heat',
        actNumber: 4,
        title: 'Heat',
        story:
          'Steel is only honest at temperature. So are we. Heat is the session that breaks the version of you that was comfortable, and tempers the one that remains.',
        asset: EMPTY_STORY_ASSET,
      },
    ],
    cast: [],
  },
]
