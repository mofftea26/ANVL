import { createFileRoute, notFound } from '@tanstack/react-router'
import { useMemo } from 'react'
import { buildSeoMeta } from '@/app/seo/meta'
import { usePreviewDraft } from '@/features/cms/preview'
import { runtimeClients } from '@/app/config/runtime'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { resolveStorefrontPageAssets } from '@/features/cms/assets/resolvePublishedAssets'
import { ProductDetailPage } from '@/features/products/pdp/ProductDetailPage'
import { resolvePdpContent } from '@/features/products/pdp/resolvePdpContent'
import {
  resolveCareLegend,
  resolveMeasurePoints,
  resolveSupportContent,
} from '@/features/cms/support/resolveSupportContent'
import type { PdpProductSupport } from '@/features/products/pdp/PdpSupportDetails'
import type { SupportContentConfig } from '@/features/cms/support/supportContent.zod'

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
      mediaIndex: projection.mediaIndex,
      supportContent: projection.supportContent,
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
  const { mediaIndex, supportContent, ...data } = Route.useLoaderData()

  // Admin live-preview iframe: unsaved PDP-content / asset edits re-resolve the
  // editorial content client-side. `null` for every real visitor.
  const previewDraft = usePreviewDraft()

  // This product's measurements + care from support_content (preview draft wins).
  const support = useMemo<PdpProductSupport>(() => {
    const effective: SupportContentConfig = previewDraft?.supportContent ?? supportContent
    const resolved = resolveSupportContent(effective)
    const size = resolved.sizeGuide.perProduct[data.product.slug] ?? null
    return {
      size,
      care: resolved.careGuide.perProduct[data.product.slug] ?? null,
      // An unset garment type falls back to the tee inside the resolver.
      measure: resolveMeasurePoints(effective, size?.garmentType ?? ''),
      careLegend: resolveCareLegend(effective),
    }
  }, [previewDraft?.supportContent, supportContent, data.product.slug])

  const previewContent = useMemo(() => {
    // Re-resolve only when PDP content itself is drafted — an asset-only draft
    // falls through to the published resolution (loader data).
    if (!previewDraft?.pdpContent) return null
    const globalAssets = previewDraft.assetConfig
      ? resolveStorefrontPageAssets(previewDraft.assetConfig, 'pdp', mediaIndex)
      : data.assets
    return resolvePdpContent({
      product: data.product,
      pdpContent: previewDraft.pdpContent,
      globalAssets,
      mediaIndex,
    })
  }, [previewDraft?.pdpContent, previewDraft?.assetConfig, data.product, data.assets, mediaIndex])

  return <ProductDetailPage {...data} content={previewContent ?? data.content} support={support} />
}
