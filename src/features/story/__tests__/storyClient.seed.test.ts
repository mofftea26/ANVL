import { describe, expect, it } from 'vitest'
import { seedStoryClient } from '@/features/story/api/storyClient.seed'

describe('seedStoryClient', () => {
  it('returns the published seed chapters', async () => {
    const chapters = await seedStoryClient.getPublishedChapters()
    expect(chapters.length).toBeGreaterThan(0)
    expect(chapters[0]?.slug).toBe('the-oath')
    expect(chapters[0]?.acts.length).toBe(4)
  })

  it('finds a chapter by slug and returns null for unknown slugs', async () => {
    expect(await seedStoryClient.getChapterBySlug('the-oath')).not.toBeNull()
    expect(await seedStoryClient.getChapterBySlug('missing')).toBeNull()
  })
})
