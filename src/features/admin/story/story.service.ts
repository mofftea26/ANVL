import type { SupabaseClient } from '@supabase/supabase-js'
import { getAdminSupabaseBrowserClient } from '@/features/admin/auth/adminSupabaseBrowserClient'
import {
  bookColorsSchema,
  storyAssetSchema,
  type BookColors,
  type StoryAsset,
  type StoryChapter,
} from '@/features/story/schemas/story.schema'
import {
  assembleChapter,
  type StoryActRow,
  type StoryCastRow,
  type StoryChapterRow,
} from '@/features/story/api/storyRow.mapper'

export type StoryResult<T> = { ok: true; data: T } | { ok: false; error: string }

const CHAPTER_SELECT =
  'id, slug, chapter_number, title, subtitle, description, product_slug, drop_label, drop_slug, cover_asset, cover_logo, cover_colors, sort_order, is_published'
const ACT_SELECT = 'id, chapter_id, act_number, title, story, asset, sort_order'
const CAST_SELECT =
  'id, chapter_id, act_id, name, rank, blurb, avatar_asset, sort_order, profile_user_id, armory_handle'

function client(): StoryResult<SupabaseClient> {
  const c = getAdminSupabaseBrowserClient()
  if (!c) return { ok: false, error: 'Sign in to manage the story.' }
  return { ok: true, data: c }
}

function asset(raw: StoryAsset): StoryAsset {
  // Re-validate at the write boundary (defence-in-depth, SEC alignment).
  return storyAssetSchema.parse(raw)
}

export type ChapterDraft = {
  id?: string
  slug: string
  chapterNumber: number
  title: string
  subtitle: string
  description: string
  productSlug: string
  dropLabel: string
  dropSlug: string
  cover: StoryAsset
  coverLogo: StoryAsset
  colors: BookColors
  sortOrder: number
  isPublished: boolean
}

/**
 * Maps raw Postgres unique-violation noise on chapter writes to actionable
 * copy. Multiple chapters may share a product_slug (the one-per-product index
 * was dropped in migration 20260720100000) — only the chapter slug stays unique.
 */
function friendlyChapterWriteError(message: string): string {
  if (message.includes('story_chapters_product_slug_key')) {
    return (
      'The database still enforces one book per product — apply migration ' +
      '20260720100000_story_chapters_many_per_product.sql to allow multiple chapters per product.'
    )
  }
  if (
    message.includes('story_chapters_slug_key') ||
    message.toLowerCase().includes('duplicate key')
  ) {
    return 'A chapter with this slug already exists — pick a unique slug (several chapters may share a product).'
  }
  return message
}

export type ActDraft = {
  id?: string
  chapterId: string
  actNumber: number
  title: string
  story: string
  asset: StoryAsset
  sortOrder: number
}

export type CastDraft = {
  id?: string
  chapterId: string
  name: string
  rank: string
  avatar: StoryAsset
  sortOrder: number
  /** Linked athlete snapshot (null for lore characters). */
  profileUserId?: string | null
  armoryHandle?: string | null
  /**
   * Legacy fields — accepted for back-compat with existing callers but no
   * longer authored. `blurb` defaults to '' and `act_id` to null on write.
   */
  actId?: string | null
  blurb?: string
}

/** Load the full saga (including unpublished) for the admin editor. */
export async function listSaga(): Promise<StoryResult<StoryChapter[]>> {
  const c = client()
  if (!c.ok) return c
  const supabase = c.data

  const chaptersRes = await supabase
    .from('story_chapters')
    .select(CHAPTER_SELECT)
    .order('sort_order', { ascending: true })
  if (chaptersRes.error) return { ok: false, error: chaptersRes.error.message }

  const chapters = (chaptersRes.data ?? []) as StoryChapterRow[]
  if (chapters.length === 0) return { ok: true, data: [] }

  const ids = chapters.map((ch) => ch.id)
  const [actsRes, castRes] = await Promise.all([
    supabase.from('story_acts').select(ACT_SELECT).in('chapter_id', ids),
    supabase.from('story_cast').select(CAST_SELECT).in('chapter_id', ids),
  ])
  if (actsRes.error) return { ok: false, error: actsRes.error.message }
  if (castRes.error) return { ok: false, error: castRes.error.message }

  const acts = (actsRes.data ?? []) as StoryActRow[]
  const cast = (castRes.data ?? []) as StoryCastRow[]
  return { ok: true, data: chapters.map((ch) => assembleChapter(ch, acts, cast)) }
}

export async function upsertChapter(
  draft: ChapterDraft,
): Promise<StoryResult<string>> {
  const c = client()
  if (!c.ok) return c
  const row = {
    slug: draft.slug.trim(),
    chapter_number: draft.chapterNumber,
    title: draft.title.trim(),
    subtitle: draft.subtitle.trim(),
    description: draft.description.trim(),
    product_slug: draft.productSlug.trim() || null,
    drop_label: draft.dropLabel.trim(),
    drop_slug: draft.dropSlug.trim(),
    cover_asset: asset(draft.cover),
    cover_logo: asset(draft.coverLogo),
    cover_colors: bookColorsSchema.parse(draft.colors),
    sort_order: draft.sortOrder,
    is_published: draft.isPublished,
  }
  if (!row.slug || !row.title) {
    return { ok: false, error: 'Chapter needs a slug and a title.' }
  }

  const query = draft.id
    ? c.data.from('story_chapters').update(row).eq('id', draft.id).select('id').single()
    : c.data.from('story_chapters').insert(row).select('id').single()
  const { data, error } = await query
  if (error) return { ok: false, error: friendlyChapterWriteError(error.message) }
  return { ok: true, data: (data as { id: string }).id }
}

export async function deleteChapter(id: string): Promise<StoryResult<true>> {
  const c = client()
  if (!c.ok) return c
  const { error } = await c.data.from('story_chapters').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: true }
}

export async function upsertAct(draft: ActDraft): Promise<StoryResult<string>> {
  const c = client()
  if (!c.ok) return c
  const row = {
    chapter_id: draft.chapterId,
    act_number: draft.actNumber,
    title: draft.title.trim(),
    story: draft.story,
    asset: asset(draft.asset),
    sort_order: draft.sortOrder,
  }
  if (!row.title) return { ok: false, error: 'Act needs a title.' }

  const query = draft.id
    ? c.data.from('story_acts').update(row).eq('id', draft.id).select('id').single()
    : c.data.from('story_acts').insert(row).select('id').single()
  const { data, error } = await query
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: (data as { id: string }).id }
}

export async function deleteAct(id: string): Promise<StoryResult<true>> {
  const c = client()
  if (!c.ok) return c
  const { error } = await c.data.from('story_acts').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: true }
}

export async function upsertCast(draft: CastDraft): Promise<StoryResult<string>> {
  const c = client()
  if (!c.ok) return c
  const row = {
    chapter_id: draft.chapterId,
    act_id: draft.actId ?? null,
    name: draft.name.trim(),
    rank: draft.rank.trim() || 'Recruit',
    blurb: (draft.blurb ?? '').trim(),
    avatar_asset: asset(draft.avatar),
    sort_order: draft.sortOrder,
    profile_user_id: draft.profileUserId ?? null,
    armory_handle: draft.armoryHandle?.trim() || null,
  }
  if (!row.name) return { ok: false, error: 'Character needs a name.' }

  const query = draft.id
    ? c.data.from('story_cast').update(row).eq('id', draft.id).select('id').single()
    : c.data.from('story_cast').insert(row).select('id').single()
  const { data, error } = await query
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: (data as { id: string }).id }
}

export async function deleteCast(id: string): Promise<StoryResult<true>> {
  const c = client()
  if (!c.ok) return c
  const { error } = await c.data.from('story_cast').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  return { ok: true, data: true }
}
