import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLoadingState } from '@/features/admin/components/AdminLoadingState'
import { createCommerceClient } from '@/features/products/api/createCommerceClient'
import type { Product } from '@/features/products/types/product.types'
import { getShopifyPublicEnv } from '@/features/shopify/config/shopifyPublicEnv'

/** Storefront PDP path for a catalog product. */
function resolveProductHref(p: Product): string {
  return `/shop/${p.slug}`
}

export function AdminShopifyProductGrid() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const client = createCommerceClient({ isServer: false })
    void client.getHomeProducts().then((list) => {
      if (!cancelled) {
        setProducts(list)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const env = getShopifyPublicEnv()

  if (loading) {
    return <AdminLoadingState message="Loading Shopify catalog…" />
  }

  if (!products.length) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">
        No products returned from the Storefront API.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((p) => {
        const img = p.images[0]
        const href = resolveProductHref(p)
        return (
          <AdminCard key={p.id} className="flex flex-col overflow-hidden p-0">
            <div className="aspect-[4/5] bg-[var(--color-bg)]">
              {img ? (
                <img src={img.src} alt={img.alt} className="size-full object-cover" />
              ) : null}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
              <h3 className="font-medium text-[var(--color-text)]">{p.name}</h3>
              <p className="text-xs text-[var(--color-text-muted)]">
                {p.shop?.storefrontStatus ?? '—'} · ${p.price.toFixed(2)}
              </p>
              <div className="mt-auto flex gap-2 pt-2">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-[var(--color-accent)]"
                >
                  View in store
                  <ExternalLink className="size-3" />
                </a>
                {env ? (
                  <a
                    href={`https://${env.storeDomain}/admin/products`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]"
                  >
                    Admin
                    <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
            </div>
          </AdminCard>
        )
      })}
    </div>
  )
}
