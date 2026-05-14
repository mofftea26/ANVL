import { createFileRoute, redirect } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import { getStorefrontProductsForDropSlug } from '@/features/admin/products/products.commerce'
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
    return { drop: active, products }
  },
  head: ({ loaderData }) => {
    const d = loaderData?.drop
    return buildSeoMeta({
      title: d?.seo.title ?? 'Drop | ANVL Athletics',
      description: d?.seo.description ?? '',
      path: d ? `/drop/${d.slug}` : '/drop',
      image: d?.seo.ogImage,
      ogTitle: d?.seo.ogTitle,
      ogDescription: d?.seo.ogDescription,
    })
  },
  component: DropRoutePage,
})

function DropRoutePage() {
  const { drop, products } = Route.useLoaderData()
  return <DropActivePageView drop={drop} products={products} />
}
