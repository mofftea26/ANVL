import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { BRAND } from '@/shared/constants/brand'
import { buildSeoMetaFromCmsSource, seoContentToMetaSource } from '@/features/cms/seoMeta'
import { runtimeClients } from '@/app/config/runtime'
import { ShopFiltersForm } from '@/features/products/shop/ShopFiltersForm'
import type { ShopUrlSearch } from '@/features/products/shop/shopUrlSearch'
import {
  catalogPriceBounds,
  defaultShopUrlSearch,
  filterShopListingProducts,
  uniqueColorwayNames,
  uniqueSizeLabels,
  validateShopUrlSearch,
} from '@/features/products/shop/shopUrlSearch'
import {
  Button,
  Container,
  Drawer,
  Input,
  ProductCard,
  Section,
} from '@/shared/components/ui'

export const Route = createFileRoute('/shop/')({
  validateSearch: validateShopUrlSearch,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    const [{ items, drops }, siteSeo, seoDoc] = await Promise.all([
      runtimeClients.commerce.getShopListingCatalog(),
      runtimeClients.cms.getSiteSeo(),
      runtimeClients.cms.getSeoByPath('/shop'),
    ])
    return {
      drops,
      filtered: filterShopListingProducts(items, deps.search),
      priceBounds: catalogPriceBounds(items),
      colors: uniqueColorwayNames(items),
      sizes: uniqueSizeLabels(items),
      siteSeo,
      seoDoc,
    }
  },
  head: ({ loaderData }) => {
    const site = loaderData?.siteSeo
    const doc = loaderData?.seoDoc
    const fb = { defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.svg` }
    if (!site || !doc) {
      return buildSeoMetaFromCmsSource(
        seoContentToMetaSource(
          {
            title: 'Shop | ANVL Athletics',
            description: 'Shop ANVL Athletics — premium gymwear forged under pressure.',
            canonicalPath: '/shop',
          },
          fb,
        ),
        fb,
      )
    }
    return buildSeoMetaFromCmsSource(
      seoContentToMetaSource(doc, site.globalDefaults),
      site.globalDefaults,
    )
  },
  component: ShopPage,
})

function ShopPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { drops, filtered, priceBounds, colors, sizes } = Route.useLoaderData()
  const [draftQuery, setDraftQuery] = useState(search.q)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    setDraftQuery(search.q)
  }, [search.q])

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (draftQuery !== search.q) {
        navigate({
          search: (prev) => ({ ...prev, q: draftQuery }),
          replace: true,
        })
      }
    }, 400)
    return () => window.clearTimeout(handle)
  }, [draftQuery, navigate, search.q])

  const patchSearch = (patch: Partial<ShopUrlSearch>) => {
    navigate({
      search: (prev) => ({ ...prev, ...patch }),
      replace: true,
    })
  }

  const resetSearch = () => {
    setDraftQuery('')
    navigate({ search: defaultShopUrlSearch, replace: true })
  }

  const filterProps = {
    drops,
    colors,
    sizes,
    priceMinBound: priceBounds.min,
    priceMaxBound: priceBounds.max,
    search,
    onPatchSearch: patchSearch,
    onReset: () => {
      resetSearch()
      setFiltersOpen(false)
    },
  }

  const desktopFilters = <ShopFiltersForm {...filterProps} idPrefix="shop-desktop" />
  const mobileFilters = <ShopFiltersForm {...filterProps} idPrefix="shop-mobile" />

  return (
    <Section>
      <Container>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="hidden w-full max-w-xs shrink-0 lg:block">{desktopFilters}</aside>

          <div className="min-w-0 flex-1 space-y-6">
            <header>
              <h1 className="anvl-heading text-6xl">Shop</h1>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {filtered.length} piece{filtered.length === 1 ? '' : 's'} match your filters.
              </p>
            </header>

            <div className="max-w-md space-y-3">
              <label className="anvl-micro block" htmlFor="shop-search">
                Search
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  id="shop-search"
                  className="sm:flex-1"
                  type="search"
                  value={draftQuery}
                  onChange={(e) => setDraftQuery(e.target.value)}
                  placeholder="Updates the URL after a short pause"
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

            {filtered.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                Nothing matches.{' '}
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    resetSearch()
                    setFiltersOpen(false)
                  }}
                >
                  Reset filters
                </button>
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((product) => (
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
        aria-label="Product filters"
        className="lg:hidden"
      >
        <div className="space-y-4">
          <h2 className="anvl-heading text-2xl">Filters</h2>
          {mobileFilters}
        </div>
      </Drawer>
    </Section>
  )
}
