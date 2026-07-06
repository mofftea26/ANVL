import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BRAND } from '@/shared/constants/brand'
import {
  buildSeoMetaFromCmsSource,
  seoContentToMetaSource,
} from '@/features/cms/seoMeta'
import { runtimeClients } from '@/app/config/runtime'
import { StorySaga } from '@/features/story/components/StorySaga'

type StorySearch = { chapter?: string; product?: string; act?: string }

export const Route = createFileRoute('/story')({
  validateSearch: (search: Record<string, unknown>): StorySearch => ({
    chapter:
      typeof search.chapter === 'string' && search.chapter.length > 0
        ? search.chapter
        : undefined,
    product:
      typeof search.product === 'string' && search.product.length > 0
        ? search.product
        : undefined,
    act:
      typeof search.act === 'string' && search.act.length > 0
        ? search.act
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
  const { chapter, product, act } = Route.useSearch()
  const navigate = useNavigate()

  // Deep-link by product (?product=<slug>) resolves to that product's book.
  const resolvedSlug =
    chapter ??
    (product ? (chapters.find((c) => c.productSlug === product)?.slug ?? null) : null)

  const openChapter = (slug: string) => {
    void navigate({ to: '/story', search: { chapter: slug } })
  }
  const closeChapter = () => {
    void navigate({ to: '/story', search: {} })
  }

  return (
    <StorySaga
      chapters={chapters}
      activeChapterSlug={resolvedSlug}
      activeAct={act}
      onOpenChapter={openChapter}
      onCloseChapter={closeChapter}
    />
  )
}
