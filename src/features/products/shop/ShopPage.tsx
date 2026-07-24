import { Suspense, lazy, useMemo, useState } from 'react'
import { Container, Section } from '@/shared/components/ui'
import { ForgeAtmosphere } from '@/shared/components/premium/ForgeAtmosphere'
import type { ShopConfig } from '@/features/cms/shop/shopExperience.zod'
import type { Product, ShopDropFilterOption } from '@/features/products/types/product.types'
import {
  computeShopFacetCounts,
  filterShopListingProducts,
  sortShopListingProducts,
  type ColorwaySwatch,
  type ShopUrlSearch,
} from '@/features/products/shop/shopUrlSearch'
import { usePreviewTargetProps } from '@/features/cms/preview'
import { useShopConfig } from '@/features/products/shop/hooks/useShopConfig'
import { useShopFilters } from '@/features/products/shop/hooks/useShopFilters'
import { ShopIntro } from '@/features/products/shop/ShopIntro'
import { ShopEditorialBanner } from '@/features/products/shop/ShopEditorialBanner'
import { ShopToolbar } from '@/features/products/shop/ShopToolbar'
import { ActiveFilterList } from '@/features/products/shop/ActiveFilterList'
import { ShopFilterRail } from '@/features/products/shop/ShopFilterRail'
import { ShopFilterDrawer } from '@/features/products/shop/ShopFilterDrawer'
import { ProductGrid } from '@/features/products/shop/ProductGrid'
import { ShopEmptyState, ShopNoResults } from '@/features/products/shop/ShopStates'
import { ShopResultAnnouncement } from '@/features/products/shop/ShopResultAnnouncement'
import type { ShopFilterPanelProps } from '@/features/products/shop/ShopFilterPanel'

// Quick view is interaction-only — keep its code (and the dialog primitives it
// pulls) out of the initial shop chunk.
const ProductQuickView = lazy(() =>
  import('@/features/products/components/ProductQuickView').then((m) => ({
    default: m.ProductQuickView,
  })),
)

export type ShopPageData = {
  items: Product[]
  drops: ShopDropFilterOption[]
  categories: string[]
  fits: string[]
  colorways: ColorwaySwatch[]
  sizes: string[]
  priceBounds: { min: number; max: number }
  heroBg: string
  cardTexture?: string
  cardEmptyImage?: string
  emptyStateImage?: string
  shopConfig: ShopConfig
}

export type ShopPageProps = ShopPageData & {
  search: ShopUrlSearch
  onNavigate: (
    updater: (prev: ShopUrlSearch) => ShopUrlSearch,
    opts?: { replace?: boolean },
  ) => void
}

/**
 * Storefront shop experience shell. Owns the derived (client-side, instant)
 * product list, faceted counts, filter UI, and quick-view orchestration. The
 * route stays thin — it only supplies loader data + the navigate adapter.
 */
export function ShopPage({
  items,
  drops,
  categories,
  fits,
  colorways,
  sizes,
  priceBounds,
  heroBg,
  cardTexture,
  cardEmptyImage,
  emptyStateImage,
  shopConfig: initialConfig,
  search,
  onNavigate,
}: ShopPageProps) {
  const config = useShopConfig(initialConfig)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null)

  // Admin live-preview rings: shop editor fields highlight their surface.
  const heroPreviewTarget = usePreviewTargetProps('content-field', 'shop:hero')
  const toolbarPreviewTarget = usePreviewTargetProps('content-field', 'shop:toolbar')
  const gridPreviewTarget = usePreviewTargetProps('content-field', 'shop:grid')

  const effectiveSort = search.sort ?? config.defaultSort

  const filtered = useMemo(
    () => sortShopListingProducts(filterShopListingProducts(items, search), effectiveSort),
    [items, search, effectiveSort],
  )
  const counts = useMemo(() => computeShopFacetCounts(items, search), [items, search])

  const { draftQuery, setDraftQuery, patchSearch, resetSearch, activeChips, activeFilterCount } =
    useShopFilters({ search, onNavigate, facets: { drops } })

  const panelProps: ShopFilterPanelProps = {
    search,
    onPatch: patchSearch,
    onReset: resetSearch,
    facets: { drops, categories, fits, colorways, sizes, priceBounds },
    counts,
    filterOrder: config.filterOrder,
    filterVisibility: config.filterVisibility,
  }

  const count = filtered.length
  const catalogEmpty = items.length === 0

  return (
    <>
      {/* Hero shell — ONE continuous backdrop from the top of the hero down
          BEHIND the toolbar, ending at the separator under the sort controls.
          The grid below sits on the plain page background. */}
      <section className="relative overflow-hidden border-b border-[var(--shop-card-border)]">
        {config.heroVisible ? (
          <>
            <ForgeAtmosphere />
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
                  'linear-gradient(100deg, var(--shop-bg) 0%, color-mix(in srgb, var(--shop-bg) 78%, transparent) 42%, color-mix(in srgb, var(--shop-bg) 24%, transparent) 100%)',
              }}
            />
            {/* Stronger scrim behind the toolbar zone so search/sort controls
                keep AA contrast over the image. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-32"
              style={{
                background:
                  'linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--shop-bg) 68%, transparent) 55%, color-mix(in srgb, var(--shop-bg) 92%, transparent) 100%)',
              }}
            />
          </>
        ) : null}

        <Container className="relative z-10">
          <div {...heroPreviewTarget}>
            <ShopIntro config={config} count={items.length} />
          </div>
          <div className={config.heroVisible ? 'mt-6 md:mt-8' : 'mt-5'} {...toolbarPreviewTarget}>
            <ShopToolbar
              count={count}
              query={draftQuery}
              onQueryChange={setDraftQuery}
              sort={effectiveSort}
              enabledSorts={config.enabledSortOptions}
              onSortChange={(next) => patchSearch({ sort: next })}
              activeFilterCount={activeFilterCount}
              onOpenFilters={() => setFiltersOpen(true)}
            />
          </div>
        </Container>
      </section>

      <Section className="pt-0 md:pt-0">
        <Container className="pb-[var(--anvl-section-py,4rem)] pt-4 md:pt-5">
          <ShopResultAnnouncement count={count} />

          {activeChips.length > 0 ? (
            <div className="mb-6">
              <ActiveFilterList chips={activeChips} onClearAll={resetSearch} />
            </div>
          ) : null}

          {config.editorialBanner.visible && config.editorialBanner.title ? (
            <ShopEditorialBanner
              eyebrow={config.eyebrow}
              title={config.editorialBanner.title}
              body={config.editorialBanner.body}
            />
          ) : null}

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <ShopFilterRail sticky={config.stickyFilters} {...panelProps} />

            <div className="min-w-0 flex-1" {...gridPreviewTarget}>
              {catalogEmpty ? (
                <ShopEmptyState
                  title={config.emptyState.title}
                  body={config.emptyState.body}
                  image={emptyStateImage}
                />
              ) : count === 0 ? (
                <ShopNoResults
                  title={config.noResults.title}
                  body={config.noResults.body}
                  image={emptyStateImage}
                  onClearAll={resetSearch}
                />
              ) : (
                <ProductGrid
                  products={filtered}
                  config={config}
                  cardTexture={cardTexture}
                  cardEmptyImage={cardEmptyImage}
                  onQuickView={config.quickViewEnabled ? setQuickViewProduct : undefined}
                />
              )}
            </div>
          </div>
        </Container>
      </Section>

      <ShopFilterDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        resultCount={count}
        panel={panelProps}
      />

      {quickViewProduct ? (
        <Suspense fallback={null}>
          <ProductQuickView
            product={quickViewProduct}
            open={Boolean(quickViewProduct)}
            onClose={() => setQuickViewProduct(null)}
          />
        </Suspense>
      ) : null}
    </>
  )
}
