import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { buildSeoHeadForSiteStaticPath } from '@/features/cms/seoMeta'
import { runtimeClients } from '@/app/config/runtime'
import { loadStorefrontProjection } from '@/features/cms/api/loadStorefrontProjection'
import { resolveStorefrontPageAssets } from '@/features/cms/assets/resolvePublishedAssets'
import { ShopPage } from '@/features/products/shop/ShopPage'
import {
  catalogPriceBounds,
  uniqueCategories,
  uniqueColorwaySwatches,
  uniqueSizeLabels,
  validateShopUrlSearch,
  type ShopUrlSearch,
} from '@/features/products/shop/shopUrlSearch'
import { Container, Section, Skeleton } from '@/shared/components/ui'
import { ForgeAtmosphere } from '@/shared/components/premium/ForgeAtmosphere'

/**
 * Cinematic armory backdrop fallback for the shop hero. Applied as a CSS
 * background so a not-yet-uploaded file fails silently; the CMS
 * `Shop → Hero backdrop` slot overrides it.
 */
const SHOP_HERO_BG_FALLBACK = '/shop/armory-hero.webp'

/**
 * Default forged-steel card material (generated with Higgsfield). Renders behind
 * the product image on the forged card, so it only shows around contain-fit or
 * placeholder media and never muddies cover photos. The CMS
 * `Shop → Product-card material` slot overrides it.
 */
const SHOP_CARD_TEXTURE_FALLBACK = '/shop/card-forge.webp'

export const Route = createFileRoute('/shop/')({
  validateSearch: validateShopUrlSearch,
  // Filtering/sorting are client-side from the full catalog — the loader does
  // NOT depend on search params, so changing a filter never refetches.
  loader: async () => {
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
      items,
      drops,
      categories: uniqueCategories(items),
      colorways: uniqueColorwaySwatches(items),
      sizes: uniqueSizeLabels(items),
      priceBounds: catalogPriceBounds(items),
      heroBg: pageAssets.heroImage?.trim() || SHOP_HERO_BG_FALLBACK,
      cardTexture: pageAssets.cardTexture?.trim() || SHOP_CARD_TEXTURE_FALLBACK,
      cardEmptyImage: pageAssets.cardEmptyImage?.trim() || undefined,
      emptyStateImage: pageAssets.emptyStateImage?.trim() || undefined,
      // CMS social-share image for /shop (Open Graph), falling back to the SEO doc.
      ogImage: pageAssets.ogImage?.trim() || seoDoc?.ogImage,
      shopConfig: projection.shopConfig,
      seoDoc,
      siteSeo,
    }
  },
  head: ({ loaderData }) => {
    const site = loaderData?.siteSeo
    const doc = loaderData?.seoDoc
    // CMS `Shop → Social share image` slot wins over the SEO doc's ogImage.
    const ogImage = loaderData?.ogImage
    if (site && doc) {
      return buildSeoHeadForSiteStaticPath(
        '/shop',
        ogImage ? { ...doc, ogImage } : doc,
        site,
      )
    }
    return buildSeoMeta({
      title: loaderData?.seoDoc?.title ?? 'Shop | ANVL Athletics',
      description:
        loaderData?.seoDoc?.description ??
        'Browse ANVL Athletics premium gymwear — filters, search, and drop releases.',
      path: '/shop',
      image: ogImage ?? loaderData?.seoDoc?.ogImage,
      ogTitle: loaderData?.seoDoc?.ogTitle,
      ogDescription: loaderData?.seoDoc?.ogDescription,
    })
  },
  component: ShopRoute,
  pendingComponent: ShopRoutePending,
})

function ShopRoute() {
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/shop/' })
  const data = Route.useLoaderData()

  const onNavigate = (
    updater: (prev: ShopUrlSearch) => ShopUrlSearch,
    opts?: { replace?: boolean },
  ) => {
    navigate({ search: (prev) => updater(prev as ShopUrlSearch), replace: opts?.replace })
  }

  return <ShopPage {...data} search={search} onNavigate={onNavigate} />
}

/** Loader-pending skeleton — keeps the armory's shape during navigation. */
function ShopRoutePending() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--shop-card-border)]">
        <ForgeAtmosphere />
        <Container className="relative z-10 py-14 md:py-20">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-5 h-20 w-72 max-w-full md:h-28 md:w-[28rem]" />
          <Skeleton className="mt-6 h-4 w-full max-w-2xl" />
        </Container>
      </section>
      <Section className="pt-0">
        <Container className="pb-[var(--anvl-section-py,4rem)]">
          <div className="mb-8 flex items-center justify-between border-b border-[var(--shop-card-border)] py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <aside className="hidden w-full max-w-[16rem] shrink-0 lg:block">
              <Skeleton className="h-96 w-full rounded-xl" />
            </aside>
            <div className="min-w-0 flex-1">
              <ProductGridSkeletonFallback />
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}

/** Default-config skeleton grid (config isn't loaded yet during pending). */
function ProductGridSkeletonFallback() {
  // A lightweight static grid; real density applies once loaded.
  return (
    <div className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3.5">
          <Skeleton className="aspect-[3/4] w-full rounded-xl" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
  )
}
