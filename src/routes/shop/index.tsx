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
import { ForgeAtmosphere } from '@/shared/components/premium/ForgeAtmosphere'

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

  const count = deferredFiltered.length

  return (
    <>
      {/* Forge hero. */}
      <section className="relative overflow-hidden border-b border-[var(--color-line)]">
        <ForgeAtmosphere />
        <Container className="relative z-10 py-16 md:py-24">
          <p className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.32em] text-[var(--color-ember-bright)] before:h-px before:w-8 before:bg-[var(--color-ember)] before:content-['']">
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
            <span className="text-[var(--color-ember-bright)]">DR-01</span>
            <span>Forged in Lebanon</span>
            <span>Beirut · LB</span>
          </div>
        </Container>
      </section>

      <Section className="pt-0">
        <Container className="pb-[var(--anvl-section-py,4rem)]">
          {/* Armory toolbar — count + search + mobile filter toggle. */}
          <div className="mb-8 flex flex-col gap-4 border-b border-[var(--color-line)] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="anvl-display text-sm tracking-[0.18em] text-[var(--color-text)]">
              <span className="text-[var(--color-ember-bright)]">{String(count).padStart(2, '0')}</span>{' '}
              {count === 1 ? 'piece' : 'pieces'}
              <span className="ml-3 text-[var(--color-text-muted)]">in the armory</span>
            </p>
            <div className="flex w-full gap-3 sm:max-w-md">
              <Input
                id="shop-search"
                type="search"
                value={draftQuery}
                onChange={(e) => setDraftQuery(e.target.value)}
                placeholder="Search name, color, category…"
                className="min-w-0 flex-1"
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

          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <aside className="hidden w-full max-w-xs shrink-0 lg:block">
              <div className="sticky top-[calc(var(--anvl-header-h)+1.5rem)] rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                <p className="anvl-display inline-flex items-center gap-2 text-[11px] tracking-[0.26em] text-[var(--color-ember-bright)] before:h-px before:w-5 before:bg-[var(--color-ember)] before:content-['']">
                  Refine the armory
                </p>
                <hr className="anvl-ember-rule my-4" />
                {desktopFilters}
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              {count === 0 ? (
                <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-10 text-center">
                  <p className="anvl-display text-sm tracking-[0.2em] text-[var(--color-ember-bright)]">
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
