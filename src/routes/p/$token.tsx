import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { resolveStorefrontPageAssets } from '@/features/cms/assets/resolvePublishedAssets'
import { fetchPassportByTokenAnon } from '@/features/passport/api/passportClient'
import { PassportExperience } from '@/features/passport/components/PassportExperience'
import { resolvePassportContent } from '@/features/passport/lib/resolvePassportContent'
import { resolvePdpContent } from '@/features/products/pdp/resolvePdpContent'

export const Route = createFileRoute('/p/$token')({
  validateSearch: (search: Record<string, unknown>): { transfer?: string } => {
    const raw = search.transfer
    return typeof raw === 'string' && raw.length >= 8 && raw.length <= 128
      ? { transfer: raw }
      : {}
  },
  loaderDeps: ({ search }) => ({ transfer: search.transfer }),
  loader: async ({ params, deps }) => {
    // Anon-scoped lookup only (SSR has no customer session). Owner resolution
    // happens client-side via the session-aware query in PassportExperience.
    const view = await fetchPassportByTokenAnon(params.token, deps.transfer)
    if (!view) {
      return {
        token: params.token,
        view: null,
        product: null,
        content: resolvePassportContent({
          product: null,
          passportContent: {},
          pdpContent: null,
          mediaIndex: [],
          productSlug: '',
        }),
        storyChapter: null,
      }
    }
    const [product, projection, storyBook] = await Promise.all([
      runtimeClients.commerce.getProductBySlug(view.productSlug).catch(() => null),
      loadStorefrontProjection(),
      runtimeClients.story.getChapterByProductSlug(view.productSlug).catch(() => null),
    ])
    const pdpResolved = product
      ? resolvePdpContent({
          product,
          pdpContent: projection.pdpContent,
          globalAssets: resolveStorefrontPageAssets(
            projection.assets,
            'pdp',
            projection.mediaIndex,
          ),
          mediaIndex: projection.mediaIndex,
        })
      : null
    const content = resolvePassportContent({
      product,
      passportContent: projection.passportContent,
      pdpContent: pdpResolved,
      mediaIndex: projection.mediaIndex,
      productSlug: view.productSlug,
    })
    return { token: params.token, view, product, content, storyChapter: storyBook }
  },
  head: ({ loaderData }) =>
    buildSeoMeta({
      title: loaderData?.view
        ? `${loaderData.view.productName} — Product Passport | ANVL Athletics`
        : 'Product Passport | ANVL Athletics',
      description:
        'A forged-under-pressure product passport. One piece, one owner, verified.',
      path: `/p/${loaderData?.token ?? ''}`,
      noIndex: true,
    }),
  component: PassportRoute,
})

function PassportRoute() {
  const data = Route.useLoaderData()
  const { transfer } = Route.useSearch()
  return <PassportExperience {...data} transferCode={transfer} />
}
