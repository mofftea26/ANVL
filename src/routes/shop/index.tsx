import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { buildSeoMeta } from '@/app/seo/meta'
import { buildSeoHeadForSiteStaticPath } from '@/features/cms/seoMeta'
import { runtimeClients } from '@/app/config/runtime'
import { ShopFiltersForm } from '@/features/products/shop/ShopFiltersForm'
import {
  catalogPriceBounds,
  defaultShopUrlSearch,
  filterShopListingProducts,
  uniqueColorwayNames,
  uniqueSizeLabels,
  validateShopUrlSearch,
} from '@/features/products/shop/shopUrlSearch'
import type { Product } from '@/features/products/types/product.types'
import {
  Button,
  Container,
  Drawer,
  Input,
  ProductCard,
  Section,
} from '@/shared/components/ui'
import { PageHero } from '@/shared/components/premium/PageHero'
import { BrandBadge } from '@/shared/components/premium/BrandBadge'

export const Route = createFileRoute('/shop/')({
  validateSearch: validateShopUrlSearch,
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ deps }) => {
    const [{ items, drops }, seoDoc, siteSeo] = await Promise.all([
      runtimeClients.commerce.getShopListingCatalog(),
      runtimeClients.seo.getSeoByPath('/shop'),
      runtimeClients.seo.getSiteSeo(),
    ])
    return {
      drops,
      filtered: filterShopListingProducts(items, deps.search),
      priceBounds: catalogPriceBounds(items),
      colors: uniqueColorwayNames(items),
      sizes: uniqueSizeLabels(items),
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
})

function ShopPage() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/shop/' })
  const { drops, filtered, priceBounds, colors, sizes } = Route.useLoaderData()
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

  return (
    <>
      <PageHero
        eyebrow="Catalog"
        title="Shop"
        intro="Premium bodybuilding gymwear forged for disciplined lifters. Filter by drop, size, and availability."
      />
      <Section className="pt-0">
      <Container className="pb-[var(--anvl-section-py,4rem)]">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <BrandBadge tone="accent">{`${deferredFiltered.length} pieces`}</BrandBadge>
        </div>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <aside className="hidden w-full max-w-xs shrink-0 lg:block">{desktopFilters}</aside>

          <div className="min-w-0 flex-1 space-y-6">
            <div className="max-w-md space-y-3">
              <label htmlFor="shop-search" className="anvl-micro block">
                Search
              </label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <Input
                  id="shop-search"
                  type="search"
                  value={draftQuery}
                  onChange={(e) => setDraftQuery(e.target.value)}
                  placeholder="Name, color, categoryΓÇª"
                  className="min-w-0 flex-1"
                  autoComplete="off"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 sm:max-w-[8rem] lg:hidden"
                  onClick={() => setFiltersOpen(true)}
                >
                  Filters
                </Button>
              </div>
            </div>

            {deferredFiltered.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">
                No products match these filters. Try clearing status or price limits.
              </p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
