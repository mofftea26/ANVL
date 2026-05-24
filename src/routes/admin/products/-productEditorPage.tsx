import { getRouteApi } from '@tanstack/react-router'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { AdminShopifyCatalogRedirect } from '@/features/admin/products/AdminShopifyCatalogRedirect'
import { ProductEditorRoute } from '@/features/admin/products/ProductEditorRoute'
import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'

const routeApi = getRouteApi('/admin/products/$productId')

export function AdminProductEditorPageRoute() {
  const { productId } = routeApi.useParams()
  return (
    <ProtectedAdminRoute>
      {getShopifyPublicEnv() ? (
        <AdminShopifyCatalogRedirect />
      ) : (
        <ProductEditorRoute productId={productId} />
      )}
    </ProtectedAdminRoute>
  )
}
