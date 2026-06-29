import type { CommerceClient } from '@/app/config/clients'
import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'
import {
  SHOPIFY_PRODUCT_BY_HANDLE_QUERY,
  SHOPIFY_PRODUCTS_LIST_QUERY,
  shopifyStorefrontRequest,
} from '@/features/shopify/api/shopifyStorefrontClient'
import {
  mapShopifyProductNodeToStorefront,
  parseShopifyProductNode,
} from '@/features/shopify/mappers/shopifyProductToStorefront'
import { createShopifyCheckout } from '@/features/shopify/api/shopifyCart'
import { seedCommerceClient } from '@/features/products/api/commerceClient.seed'
import { localStorageCommerceClient } from '@/features/products/api/commerceClient.localStorage'
import type { Product } from '@/features/products/types/product.types'

const LIST_FIRST = 100
const DROP_NAME = 'ANVL Athletics'

type ProductsListData = {
  products: {
    edges: Array<{ node: unknown }>
  }
}

type ProductByHandleData = {
  product: unknown | null
}

async function fetchAllShopifyProducts(): Promise<Product[]> {
  const shopifyEnv = getShopifyPublicEnv()
  if (!shopifyEnv) return []

  const data = await shopifyStorefrontRequest<ProductsListData>(
    shopifyEnv,
    SHOPIFY_PRODUCTS_LIST_QUERY,
    { first: LIST_FIRST },
  )

  const out: Product[] = []
  for (const edge of data.products.edges) {
    const node = parseShopifyProductNode(edge.node)
    if (!node) continue
    out.push(mapShopifyProductNodeToStorefront(node, { dropName: DROP_NAME }))
  }
  return out
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
  return typeof window === 'undefined' ? seedCommerceClient : localStorageCommerceClient
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
      const all = await fetchAllShopifyProducts()
      return all.slice(0, 8)
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
      return mapShopifyProductNodeToStorefront(node, { dropName: DROP_NAME })
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
      return { items, drops: [] }
    }, () => offlineCommerce().getShopListingCatalog())
  },

  async startCheckout(lines) {
    return withCommerceFallback(
      () => createShopifyCheckout(lines),
      async () => null,
    )
  },
}
