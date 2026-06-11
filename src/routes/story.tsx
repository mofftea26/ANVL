import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BRAND } from '@/shared/constants/brand'
import {
  buildSeoMetaFromCmsSource,
  seoContentToMetaSource,
} from '@/features/cms/seoMeta'
import { runtimeClients } from '@/app/config/runtime'
import { StorySaga } from '@/features/story/components/StorySaga'

type StorySearch = { chapter?: string }

export const Route = createFileRoute('/story')({
  validateSearch: (search: Record<string, unknown>): StorySearch => ({
    chapter:
      typeof search.chapter === 'string' && search.chapter.length > 0
        ? search.chapter
        : undefined,
  }),
  loader: async () => {
    const chapters = await runtimeClients.story.getPublishedChapters()
    return { chapters }
  },
  head: () => {
    const fb = { defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.svg` }
    return buildSeoMetaFromCmsSource(
      seoContentToMetaSource(
        {
          title: 'The Saga | ANVL Athletics',
          description:
            'The saga of ANVL — a kingdom forging an army, told in chapters across every drop. Open a chapter and read the acts within.',
          canonicalPath: '/story',
        },
        fb,
      ),
      fb,
    )
  },
  component: StoryPage,
})

function StoryPage() {
  const { chapters } = Route.useLoaderData()
  const { chapter } = Route.useSearch()
  const navigate = useNavigate()

  const openChapter = (slug: string) => {
    void navigate({ to: '/story', search: { chapter: slug } })
  }
  const closeChapter = () => {
    void navigate({ to: '/story', search: {} })
  }

  return (
    <StorySaga
      chapters={chapters}
      activeChapterSlug={chapter ?? null}
      onOpenChapter={openChapter}
      onCloseChapter={closeChapter}
    />
  )
}
