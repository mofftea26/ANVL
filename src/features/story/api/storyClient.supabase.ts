import type { StoryClient } from '@/app/config/clients'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import type { SupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { getSupabasePublicationAnonClient } from '@/features/cms/api/publicStorefrontPublication'
import {
  assembleChapter,
  type StoryActRow,
  type StoryCastRow,
  type StoryChapterRow,
} from '@/features/story/api/storyRow.mapper'

const CHAPTER_SELECT =
  'id, slug, chapter_number, title, subtitle, description, product_slug, drop_label, drop_slug, cover_asset, cover_logo, cover_colors, sort_order, is_published'
const ACT_SELECT =
  'id, chapter_id, act_number, title, story, asset, sort_order'
const CAST_SELECT =
  'id, chapter_id, act_id, name, rank, blurb, avatar_asset, sort_order'

/**
 * Storefront Story reader backed by Supabase. Relies on RLS to expose only
 * published chapters (and their acts/cast) to the anon role.
 */
export function createSupabaseStoryReadSlice(env: SupabasePublicEnv): StoryClient {
  async function fetchChildren(chapterIds: string[]): Promise<{
    acts: StoryActRow[]
    cast: StoryCastRow[]
  }> {
    if (chapterIds.length === 0) return { acts: [], cast: [] }
    const supabase = getSupabasePublicationAnonClient(env)
    const [actsRes, castRes] = await Promise.all([
      supabase.from('story_acts').select(ACT_SELECT).in('chapter_id', chapterIds),
      supabase.from('story_cast').select(CAST_SELECT).in('chapter_id', chapterIds),
    ])
    if (actsRes.error) throw actsRes.error
    if (castRes.error) throw castRes.error
    return {
      acts: (actsRes.data ?? []) as StoryActRow[],
      cast: (castRes.data ?? []) as StoryCastRow[],
    }
  }

  return {
    async getPublishedChapters(): Promise<StoryChapter[]> {
      const supabase = getSupabasePublicationAnonClient(env)
      const { data, error } = await supabase
        .from('story_chapters')
        .select(CHAPTER_SELECT)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
      if (error) throw error
      const chapters = (data ?? []) as StoryChapterRow[]
      const { acts, cast } = await fetchChildren(chapters.map((c) => c.id))
      return chapters.map((c) => assembleChapter(c, acts, cast))
    },

    async getChapterBySlug(slug: string): Promise<StoryChapter | null> {
      const supabase = getSupabasePublicationAnonClient(env)
      const { data, error } = await supabase
        .from('story_chapters')
        .select(CHAPTER_SELECT)
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      const chapter = data as StoryChapterRow
      const { acts, cast } = await fetchChildren([chapter.id])
      return assembleChapter(chapter, acts, cast)
    },

    async getChapterByProductSlug(productSlug: string): Promise<StoryChapter | null> {
      const supabase = getSupabasePublicationAnonClient(env)
      const { data, error } = await supabase
        .from('story_chapters')
        .select(CHAPTER_SELECT)
        .eq('product_slug', productSlug)
        .eq('is_published', true)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      const chapter = data as StoryChapterRow
      const { acts, cast } = await fetchChildren([chapter.id])
      return assembleChapter(chapter, acts, cast)
    },
  }
}
