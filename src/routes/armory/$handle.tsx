import { createFileRoute } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import { fetchPublicArmory } from '@/features/passport/api/armoryClient'
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
      }
    }
    // Resolve piece images + names from the catalog (public data carries slugs
    // only; feats may reference pieces the owner hasn't made public).
    const catalog = await runtimeClients.commerce
      .getShopListingCatalog()
      .catch(() => ({ items: [], drops: [] }))
    const images: Record<string, string> = {}
    const names: Record<string, string> = {}
    for (const product of catalog.items) {
      const src = product.images[0]?.src
      if (src) images[product.slug] = src
      names[product.slug] = product.name
    }
    return { handle: params.handle, armory, images, names }
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
  const { armory, images, names } = Route.useLoaderData()
  if (!armory) return <PublicArmoryMissing />
  return <PublicArmoryView armory={armory} images={images} names={names} />
}
