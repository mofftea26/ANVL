/**
 * Storefront catalog reads that still use the admin persistence layer.
 * Public routes and `features/products/**` should import from here — not
 * `@/features/admin/products/*` — so the dependency boundary stays obvious.
 */
export {
  getRelatedStorefrontProducts,
  getStorefrontProductBySlug,
  getStorefrontProductsForDropSlug,
  getStorefrontProductsForHome,
  getStorefrontShopListingCatalog,
} from '@/features/admin/products/products.commerce'

export { getAdminProductBySlug } from '@/features/admin/products/products.service'
export { effectivePrice, variantIsPurchasable } from '@/features/admin/products/products.mapper'
