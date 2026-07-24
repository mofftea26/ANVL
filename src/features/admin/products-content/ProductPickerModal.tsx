import { Check, Search } from '@/shared/icons'
import { useEffect, useMemo, useState } from 'react'
import type { Product } from '@/features/products/types/product.types'
import type { PdpContentConfig } from '@/features/cms/pdpContent/pdpContent.zod'
import { hasAuthoredPdpContent } from '@/features/cms/pdpContent/pdpContent.zod'
import { Input } from '@/shared/components/ui/Input'
import { Modal } from '@/shared/components/ui/Modal'
import { cn } from '@/shared/lib/cn'
import { isLikelySafeMediaSrc } from '@/shared/lib/url'
import { ICON_SIZE } from '@/shared/lib/iconSize'

const SEARCH_DEBOUNCE_MS = 250

type AuthoredFilter = 'all' | 'authored' | 'unauthored'

interface ProductPickerModalProps {
  open: boolean
  onClose: () => void
  products: Product[]
  pdpContent: PdpContentConfig
  selectedSlug: string
  onSelect: (slug: string) => void
}

function formatPrice(product: Product): string {
  const currency = product.shop?.currency ?? 'USD'
  const value = product.shop?.listPrice ?? product.price
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${value}`
  }
}

/** Small filter pill — shared look across the category / fit / authored chips. */
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'focus-ring rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-text)]'
          : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/40',
      )}
    >
      {children}
    </button>
  )
}

/**
 * Product picker for the PDP content editor. Replaces the old select dropdown:
 * a focus-trapped modal (Escape closes via {@link Modal}) of product cards —
 * image, title, price, category/fit/status badges, and an "authored" marker for
 * products that already carry `pdp_content`. A debounced search matches
 * title/slug/category/tags; chips filter by category, fit (when any product has
 * one), and authored state. Picking a card selects that product and closes.
 */
export function ProductPickerModal({
  open,
  onClose,
  products,
  pdpContent,
  selectedSlug,
  onSelect,
}: ProductPickerModalProps) {
  const [rawSearch, setRawSearch] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [fit, setFit] = useState<string>('all')
  const [authored, setAuthored] = useState<AuthoredFilter>('all')

  // Debounced search (≥250ms) so typing doesn't refilter on every keystroke.
  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(rawSearch), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [rawSearch])

  // Reset transient filter state each time the modal opens.
  useEffect(() => {
    if (!open) return
    setRawSearch('')
    setSearch('')
    setCategory('all')
    setFit('all')
    setAuthored('all')
  }, [open])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) {
      const c = p.shop?.category?.trim()
      if (c) set.add(c)
    }
    return Array.from(set).sort()
  }, [products])

  const fits = useMemo(() => {
    const set = new Set<string>()
    for (const p of products) {
      const f = p.shop?.fit?.trim()
      if (f) set.add(f)
    }
    return Array.from(set).sort()
  }, [products])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return products.filter((p) => {
      if (category !== 'all' && p.shop?.category !== category) return false
      if (fit !== 'all' && p.shop?.fit !== fit) return false
      if (authored !== 'all') {
        const isAuthored = hasAuthoredPdpContent(pdpContent[p.slug])
        if (authored === 'authored' && !isAuthored) return false
        if (authored === 'unauthored' && isAuthored) return false
      }
      if (!needle) return true
      const haystack = [
        p.name,
        p.slug,
        p.shop?.category ?? '',
        p.shop?.fit ?? '',
        ...(p.shop?.tags ?? []),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(needle)
    })
  }, [products, search, category, fit, authored, pdpContent])

  return (
    <Modal open={open} onClose={onClose} title="Choose a product" className="max-w-3xl">
      <div className="space-y-4" data-testid="product-picker-modal">
        <div className="relative">
          <Search
            size={ICON_SIZE.sm}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <Input
            type="search"
            value={rawSearch}
            onChange={(e) => setRawSearch(e.target.value)}
            placeholder="Search products by name, category, tag…"
            density="compact"
            className="pl-9"
            aria-label="Search products"
          />
        </div>

        <div className="space-y-2">
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
              <Chip active={category === 'all'} onClick={() => setCategory('all')}>
                All categories
              </Chip>
              {categories.map((c) => (
                <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                  {c}
                </Chip>
              ))}
            </div>
          ) : null}

          {fits.length > 0 ? (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by fit">
              <Chip active={fit === 'all'} onClick={() => setFit('all')}>
                All fits
              </Chip>
              {fits.map((f) => (
                <Chip key={f} active={fit === f} onClick={() => setFit(f)}>
                  {f}
                </Chip>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by authored state">
            <Chip active={authored === 'all'} onClick={() => setAuthored('all')}>
              All
            </Chip>
            <Chip active={authored === 'authored'} onClick={() => setAuthored('authored')}>
              Authored
            </Chip>
            <Chip active={authored === 'unauthored'} onClick={() => setAuthored('unauthored')}>
              Not authored
            </Chip>
          </div>
        </div>

        <p className="text-xs text-[var(--color-text-muted)]" aria-live="polite">
          {filtered.length} product{filtered.length === 1 ? '' : 's'}
        </p>

        <ul className="grid max-h-[52vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">
          {filtered.map((product) => {
            const image = product.images[0]?.src
            const safeImage = image && isLikelySafeMediaSrc(image) ? image : null
            const isAuthored = hasAuthoredPdpContent(pdpContent[product.slug])
            const isSelected = product.slug === selectedSlug
            return (
              <li key={product.slug}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(product.slug)
                    onClose()
                  }}
                  aria-pressed={isSelected}
                  className={cn(
                    'focus-ring group flex w-full flex-col overflow-hidden rounded-xl border text-left transition-colors',
                    isSelected
                      ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                      : 'border-[var(--color-line)] hover:border-[var(--color-accent)]/50',
                  )}
                >
                  <span className="relative block aspect-square w-full overflow-hidden bg-[var(--color-surface)]">
                    {safeImage ? (
                      <img
                        src={safeImage}
                        alt=""
                        width={240}
                        height={240}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
                        No image
                      </span>
                    )}
                    {isSelected ? (
                      <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-[var(--color-accent)] text-[var(--color-bg)]">
                        <Check size={ICON_SIZE.sm} aria-hidden="true" />
                      </span>
                    ) : null}
                  </span>
                  <span className="flex flex-1 flex-col gap-1.5 p-2.5">
                    <span className="truncate text-xs font-medium text-[var(--color-text)]">
                      {product.name}
                    </span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      {formatPrice(product)}
                    </span>
                    <span className="mt-auto flex flex-wrap gap-1">
                      {product.shop?.category ? (
                        <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[var(--color-text-muted)]">
                          {product.shop.category}
                        </span>
                      ) : null}
                      {product.shop?.fit ? (
                        <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[var(--color-text-muted)]">
                          {product.shop.fit}
                        </span>
                      ) : null}
                      {isAuthored ? (
                        <span className="rounded border border-[var(--color-accent)]/50 bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-[var(--color-accent)]">
                          Authored
                        </span>
                      ) : null}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
            No products match those filters.
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
