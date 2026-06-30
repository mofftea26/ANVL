import { createFileRoute, notFound } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { resolveStorefrontPageAssets } from '@/features/cms/assets/resolvePublishedAssets'
import { ProductDetailPage } from '@/features/products/pdp/ProductDetailPage'
import { resolvePdpContent } from '@/features/products/pdp/resolvePdpContent'

export const Route = createFileRoute('/shop/$slug')({
  loader: async ({ params }) => {
    const product = await runtimeClients.commerce.getProductBySlug(params.slug)
    if (!product) throw notFound()
    const [related, projection, storyBook] = await Promise.all([
      runtimeClients.commerce.getRelatedProducts(params.slug),
      loadStorefrontProjection(),
      runtimeClients.story.getChapterByProductSlug(params.slug).catch(() => null),
    ])
    const assets = resolveStorefrontPageAssets(projection.assets, 'pdp', projection.mediaIndex)
    const content = resolvePdpContent({
      product,
      pdpContent: projection.pdpContent,
      globalAssets: assets,
      mediaIndex: projection.mediaIndex,
    })
    return {
      product,
      related,
      assets,
      content,
      shopConfig: projection.shopConfig,
      hasStoryBook: Boolean(storyBook),
    }
  },
  head: ({ loaderData }) => {
    // CMS `Product detail → Social share image` slot wins over the product image.
    const ogImage = loaderData?.assets.ogImage ?? loaderData?.product.images[0]?.src
    return buildSeoMeta({
      title: `${loaderData?.product.name ?? 'Product'} | ANVL Athletics`,
      description: loaderData?.product.storytelling ?? 'ANVL Athletics product details',
      path: `/shop/${loaderData?.product.slug ?? ''}`,
      image: ogImage,
    })
  },
  component: ProductRoute,
})

function ProductRoute() {
  const data = Route.useLoaderData()
  return <ProductDetailPage {...data} />
}
