import { describe, expect, it } from 'vitest'
import {
  EMPTY_STORY_ASSET,
  formatChapterNumber,
  parseStoryAsset,
  storyChapterSchema,
} from '@/features/story/schemas/story.schema'

describe('story.schema', () => {
  it('parses an empty jsonb asset into a "none" asset', () => {
    expect(parseStoryAsset({})).toEqual(EMPTY_STORY_ASSET)
    expect(parseStoryAsset(null)).toEqual(EMPTY_STORY_ASSET)
    expect(parseStoryAsset('garbage')).toEqual(EMPTY_STORY_ASSET)
  })

  it('keeps a valid asset and fills missing fields with defaults', () => {
    const asset = parseStoryAsset({
      kind: 'image',
      storagePath: 'the-oath/cover.jpg',
      alt: 'cover',
    })
    expect(asset.kind).toBe('image')
    expect(asset.storagePath).toBe('the-oath/cover.jpg')
    expect(asset.url).toBeNull()
    expect(asset.poster).toBeNull()
  })

  it('applies chapter defaults for a minimal record', () => {
    const chapter = storyChapterSchema.parse({
      id: 'c1',
      slug: 'the-oath',
      title: 'The Oath',
    })
    expect(chapter.acts).toEqual([])
    expect(chapter.cast).toEqual([])
    expect(chapter.cover).toEqual(EMPTY_STORY_ASSET)
    expect(chapter.isPublished).toBe(true)
    expect(chapter.chapterNumber).toBe(1)
  })

  it('formats chapter numbers as two digits', () => {
    expect(formatChapterNumber(1)).toBe('01')
    expect(formatChapterNumber(12)).toBe('12')
    expect(formatChapterNumber(0)).toBe('00')
  })
})
