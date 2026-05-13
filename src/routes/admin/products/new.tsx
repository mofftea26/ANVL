import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import {
  createNewAdminProduct,
  upsertAdminProduct,
} from '@/features/admin/products/products.service'

export const Route = createFileRoute('/admin/products/new')({
  component: NewProductRoute,
})

function NewProductRoute() {
  return (
    <ProtectedAdminRoute>
      <NewProductBootstrap />
    </ProtectedAdminRoute>
  )
}

function NewProductBootstrap() {
  const navigate = useNavigate()

  useEffect(() => {
    const product = createNewAdminProduct()
    upsertAdminProduct(product)
    navigate({
      to: '/admin/products/$productId',
      params: { productId: product.id },
      replace: true,
    })
  }, [navigate])

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--color-text-muted)]">
      Spinning up product shell…
    </div>
  )
}
