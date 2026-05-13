import { createFileRoute } from '@tanstack/react-router'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { ProductEditorRoute } from '@/features/admin/products/ProductEditorRoute'

export const Route = createFileRoute('/admin/products/$productId')({
  parseParams: (params) =>
    params.productId === 'new' ? false : { productId: params.productId },
  component: AdminProductEditorPage,
})

function AdminProductEditorPage() {
  const { productId } = Route.useParams()
  return (
    <ProtectedAdminRoute>
      <ProductEditorRoute productId={productId} />
    </ProtectedAdminRoute>
  )
}
