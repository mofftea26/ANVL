import { useNavigate } from '@tanstack/react-router'
import { Copy, ExternalLink, Trash2 } from 'lucide-react'
import {
  useDeferredValue,
  useId,
  useMemo,
  useState,
} from 'react'
import { toast } from 'sonner'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminDateField } from '@/features/admin/components/AdminDateField'
import { AdminForgedLink } from '@/features/admin/components/AdminForgedLink'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminMediaThumbPlaceholder } from '@/features/admin/components/AdminEmptyState'
import { AdminPanel } from '@/features/admin/components/AdminPanel'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import type { Drop } from '@/features/admin/drops/drops.types'
import { useDropsList } from '@/features/admin/drops/useDrops'
import {
  deleteAdminProduct,
  duplicateAdminProduct,
  upsertAdminProduct,
} from '@/features/admin/products/products.service'
import { useAdminProductsList } from '@/features/admin/products/useAdminProducts'
import type {
  AdminProduct,
  ProductSourceType,
  ProductStatus,
} from '@/features/admin/products/products.types'
import { effectiveSellableUnits } from '@/features/admin/products/products.matrix'
import { detachProductFromAllDrops } from '@/features/admin/drops/drops.service'
import { AdminInput } from '@/features/admin/components/AdminInput'
import { cn } from '@/shared/lib/cn'
import { Modal } from '@/shared/components/ui/Modal'
import { AdminNativeSelect } from '@/features/admin/components/AdminNativeSelect'
import { adminStackedFieldClass } from '@/shared/lib/cmsFieldStyles'

export function AdminProductsIndexRoute() {
  return (
    <ProtectedAdminRoute>
      <ProductsIndex />
    </ProtectedAdminRoute>
  )
}

type SortKey =
  | 'updated_desc'
  | 'updated_asc'
  | 'release_desc'
  | 'release_asc'
  | 'price_desc'
  | 'price_asc'
  | 'status'

type GroupMode = 'flat' | 'by_drop'

type StockFilter = 'all' | 'in_stock' | 'out_of_stock'

const STATUS_OPTIONS: Array<ProductStatus | 'all'> = [
  'all',
  'draft',
  'active',
  'inactive',
  'comingSoon',
  'outOfStock',
  'sale',
  'archived',
]

function primaryListImage(p: AdminProduct): { src: string; alt: string } | null {
  for (const c of p.colors) {
    const primary = c.images.find((i) => i.isPrimary) ?? c.images[0]
    const url = primary?.url?.trim()
    if (url) {
      const altFromImage = primary?.alt?.trim()
      const colorName = c.name?.trim() || 'Primary color'
      const productName = p.name?.trim() || 'Product'
      const alt = altFromImage || `${productName} — ${colorName}`
      return { src: url, alt }
    }
  }
  return null
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

function hasSellableVariant(p: AdminProduct): boolean {
  return p.availability.some((row) => effectiveSellableUnits(row) > 0)
}

function matchesFilters(
  p: AdminProduct,
  opts: {
    q: string
    status: ProductStatus | 'all'
    dropFilter: 'all' | 'none' | string
    sourceType: ProductSourceType | 'all'
    categoryQ: string
    colorQ: string
    stockFilter: StockFilter
    updatedFrom: string
    updatedTo: string
  },
): boolean {
  if (opts.status !== 'all' && p.status !== opts.status) return false
  if (opts.sourceType !== 'all' && p.sourceType !== opts.sourceType)
    return false
  if (opts.categoryQ && !p.category.toLowerCase().includes(opts.categoryQ))
    return false
  if (
    opts.colorQ &&
    !p.colors.some((c) => c.name.toLowerCase().includes(opts.colorQ))
  )
    return false
  if (opts.stockFilter === 'in_stock' && !hasSellableVariant(p)) return false
  if (opts.stockFilter === 'out_of_stock' && hasSellableVariant(p))
    return false
  if (opts.dropFilter === 'none' && p.dropIds.length > 0) return false
  if (
    opts.dropFilter !== 'all' &&
    opts.dropFilter !== 'none' &&
    !p.dropIds.includes(opts.dropFilter)
  )
    return false
  if (opts.updatedFrom) {
    const from = new Date(opts.updatedFrom)
    if (!Number.isNaN(from.getTime()) && p.updatedAt < from.toISOString())
      return false
  }
  if (opts.updatedTo) {
    const to = new Date(opts.updatedTo)
    if (!Number.isNaN(to.getTime())) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      if (p.updatedAt > end.toISOString()) return false
    }
  }
  if (opts.q) {
    const hay = `${p.name} ${p.slug} ${p.category} ${p.tags.join(' ')}`.toLowerCase()
    if (!hay.includes(opts.q)) return false
  }
  return true
}

function sortProducts(list: AdminProduct[], sortKey: SortKey): AdminProduct[] {
  const next = [...list]
  const rel = (a: AdminProduct, b: AdminProduct) => {
    const ad = a.releaseDate ?? ''
    const bd = b.releaseDate ?? ''
    return ad.localeCompare(bd)
  }
  switch (sortKey) {
    case 'updated_asc':
      return next.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    case 'release_desc':
      return next.sort((a, b) => -rel(a, b))
    case 'release_asc':
      return next.sort(rel)
    case 'price_desc':
      return next.sort((a, b) => b.price - a.price)
    case 'price_asc':
      return next.sort((a, b) => a.price - b.price)
    case 'status':
      return next.sort((a, b) => a.status.localeCompare(b.status))
    case 'updated_desc':
    default:
      return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }
}

function ProductsIndex() {
  const navigate = useNavigate()
  const products = useAdminProductsList()
  const drops = useDropsList()

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search.trim().toLowerCase())
  const [status, setStatus] = useState<ProductStatus | 'all'>('all')
  const [dropFilter, setDropFilter] = useState<'all' | 'none' | string>('all')
  const [sourceType, setSourceType] = useState<ProductSourceType | 'all'>(
    'all',
  )
  const [categoryQ, setCategoryQ] = useState('')
  const [colorQ, setColorQ] = useState('')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [updatedFrom, setUpdatedFrom] = useState('')
  const [updatedTo, setUpdatedTo] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('updated_desc')
  const [groupMode, setGroupMode] = useState<GroupMode>('flat')
  const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null)
  const deleteModalTitleId = useId()

  const filtered = useMemo(() => {
    const cat = categoryQ.trim().toLowerCase()
    const col = colorQ.trim().toLowerCase()
    return products.filter((p) =>
      matchesFilters(
        p,
        {
          q: deferredSearch,
          status,
          dropFilter,
          sourceType,
          categoryQ: cat,
          colorQ: col,
          stockFilter,
          updatedFrom,
          updatedTo,
        },
      ),
    )
  }, [
    products,
    drops,
    deferredSearch,
    status,
    dropFilter,
    sourceType,
    categoryQ,
    colorQ,
    stockFilter,
    updatedFrom,
    updatedTo,
  ])

  const sorted = useMemo(
    () => sortProducts(filtered, sortKey),
    [filtered, sortKey],
  )

  const grouped = useMemo(() => {
    if (groupMode === 'flat') return null
    const byDrop: { title: string; id: string; items: AdminProduct[] }[] = []
    for (const d of drops) {
      const items = sorted.filter((p) => p.dropIds.includes(d.id))
      if (items.length) {
        byDrop.push({
          id: d.id,
          title: `${d.dropNumber} · ${d.name}`,
          items,
        })
      }
    }
    const individuals = sorted.filter((p) => p.dropIds.length === 0)
    return { byDrop, individuals }
  }, [groupMode, sorted, drops])

  const fieldClass = adminStackedFieldClass

  const handleDuplicate = (p: AdminProduct) => {
    const copy = duplicateAdminProduct(p)
    upsertAdminProduct(copy)
    toast.success('Duplicate created as draft.')
    navigate({
      to: '/admin/products/$productId',
      params: { productId: copy.id },
    })
  }

  const handleArchive = (p: AdminProduct) => {
    upsertAdminProduct({ ...p, status: 'archived', isActive: false })
    toast.success('Product archived.')
  }

  const renderCard = (p: AdminProduct) => {
    const thumb = primaryListImage(p)
    return (
      <AdminCard
        key={p.id}
        title={p.name}
        description={`${p.slug} · ${p.status} · ${p.sourceType} · ${p.isActive ? 'Active listing' : 'Hidden listing'}`}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]">
            {thumb ? (
              <img
                src={thumb.src}
                alt={thumb.alt}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <AdminMediaThumbPlaceholder />
            )}
          </div>
          <div className="grid flex-1 gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                Price
              </p>
              <p className="font-semibold text-[var(--color-heading)]">
                {p.currency} {p.price.toFixed(0)}
                {p.isOnSale && p.compareAtPrice ? (
                  <span className="ml-2 text-xs text-[var(--color-text-muted)] line-through">
                    {p.currency} {p.compareAtPrice.toFixed(0)}
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
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <AdminForgedLink
              to="/admin/products/$productId"
              params={{ productId: p.id }}
              variant="outline"
            >
              Edit
            </AdminForgedLink>
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              className="h-10"
              onClick={() => handleDuplicate(p)}
            >
              <Copy size={14} className="mr-1" aria-hidden="true" />
              Duplicate
            </AdminButton>
            <AdminButton
              type="button"
              variant="secondary"
              size="sm"
              className="h-10"
              onClick={() => handleArchive(p)}
              disabled={p.status === 'archived'}
            >
              Archive
            </AdminButton>
            <AdminForgedLink href={`/shop/${p.slug}`} variant="outline" target="_blank" rel="noreferrer">
              Preview
              <ExternalLink size={14} aria-hidden="true" />
            </AdminForgedLink>
            <AdminButton
              type="button"
              variant="ghost"
              size="sm"
              className="h-10 text-red-400 hover:text-red-300"
              onClick={() => setPendingDelete(p)}
            >
              <Trash2 size={14} aria-hidden="true" />
            </AdminButton>
          </div>
        </div>
      </AdminCard>
    )
  }

  return (
    <AdminLayout title="Catalog">
      <div className="mb-6 flex flex-wrap justify-end gap-2">
        <AdminForgedLink to="/admin/products/new">New product</AdminForgedLink>
        <AdminForgedLink href="/shop" variant="outline" target="_blank" rel="noreferrer">
          Shop preview
          <ExternalLink size={14} aria-hidden="true" />
        </AdminForgedLink>
      </div>

      <AdminPanel variant="filters" className="mb-8 grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Search
          <AdminInput
            className={fieldClass}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, slug, tags…"
            aria-label="Search products"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Status
          <AdminNativeSelect
            className={fieldClass}
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as ProductStatus | 'all')
            }
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All statuses' : s}
              </option>
            ))}
          </AdminNativeSelect>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Drop
          <AdminNativeSelect
            className={fieldClass}
            value={dropFilter}
            onChange={(e) => setDropFilter(e.target.value)}
            aria-label="Filter by drop"
          >
            <option value="all">All drops</option>
            <option value="none">Unassigned only</option>
            {drops.map((d) => (
              <option key={d.id} value={d.id}>
                {d.dropNumber} · {d.name}
              </option>
            ))}
          </AdminNativeSelect>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Source
          <AdminNativeSelect
            className={fieldClass}
            value={sourceType}
            onChange={(e) =>
              setSourceType(e.target.value as ProductSourceType | 'all')
            }
            aria-label="Filter by listing source"
          >
            <option value="all">All</option>
            <option value="drop">Drop release</option>
            <option value="individual">Individual</option>
          </AdminNativeSelect>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Category contains
          <AdminInput
            className={fieldClass}
            value={categoryQ}
            onChange={(e) => setCategoryQ(e.target.value)}
            aria-label="Filter by category"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Color contains
          <AdminInput
            className={fieldClass}
            value={colorQ}
            onChange={(e) => setColorQ(e.target.value)}
            aria-label="Filter by color name"
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Stock availability
          <AdminNativeSelect
            className={fieldClass}
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as StockFilter)}
            aria-label="Filter by variant stock"
          >
            <option value="all">Any</option>
            <option value="in_stock">Has sellable variant</option>
            <option value="out_of_stock">No sellable variant</option>
          </AdminNativeSelect>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Updated from
          <AdminDateField
            clear
            className={cn('focus-ring', fieldClass)}
            aria-label="Updated on or after"
            value={updatedFrom}
            onChange={setUpdatedFrom}
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Updated to
          <AdminDateField
            clear
            className={cn('focus-ring', fieldClass)}
            aria-label="Updated on or before"
            value={updatedTo}
            onChange={setUpdatedTo}
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Sort
          <AdminNativeSelect
            className={fieldClass}
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Sort products"
          >
            <option value="updated_desc">Newest update</option>
            <option value="updated_asc">Oldest update</option>
            <option value="release_desc">Release date (newest)</option>
            <option value="release_asc">Release date (oldest)</option>
            <option value="price_desc">Price (high)</option>
            <option value="price_asc">Price (low)</option>
            <option value="status">Status (A–Z)</option>
          </AdminNativeSelect>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          Grouping
          <AdminNativeSelect
            className={fieldClass}
            value={groupMode}
            onChange={(e) => setGroupMode(e.target.value as GroupMode)}
            aria-label="Group products"
          >
            <option value="flat">Flat list</option>
            <option value="by_drop">By drop + individuals</option>
          </AdminNativeSelect>
        </label>
      </AdminPanel>

      <p className="mb-6 text-sm text-[var(--color-text-muted)]">
        Showing {sorted.length} of {products.length} products
        {deferredSearch !== search.trim().toLowerCase() ? ' (updating…)' : ''}
      </p>

      <div className="grid gap-5">
        {groupMode === 'flat'
          ? sorted.map((p) => renderCard(p))
          : grouped ? (
            <>
              {grouped.byDrop.map((section) => (
                <div key={section.id} className="space-y-3">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-heading)]">
                    {section.title}
                  </h2>
                  <div className="grid gap-5">{section.items.map((p) => renderCard(p))}</div>
                </div>
              ))}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-heading)]">
                  Individual releases
                </h2>
                {grouped.individuals.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    No unassigned products in this view.
                  </p>
                ) : (
                  <div className="grid gap-5">
                    {grouped.individuals.map((p) => renderCard(p))}
                  </div>
                )}
              </div>
            </>
          ) : null}
      </div>

      <Modal
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        aria-labelledby={deleteModalTitleId}
      >
        <div className="space-y-4">
          <h3 id={deleteModalTitleId} className="anvl-heading text-xl font-normal">
            Delete product?
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Removes {pendingDelete?.name ?? 'this product'} from the catalog and
            every drop roster.
          </p>
          <div className="flex justify-end gap-2">
            <AdminButton variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>
              Cancel
            </AdminButton>
            <AdminButton
              variant="primary"
              size="sm"
              onClick={() => {
                if (!pendingDelete) return
                detachProductFromAllDrops(pendingDelete.id)
                deleteAdminProduct(pendingDelete.id)
                toast.success('Product deleted.')
                setPendingDelete(null)
              }}
            >
              Delete
            </AdminButton>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
