import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import { fetchPublicArmory } from '@/features/passport/api/armoryClient'
import type { ArmoryProductMeta } from '@/features/passport/components/ArmoryTcgCard'
import {
  PublicArmoryMissing,
  PublicArmoryView,
} from '@/features/passport/components/PublicArmoryView'

export const Route = createFileRoute('/armory/$handle')({
  loader: async ({ params }) => {
    const armory = await fetchPublicArmory(params.handle)
    if (!armory) {
      return {
        handle: params.handle,
        armory: null,
        images: {} as Record<string, string>,
        names: {} as Record<string, string>,
        meta: {} as Record<string, ArmoryProductMeta>,
      }
    }
    // Resolve piece images + names + catalog facts (filters, detail modals)
    // from the catalog — public data carries slugs only.
    const catalog = await runtimeClients.commerce
      .getShopListingCatalog()
      .catch(() => ({ items: [], drops: [] }))
    const images: Record<string, string> = {}
    const names: Record<string, string> = {}
    const meta: Record<string, ArmoryProductMeta> = {}
    for (const product of catalog.items) {
      const src = product.images[0]?.src
      if (src) images[product.slug] = src
      names[product.slug] = product.name
      meta[product.slug] = {
        category: product.shop?.category || undefined,
        dropName: product.dropName || undefined,
        price: product.shop?.listPrice ?? product.price,
        currency: product.shop?.currency,
        fit: product.fit || undefined,
        fabric: product.fabric || undefined,
        gsm: product.gsm || undefined,
      }
    }
    return { handle: params.handle, armory, images, names, meta }
  },
  head: ({ loaderData }) =>
    buildSeoMeta({
      title: loaderData?.armory
        ? `${loaderData.armory.ownerName}'s Armory | ANVL Athletics`
        : 'Armory | ANVL Athletics',
      description:
        'A forged-under-pressure collection of registered ANVL pieces, feats, and honors.',
      path: `/armory/${loaderData?.handle ?? ''}`,
      // Random share handles must not be crawled/indexed.
      noIndex: true,
    }),
  component: PublicArmoryRoute,
})

function PublicArmoryRoute() {
  const { armory, handle, images, names, meta } = Route.useLoaderData()
  if (!armory) return <PublicArmoryMissing />
  return (
    <PublicArmoryView
      armory={armory}
      handle={handle}
      images={images}
      names={names}
      meta={meta}
    />
  )
}
