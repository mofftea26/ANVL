import { describe, expect, it, vi } from 'vitest'
import { storyChapterSchema } from '@/features/story/schemas/story.schema'

/**
 * Many chapters may share a product_slug (the one-per-product unique index was
 * dropped in migration 20260720100000). The StoryClient contract is
 * ordered-first: the first book in shelf order represents the product on the
 * PDP / passport embeds. The seed client's ordering IS the array order.
 */
vi.mock('@/features/story/data/seedStory', () => {
  const chapter = (overrides: Record<string, unknown>) =>
    storyChapterSchema.parse({
      id: String(overrides.slug),
      title: String(overrides.slug),
      ...overrides,
    })
  return {
    seedStory: [
      chapter({ slug: 'oath-vol-1', productSlug: 'oath-tee', isPublished: true }),
      chapter({ slug: 'oath-vol-2', productSlug: 'oath-tee', isPublished: true }),
      chapter({ slug: 'oath-draft', productSlug: 'oath-tee', isPublished: false }),
      chapter({ slug: 'other-book', productSlug: 'other-tee', isPublished: true }),
    ],
  }
})

describe('seedStoryClient.getChapterByProductSlug (many books per product)', () => {
  it('returns the FIRST published book in shelf order when several share a product', async () => {
    const { seedStoryClient } = await import('@/features/story/api/storyClient.seed')
    const chapter = await seedStoryClient.getChapterByProductSlug('oath-tee')
    expect(chapter?.slug).toBe('oath-vol-1')
  })

  it('never surfaces an unpublished sibling', async () => {
    const { seedStoryClient } = await import('@/features/story/api/storyClient.seed')
    const chapters = await seedStoryClient.getPublishedChapters()
    // Both published oath-tee books coexist on the shelf — duplicates allowed.
    expect(chapters.filter((c) => c.productSlug === 'oath-tee')).toHaveLength(2)
    expect(chapters.some((c) => c.slug === 'oath-draft')).toBe(false)
  })

  it('still returns null for a product with no book', async () => {
    const { seedStoryClient } = await import('@/features/story/api/storyClient.seed')
    expect(await seedStoryClient.getChapterByProductSlug('missing')).toBeNull()
  })
})
