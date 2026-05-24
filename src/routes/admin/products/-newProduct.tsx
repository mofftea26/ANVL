import { useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { AdminShopifyCatalogRedirect } from '@/features/admin/products/AdminShopifyCatalogRedirect'
import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'
import {
  createNewAdminProduct,
  upsertAdminProduct,
} from '@/features/admin/products/products.service'

export function AdminNewProductPageRoute() {
  return (
    <ProtectedAdminRoute>
      {getShopifyPublicEnv() ? <AdminShopifyCatalogRedirect /> : <NewProductBootstrap />}
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
