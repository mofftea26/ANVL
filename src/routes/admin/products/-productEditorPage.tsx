import { getRouteApi } from '@tanstack/react-router'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { ProductEditorRoute } from '@/features/admin/products/ProductEditorRoute'

const routeApi = getRouteApi('/admin/products/$productId')

export function AdminProductEditorPageRoute() {
  const { productId } = routeApi.useParams()
  return (
    <ProtectedAdminRoute>
      <ProductEditorRoute productId={productId} />
    </ProtectedAdminRoute>
  )
}
