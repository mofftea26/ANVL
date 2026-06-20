import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { buildSeoMeta } from '@/app/seo/meta'
import { buildSeoHeadForSiteStaticPath } from '@/features/cms/seoMeta'
import { runtimeClients } from '@/app/config/runtime'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { resolveStorefrontPageAssets } from '@/features/cms/assets/resolvePublishedAssets'
import { ShopFiltersForm } from '@/features/products/shop/ShopFiltersForm'
import {
  catalogPriceBounds,
  defaultShopUrlSearch,
  filterShopListingProducts,
  SHOP_SORT_OPTIONS,
  sortShopListingProducts,
  uniqueColorwayNames,
  uniqueSizeLabels,
  validateShopUrlSearch,
} from '@/features/products/shop/shopUrlSearch'
import type { Product, StorefrontProductStatus } from '@/features/products/types/product.types'
import {
  Button,
  Container,
  Drawer,
  Input,
  ProductCard,
  Section,
  Skeleton,
} from '@/shared/components/ui'
import { ForgeAtmosphere } from '@/shared/components/premium/ForgeAtmosphere'

/**
 * Cinematic armory backdrop layered above the ember atmosphere. The image is
 * applied as a CSS background (not an `<img>`) so a not-yet-uploaded file fails
 * silently — the `ForgeAtmosphere` underneath always carries the hero. The CMS
 * `Shop → Hero backdrop` slot overrides this fallback when assigned.
 */
const SHOP_HERO_BG_FALLBACK = '/shop/armory-hero.webp'

const STATUS_CHIP_LABELS: Record<StorefrontProductStatus, string> = {
  available: 'Available',
  comingSoon: 'Coming soon',
  outOfStock: 'Out of stock',
  sale: 'Sale',
  limitedEdition: 'Limited',
}

export const Route = createFileRoute('/shop/')({
  validateSearch: validateShopUrlSearch,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    const [{ items, drops }, seoDoc, siteSeo, projection] = await Promise.all([
      runtimeClients.commerce.getShopListingCatalog(),
      runtimeClients.seo.getSeoByPath('/shop'),
      runtimeClients.seo.getSiteSeo(),
      loadStorefrontProjection(),
    ])
    const pageAssets = resolveStorefrontPageAssets(
      projection.assets,
      'shop',
      projection.mediaIndex,
    )
    return {
      drops,
      filtered: sortShopListingProducts(
        filterShopListingProducts(items, deps.search),
        deps.search.sort,
      ),
      priceBounds: catalogPriceBounds(items),
      colors: uniqueColorwayNames(items),
      sizes: uniqueSizeLabels(items),
      heroBg: pageAssets.heroImage?.trim() || SHOP_HERO_BG_FALLBACK,
      seoDoc,
      siteSeo,
    }
  },
  head: ({ loaderData }) => {
    const site = loaderData?.siteSeo
    const doc = loaderData?.seoDoc
    if (site && doc) {
      return buildSeoHeadForSiteStaticPath('/shop', doc, site)
    }
    return buildSeoMeta({
      title: loaderData?.seoDoc?.title ?? 'Shop | ANVL Athletics',
      description:
        loaderData?.seoDoc?.description ??
        'Browse ANVL Athletics premium gymwear — filters, search, and drop releases.',
      path: '/shop',
      image: loaderData?.seoDoc?.ogImage,
      ogTitle: loaderData?.seoDoc?.ogTitle,
      ogDescription: loaderData?.seoDoc?.ogDescription,
    })
  },
  component: ShopPage,
  pendingComponent: ShopPagePending,
})

function ShopPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/shop/' })
  const { drops, filtered, priceBounds, colors, sizes, heroBg } =
    Route.useLoaderData()
  const deferredFiltered = useDeferredValue(filtered)
  const [draftQuery, setDraftQuery] = useState(search.q)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    setDraftQuery(search.q)
  }, [search.q])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = draftQuery.trim()
      if (next === search.q.trim()) return
      navigate({
        search: (prev) => ({ ...prev, q: draftQuery }),
        replace: true,
      })
    }, 350)
    return () => window.clearTimeout(handle)
  }, [draftQuery, navigate, search.q])

  const patchSearch = (patch: Partial<typeof search>) => {
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true })
  }

  const resetSearch = () => {
    navigate({ search: defaultShopUrlSearch, replace: true })
    setDraftQuery('')
  }

  const filterProps = useMemo(
    () => ({
      drops,
      colors,
      sizes,
      priceBounds,
      search,
      onPatch: patchSearch,
      onReset: resetSearch,
    }),
    [drops, colors, sizes, priceBounds, search],
  )

  const desktopFilters = <ShopFiltersForm {...filterProps} />
  const mobileFilters = <ShopFiltersForm {...filterProps} />

  const count = deferredFiltered.length

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = []
    if (search.q.trim()) {
      chips.push({
        key: 'q',
        label: `“${search.q.trim()}”`,
        onRemove: () => {
          setDraftQuery('')
          patchSearch({ q: '' })
        },
      })
    }
    const statuses = search.status
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean) as StorefrontProductStatus[]
    for (const s of statuses) {
      chips.push({
        key: `status:${s}`,
        label: STATUS_CHIP_LABELS[s] ?? s,
        onRemove: () => patchSearch({ status: statuses.filter((x) => x !== s).join(',') }),
      })
    }
    if (search.drop.trim()) {
      const drop = drops.find((d) => d.slug === search.drop)
      chips.push({
        key: 'drop',
        label: drop ? `${drop.dropNumber}: ${drop.name}` : search.drop,
        onRemove: () => patchSearch({ drop: '' }),
      })
    }
    if (search.source !== 'all') {
      chips.push({
        key: 'source',
        label: search.source === 'drop' ? 'Drop release' : 'Individual',
        onRemove: () => patchSearch({ source: 'all' }),
      })
    }
    if (search.color.trim()) {
      chips.push({ key: 'color', label: search.color, onRemove: () => patchSearch({ color: '' }) })
    }
    if (search.size.trim()) {
      chips.push({
        key: 'size',
        label: `Size ${search.size}`,
        onRemove: () => patchSearch({ size: '' }),
      })
    }
    if (typeof search.minPrice === 'number') {
      chips.push({
        key: 'minPrice',
        label: `Min $${search.minPrice}`,
        onRemove: () => patchSearch({ minPrice: undefined }),
      })
    }
    if (typeof search.maxPrice === 'number') {
      chips.push({
        key: 'maxPrice',
        label: `Max $${search.maxPrice}`,
        onRemove: () => patchSearch({ maxPrice: undefined }),
      })
    }
    return chips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, drops])

  return (
    <>
      {/* Forge hero. */}
      <section className="relative overflow-hidden border-b border-[var(--color-line)]">
        <ForgeAtmosphere />
        {/* Cinematic armory plate above the embers; silent if not yet uploaded. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
          style={{ backgroundImage: `url('${heroBg}')` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(100deg, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 78%, transparent) 42%, color-mix(in srgb, var(--color-bg) 24%, transparent) 100%)',
          }}
        />
        <Container className="relative z-10 py-16 md:py-24">
          <p className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.32em] text-[var(--color-highlight-bright)] before:h-px before:w-8 before:bg-[var(--color-highlight)] before:content-['']">
            Drop 01 — The Oath
          </p>
          <h1 className="anvl-heading mt-5 max-w-3xl font-normal leading-[0.88] tracking-[-0.01em] text-[clamp(2.75rem,9vw,6.5rem)] text-[var(--color-heading)]">
            The Armory
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg">
            Premium bodybuilding gymwear forged for disciplined lifters. Choose your pieces — filter
            by drop, size, and availability.
          </p>
          <div className="anvl-display mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] tracking-[0.28em] text-[var(--color-text-muted)]">
            <span className="text-[var(--color-highlight-bright)]">DR-01</span>
            <span>Forged in Lebanon</span>
            <span>Beirut · LB</span>
          </div>
        </Container>
      </section>

      <Section className="pt-0">
        <Container className="pb-[var(--anvl-section-py,4rem)]">
          {/* Armory toolbar — count + sort + search + mobile filter toggle. */}
          <div className="mb-6 flex flex-col gap-4 border-b border-[var(--color-line)] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <p
              aria-live="polite"
              className="anvl-display text-sm tracking-[0.18em] text-[var(--color-text)]"
            >
              <span className="text-[var(--color-highlight-bright)]">{String(count).padStart(2, '0')}</span>{' '}
              {count === 1 ? 'piece' : 'pieces'}
              <span className="ml-3 text-[var(--color-text-muted)]">in the armory</span>
            </p>
            <div className="flex w-full flex-wrap gap-3 sm:w-auto">
              <label htmlFor="shop-sort" className="sr-only">
                Sort pieces
              </label>
              <select
                id="shop-sort"
                className="focus-ring shrink-0 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-2 text-sm"
                value={search.sort}
                onChange={(e) => patchSearch({ sort: e.target.value as typeof search.sort })}
              >
                {SHOP_SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <Input
                id="shop-search"
                type="search"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                placeholder="Search name, color, category…"
                className="min-w-0 flex-1 sm:w-64 sm:flex-none"
                autoComplete="off"
                aria-label="Search the armory"
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 lg:hidden"
                onClick={() => setFiltersOpen(true)}
              >
                Filters
              </Button>
            </div>
          </div>

          {/* Active filter chips — surface what's narrowing the armory. */}
          {activeChips.length > 0 ? (
            <div className="mb-8 flex flex-wrap items-center gap-2">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={chip.onRemove}
                  className="focus-ring group inline-flex items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] py-1.5 pl-3 pr-2 text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-highlight)] hover:text-[var(--color-highlight-bright)]"
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <span className="max-w-[14rem] truncate">{chip.label}</span>
                  <X size={13} aria-hidden="true" className="opacity-70 group-hover:opacity-100" />
                </button>
              ))}
              <button
                type="button"
                onClick={resetSearch}
                className="focus-ring anvl-micro ml-1 rounded-full px-2 py-1.5 text-[var(--color-text-muted)] underline-offset-4 transition-colors hover:text-[var(--color-highlight-bright)] hover:underline"
              >
                Clear all
              </button>
            </div>
          ) : null}

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <aside className="hidden w-full max-w-xs shrink-0 lg:block">
              <div className="sticky top-[calc(var(--anvl-header-h)+1.5rem)] rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                <p className="anvl-display inline-flex items-center gap-2 text-[11px] tracking-[0.26em] text-[var(--color-highlight-bright)] before:h-px before:w-5 before:bg-[var(--color-highlight)] before:content-['']">
                  Refine the armory
                </p>
                <hr className="anvl-highlight-rule my-4" />
                {desktopFilters}
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              {count === 0 ? (
                <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-10 text-center">
                  <p className="anvl-display text-sm tracking-[0.2em] text-[var(--color-highlight-bright)]">
                    The armory is empty
                  </p>
                  <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                    No pieces match these filters. Try clearing status or price limits.
                  </p>
                  <Button type="button" variant="secondary" className="mt-6" onClick={resetSearch}>
                    Reset filters
                  </Button>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {deferredFiltered.map((product: Product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>

        <Drawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title="Filters"
          placement="bottom"
          aria-label="Shop filters"
        >
          {mobileFilters}
        </Drawer>
      </Section>
    </>
  )
}

/** Loader-pending skeleton — keeps the armory's shape during navigation. */
function ShopPagePending() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--color-line)]">
        <ForgeAtmosphere />
        <Container className="relative z-10 py-16 md:py-24">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-5 h-20 w-72 max-w-full md:h-28 md:w-[28rem]" />
          <Skeleton className="mt-6 h-4 w-full max-w-2xl" />
          <Skeleton className="mt-2 h-4 w-2/3 max-w-xl" />
        </Container>
      </section>

      <Section className="pt-0">
        <Container className="pb-[var(--anvl-section-py,4rem)]">
          <div className="mb-8 flex items-center justify-between border-b border-[var(--color-line)] pb-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-56" />
          </div>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <aside className="hidden w-full max-w-xs shrink-0 lg:block">
              <Skeleton className="h-96 w-full rounded-lg" />
            </aside>
            <div className="min-w-0 flex-1">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-4">
                    <Skeleton className="aspect-[3/4] w-full" />
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
