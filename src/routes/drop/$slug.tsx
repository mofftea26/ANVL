import { createFileRoute, redirect } from '@tanstack/react-router'
import { BRAND } from '@/shared/constants/brand'
import {
  buildSeoMetaFromCmsSource,
  dropSeoToMetaSource,
  seoContentToMetaSource,
} from '@/features/cms/seoMeta'
import { runtimeClients } from '@/app/config/runtime'
import { getStorefrontProductsForDropSlug } from '@/features/products/catalog/storefrontCatalog'
import { DropActivePageView } from '@/features/drops/public/DropActivePageView'

export const Route = createFileRoute('/drop/$slug')({
  loader: async ({ params }) => {
    const active = await runtimeClients.cms.getActiveDrop()
    if (!active) throw redirect({ to: '/', replace: true })
    if (params.slug !== active.slug) {
      throw redirect({
        to: '/drop/$slug',
        params: { slug: active.slug },
        replace: true,
      })
    }
    const products = getStorefrontProductsForDropSlug(active.slug)
    const [siteSeo, seoDoc] = await Promise.all([
      runtimeClients.seo.getSiteSeo(),
      runtimeClients.seo.getSeoByPath(`/drop/${params.slug}`),
    ])
    return { drop: active, products, siteSeo, seoDoc }
  },
  head: ({ loaderData }) => {
    const d = loaderData?.drop
    const site = loaderData?.siteSeo
    const doc = loaderData?.seoDoc
    const fb = { defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.svg` }
    if (!d || !site) {
      return buildSeoMetaFromCmsSource(
        dropSeoToMetaSource(
          { title: 'Drop | ANVL Athletics', description: '' },
          '/drop',
          fb,
        ),
        fb,
      )
    }
    if (doc) {
      return buildSeoMetaFromCmsSource(
        seoContentToMetaSource(doc, site.globalDefaults),
        site.globalDefaults,
      )
    }
    return buildSeoMetaFromCmsSource(
      dropSeoToMetaSource(d.seo, `/drop/${d.slug}`, site.globalDefaults),
      site.globalDefaults,
    )
  },
  component: DropRoutePage,
})

function DropRoutePage() {
  const { drop, products } = Route.useLoaderData()
  return <DropActivePageView drop={drop} products={products} />
}
