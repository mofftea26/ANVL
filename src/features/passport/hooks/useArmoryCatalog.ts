import { useQuery } from '@tanstack/react-query'
import type { ArmoryCatalogEntry } from '../lib/armory'

/**
 * Catalog for the Armory — light, cached, storefront-safe. Shared by the
 * Armory panel (drop completion, piece art) and the share sheet (piece
 * thumbnails), so both read one cache entry instead of two.
 */
export function useArmoryCatalogQuery() {
  return useQuery({
    queryKey: ['storefrontAccount', 'armory-catalog'],
    queryFn: async (): Promise<ArmoryCatalogEntry[]> => {
      const { runtimeClients } = await import('@/app/config/runtime')
      const catalog = await runtimeClients.commerce.getShopListingCatalog()
      return catalog.items.map((p) => ({
        slug: p.slug,
        name: p.name,
        dropName: p.dropName,
        image: p.images[0]?.src,
        category: p.shop?.category,
      }))
    },
    staleTime: 5 * 60_000,
  })
}
