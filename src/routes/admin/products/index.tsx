import { Link, createFileRoute } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { useMemo } from 'react'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import type { Drop } from '@/features/admin/drops/drops.types'
import { useDropsList } from '@/features/admin/drops/useDrops'
import { useAdminProductsList } from '@/features/admin/products/useAdminProducts'
import type { AdminProduct } from '@/features/admin/products/products.types'

export const Route = createFileRoute('/admin/products/')({
  component: ProductsIndexPage,
})

function ProductsIndexPage() {
  return (
    <ProtectedAdminRoute>
      <ProductsIndex />
    </ProtectedAdminRoute>
  )
}

function primaryImg(p: AdminProduct): string | undefined {
  for (const c of p.colors) {
    const primary = c.images.find((i) => i.isPrimary) ?? c.images[0]
    if (primary?.url) return primary.url
  }
  return undefined
}

function stockSummary(p: AdminProduct): string {
  const total = p.availability.reduce((acc, row) => acc + row.stockQuantity, 0)
  const avail = p.availability.filter((row) => row.isAvailable).length
  const combinations = p.availability.length
  return `${total} units · ${avail}/${combinations} sellable combos`
}

function dropsLabel(dropIds: string[], drops: Drop[]): string {
  if (!dropIds.length) return 'Unassigned'
  const labels = dropIds
    .map((id) => drops.find((d) => d.id === id)?.dropNumber ?? id)
    .slice(0, 3)
  const extra = dropIds.length > 3 ? ` +${dropIds.length - 3}` : ''
  return `${labels.join(', ')}${extra}`
}

function ProductsIndex() {
  const products = useAdminProductsList()
  const drops = useDropsList()
  const sorted = useMemo(
    () =>
      [...products].sort(
        (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      ),
    [products],
  )

  return (
    <AdminLayout
      title="Catalog"
      description="Global SKUs shared across drops. Assignments sync from the Drops → Products tab as well."
    >
      <AdminSectionHeader
        eyebrow="Products"
        title="Inventory"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/products/new"
              className="focus-ring inline-flex h-10 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 text-xs font-semibold text-[var(--color-bg)] no-underline"
            >
              New product
            </Link>
            <a
              href="/shop"
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-text)] no-underline"
            >
              Shop preview
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        }
      />

      <div className="grid gap-5">
        {sorted.map((p) => (
          <AdminCard
            key={p.id}
            title={p.name}
            description={`${p.slug} · ${p.status} · ${p.isActive ? 'Active listing' : 'Hidden listing'}`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]">
                {primaryImg(p) ? (
                  <img
                    src={primaryImg(p)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-[var(--color-text-muted)]">
                    No image
                  </div>
                )}
              </div>
              <div className="grid flex-1 gap-3 text-sm md:grid-cols-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                    Price
                  </p>
                  <p className="font-semibold text-[var(--color-heading)]">
                    ${p.price.toFixed(0)}
                    {p.isOnSale && p.compareAtPrice ? (
                      <span className="ml-2 text-xs text-[var(--color-text-muted)] line-through">
                        ${p.compareAtPrice.toFixed(0)}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                    Drops
                  </p>
                  <p className="text-[var(--color-text)]">
                    {dropsLabel(p.dropIds, drops)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                    Variants
                  </p>
                  <p className="text-[var(--color-text)]">
                    {p.colors.length} colors · {p.sizes.length} sizes
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {stockSummary(p)}
                  </p>
                </div>
              </div>
              <Link
                to="/admin/products/$productId"
                params={{ productId: p.id }}
                className="inline-flex h-10 items-center justify-center rounded-md border border-[var(--color-line)] px-4 text-xs font-semibold text-[var(--color-heading)] no-underline hover:bg-[var(--color-surface-elevated)]"
              >
                Edit
              </Link>
            </div>
          </AdminCard>
        ))}
      </div>
    </AdminLayout>
  )
}
