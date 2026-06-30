import type { StoryClient } from '@/app/config/clients'
import { seedStory } from '@/features/story/data/seedStory'

/** No-Supabase fallback: serves the bundled seed saga. */
export const seedStoryClient: StoryClient = {
  async getPublishedChapters() {
    return seedStory.filter((c) => c.isPublished)
  },
  async getChapterBySlug(slug) {
    return seedStory.find((c) => c.slug === slug && c.isPublished) ?? null
  },
  async getChapterByProductSlug(productSlug) {
    return (
      seedStory.find((c) => c.productSlug === productSlug && c.isPublished) ?? null
    )
  },
}
