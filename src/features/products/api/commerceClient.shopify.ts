import type { CommerceClient } from '@/app/config/clients'
import { getSupabasePublicEnv } from '@/features/cms/api/supabasePublicEnv'
import { fetchPublishedStorefrontProjection } from '@/features/cms/api/publicStorefrontPublication'
import { getStorefrontOfflineActiveDrop } from '@/features/cms/runtime/storefrontReadFallback'
import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'
import {
  SHOPIFY_PRODUCT_BY_HANDLE_QUERY,
  SHOPIFY_PRODUCTS_LIST_QUERY,
  shopifyStorefrontRequest,
} from '@/features/shopify/api/shopifyStorefrontClient'
import {
  mapShopifyProductNodeToStorefront,
  parseShopifyProductNode,
  productMatchesDropId,
} from '@/features/shopify/mappers/shopifyProductToStorefront'
import { supabaseCommerceClient } from '@/features/products/api/commerceClient.supabase'
import { seedCommerceClient } from '@/features/products/api/commerceClient.seed'
import type { Product, ShopDropFilterOption } from '@/features/products/types/product.types'

const LIST_FIRST = 100

type ProductsListData = {
  products: {
    edges: Array<{ node: unknown }>
  }
}

type ProductByHandleData = {
  product: unknown | null
}

async function resolveActiveDropForCommerce() {
  const env = getSupabasePublicEnv()
  if (env) {
    try {
      const p = await fetchPublishedStorefrontProjection(env)
      if (p) return p.drop
    } catch {
      /* */
    }
  }
  return getStorefrontOfflineActiveDrop()
}

async function fetchAllShopifyProducts(): Promise<Product[]> {
  const shopifyEnv = getShopifyPublicEnv()
  if (!shopifyEnv) return []

  const data = await shopifyStorefrontRequest<ProductsListData>(
    shopifyEnv,
    SHOPIFY_PRODUCTS_LIST_QUERY,
    { first: LIST_FIRST },
  )

  const active = await resolveActiveDropForCommerce()
  const dropName = active?.name ?? 'ANVL Athletics'

  const out: Product[] = []
  for (const edge of data.products.edges) {
    const node = parseShopifyProductNode(edge.node)
    if (!node) continue
    out.push(mapShopifyProductNodeToStorefront(node, { dropName }))
  }
  return out
}

function buildDropFilterOptions(
  items: Product[],
  activeDrop: Awaited<ReturnType<typeof resolveActiveDropForCommerce>>,
): ShopDropFilterOption[] {
  if (!activeDrop) return []
  const used = items.some((p) => productMatchesDropId(p, activeDrop.id))
  if (!used) return []
  return [
    {
      id: activeDrop.id,
      slug: activeDrop.slug,
      name: activeDrop.name,
      dropNumber: activeDrop.dropNumber,
    },
  ]
}

/** When Shopify env is unset or the API fails, use publication/local/seed commerce. */
async function withCommerceFallback<T>(
  shopifyFn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
): Promise<T> {
  if (!getShopifyPublicEnv()) {
    return fallbackFn()
  }
  try {
    return await shopifyFn()
  } catch {
    return fallbackFn()
  }
}

function offlineCommerce(): CommerceClient {
  if (getSupabasePublicEnv()) return supabaseCommerceClient
  return seedCommerceClient
}

export const shopifyCommerceClient: CommerceClient = {
  async getProducts() {
    return withCommerceFallback(
      async () => fetchAllShopifyProducts(),
      () => offlineCommerce().getProducts(),
    )
  },

  async getHomeProducts() {
    return withCommerceFallback(async () => {
      const active = await resolveActiveDropForCommerce()
      const all = await fetchAllShopifyProducts()
      if (!active) return all.slice(0, 8)
      const linked = all.filter((p) => productMatchesDropId(p, active.id))
      return linked.length > 0 ? linked : all.slice(0, 8)
    }, () => offlineCommerce().getHomeProducts())
  },

  async getProductBySlug(slug: string) {
    return withCommerceFallback(async () => {
      const shopifyEnv = getShopifyPublicEnv()
      if (!shopifyEnv) return null

      const data = await shopifyStorefrontRequest<ProductByHandleData>(
        shopifyEnv,
        SHOPIFY_PRODUCT_BY_HANDLE_QUERY,
        { handle: slug },
      )
      const node = parseShopifyProductNode(data.product)
      if (!node) return null
      const active = await resolveActiveDropForCommerce()
      return mapShopifyProductNodeToStorefront(node, {
        dropName: active?.name ?? 'ANVL Athletics',
      })
    }, () => offlineCommerce().getProductBySlug(slug))
  },

  async getRelatedProducts(slug: string) {
    return withCommerceFallback(async () => {
      const items = await fetchAllShopifyProducts()
      return items.filter((p) => p.slug !== slug).slice(0, 4)
    }, () => offlineCommerce().getRelatedProducts(slug))
  },

  async getShopListingCatalog() {
    return withCommerceFallback(async () => {
      const items = await fetchAllShopifyProducts()
      const active = await resolveActiveDropForCommerce()
      return {
        items,
        drops: buildDropFilterOptions(items, active),
      }
    }, () => offlineCommerce().getShopListingCatalog())
  },
}
