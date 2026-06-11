import { describe, expect, it } from 'vitest'
import {
  assembleChapter,
  type StoryActRow,
  type StoryCastRow,
  type StoryChapterRow,
} from '@/features/story/api/storyRow.mapper'

const chapter: StoryChapterRow = {
  id: 'ch1',
  slug: 'the-oath',
  chapter_number: 1,
  title: 'The Oath',
  subtitle: 'Drop 01',
  description: 'desc',
  cover_asset: { kind: 'none' },
  sort_order: 1,
  is_published: true,
}

describe('assembleChapter', () => {
  it('attaches only matching acts/cast, ordered by sort_order', () => {
    const acts: StoryActRow[] = [
      { id: 'a2', chapter_id: 'ch1', act_number: 2, title: 'Second', story: '', asset: {}, sort_order: 2 },
      { id: 'a1', chapter_id: 'ch1', act_number: 1, title: 'First', story: '', asset: {}, sort_order: 1 },
      { id: 'aX', chapter_id: 'other', act_number: 1, title: 'Other', story: '', asset: {}, sort_order: 1 },
    ]
    const cast: StoryCastRow[] = [
      { id: 'c1', chapter_id: 'ch1', act_id: null, name: 'General Khoury', rank: 'General', blurb: '', avatar_asset: {}, sort_order: 0 },
      { id: 'cX', chapter_id: 'other', act_id: null, name: 'Nope', rank: 'Recruit', blurb: '', avatar_asset: {}, sort_order: 0 },
    ]

    const assembled = assembleChapter(chapter, acts, cast)
    expect(assembled.acts.map((a) => a.id)).toEqual(['a1', 'a2'])
    expect(assembled.cast).toHaveLength(1)
    expect(assembled.cast[0]?.name).toBe('General Khoury')
    expect(assembled.cast[0]?.rank).toBe('General')
  })

  it('tolerates empty children', () => {
    const assembled = assembleChapter(chapter, [], [])
    expect(assembled.acts).toEqual([])
    expect(assembled.cast).toEqual([])
    expect(assembled.title).toBe('The Oath')
  })
})
