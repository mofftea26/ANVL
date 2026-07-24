import {
  parseStoryAsset,
  storyActSchema,
  storyCastMemberSchema,
  storyChapterSchema,
  type StoryAct,
  type StoryCastMember,
  type StoryChapter,
} from '@/features/story/schemas/story.schema'

export type StoryChapterRow = {
  id: string
  slug: string
  chapter_number: number | null
  title: string
  subtitle: string | null
  description: string | null
  cover_asset: unknown
  cover_logo?: unknown
  cover_colors?: unknown
  product_slug?: string | null
  drop_label?: string | null
  drop_slug?: string | null
  sort_order: number | null
  is_published: boolean | null
}

export type StoryActRow = {
  id: string
  chapter_id: string
  act_number: number | null
  title: string
  story: string | null
  asset: unknown
  sort_order: number | null
}

export type StoryCastRow = {
  id: string
  chapter_id: string
  act_id: string | null
  name: string
  rank: string | null
  blurb: string | null
  avatar_asset: unknown
  sort_order: number | null
  profile_user_id?: string | null
  armory_handle?: string | null
}

export function mapActRow(row: StoryActRow): StoryAct {
  return storyActSchema.parse({
    id: row.id,
    actNumber: row.act_number ?? 1,
    title: row.title,
    story: row.story ?? '',
    asset: parseStoryAsset(row.asset),
  })
}

export function mapCastRow(row: StoryCastRow): StoryCastMember {
  return storyCastMemberSchema.parse({
    id: row.id,
    actId: row.act_id,
    name: row.name,
    rank: row.rank ?? 'Recruit',
    blurb: row.blurb ?? '',
    avatar: parseStoryAsset(row.avatar_asset),
    sortOrder: row.sort_order ?? 0,
    profileUserId: row.profile_user_id ?? null,
    armoryHandle: row.armory_handle ?? null,
  })
}

/** Assemble a full chapter from its row plus already-fetched act/cast rows. */
export function assembleChapter(
  chapter: StoryChapterRow,
  actRows: StoryActRow[],
  castRows: StoryCastRow[],
): StoryChapter {
  const acts = actRows
    .filter((a) => a.chapter_id === chapter.id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(mapActRow)

  const cast = castRows
    .filter((c) => c.chapter_id === chapter.id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(mapCastRow)

  return storyChapterSchema.parse({
    id: chapter.id,
    slug: chapter.slug,
    chapterNumber: chapter.chapter_number ?? 1,
    title: chapter.title,
    subtitle: chapter.subtitle ?? '',
    description: chapter.description ?? '',
    productSlug: chapter.product_slug ?? '',
    dropLabel: chapter.drop_label ?? '',
    dropSlug: chapter.drop_slug ?? '',
    cover: parseStoryAsset(chapter.cover_asset),
    coverLogo: parseStoryAsset(chapter.cover_logo),
    colors: chapter.cover_colors ?? undefined,
    isPublished: chapter.is_published ?? false,
    acts,
    cast,
  })
}
