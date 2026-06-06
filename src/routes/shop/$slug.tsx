import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import {
  effectivePrice,
  getAdminProductBySlug,
  variantIsPurchasable,
} from '@/features/products/catalog/storefrontCatalog'
import { useCart } from '@/features/cart/hooks/useCart'
import { useProductAnalytics } from '@/features/analytics/hooks/useProductAnalytics'
import { useTrackProductView } from '@/features/products/hooks/useTrackProductView'
import { extractYoutubeVideoId } from '@/features/products/pdp/videoEmbed'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'
import type { Product } from '@/features/products/types/product.types'
import { JsonLd } from '@/shared/components/seo/JsonLd'
import { breadcrumbJsonLd, productJsonLd } from '@/shared/components/seo/structuredData'
import {
  AccordionDisclosure,
  Button,
  ColorSwatch,
  Container,
  ProductCard,
  ProductGallery,
  QuantityStepper,
  SafeLink,
  Section,
  SizeSelector,
} from '@/shared/components/ui'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import { RevealOnScroll } from '@/shared/components/motion/RevealOnScroll'

function colorHasNoStock(product: Product, colorName: string): boolean {
  const m = product.shop?.availabilityByColorAndSize[colorName]
  if (!m) return false
  return !Object.values(m).some((n) => n > 0)
}

function disabledSizesForColor(product: Product, colorName: string): ReadonlySet<string> {
  const out = new Set<string>()
  const m = product.shop?.availabilityByColorAndSize[colorName]
  if (m) {
    for (const [label, n] of Object.entries(m)) {
      if (n <= 0) out.add(label)
    }
  }
  return out
}

export const Route = createFileRoute('/shop/$slug')({
  loader: async ({ params }) => {
    const product = await runtimeClients.commerce.getProductBySlug(params.slug)
    const adminProduct = getAdminProductBySlug(params.slug)
    if (!product || !adminProduct) throw notFound()
    const related = await runtimeClients.commerce.getRelatedProducts(params.slug)
    return { product, adminProduct, related }
  },
  head: ({ loaderData }) =>
    buildSeoMeta({
      title:
        loaderData?.adminProduct.seo.title ??
        `${loaderData?.product.name ?? 'Product'} | ANVL Athletics`,
      description:
        loaderData?.adminProduct.seo.description ??
        loaderData?.product.storytelling ??
        'ANVL Athletics product details',
      path: `/shop/${loaderData?.product.slug ?? ''}`,
      image: loaderData?.adminProduct.seo.ogImage,
    }),
  component: ProductPage,
})

function ProductPage() {
  const { product, adminProduct, related } = Route.useLoaderData()
  const [colorwayIndex, setColorwayIndex] = useState(0)
  const [size, setSize] = useState(product.sizes[0] ?? 'M')
  const [quantity, setQuantity] = useState(1)
  const { addLine } = useCart()
  const { trackAddToCart } = useProductAnalytics()

  useTrackProductView(product)

  const colorway = product.colorways[colorwayIndex] ?? product.colorways[0]
  const displayPrice = effectivePrice(adminProduct)
  const galleryImages = useMemo(() => {
    const byColor = colorway
      ? product.shop?.imagesByColorName[colorway.name]
      : undefined
    return byColor && byColor.length > 0 ? byColor : product.images
  }, [colorway, product.images, product.shop?.imagesByColorName])

  const disabledSizes = useMemo(
    () => disabledSizesForColor(product, colorway?.name ?? ''),
    [colorway, product],
  )

  useEffect(() => {
    if (!disabledSizes.has(size)) return
    const next = product.sizes.find((s) => !disabledSizes.has(s))
    if (next) setSize(next)
  }, [disabledSizes, product.sizes, size])

  const canPurchaseVariant = variantIsPurchasable(
    adminProduct,
    colorwayIndex,
    size,
  )
  const canPurchase = canPurchaseVariant

  const statusNote =
    adminProduct.status === 'comingSoon'
      ? 'Coming soon — not available for purchase yet.'
      : adminProduct.status === 'outOfStock'
        ? 'Currently out of stock online.'
        : null

  const saleActive =
    adminProduct.isOnSale &&
    typeof adminProduct.compareAtPrice === 'number' &&
    adminProduct.compareAtPrice > displayPrice

  const yt = extractYoutubeVideoId(adminProduct.videoUrl)
  const modelUrl = adminProduct.model3dUrl?.trim()

  const heroImageSrc = galleryImages[0]?.src ?? product.images[0]?.src ?? ''

  return (
    <Section>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Shop', path: '/shop' },
          { name: product.name, path: `/shop/${product.slug}` },
        ])}
      />
      <Container>
        <nav aria-label="Breadcrumb" className="anvl-micro mb-6 flex gap-2 text-xs">
          <Link to="/">Home</Link> /{' '}
          <Link to="/shop" search={defaultShopUrlSearch}>
            Shop
          </Link>{' '}
          / <span>{product.name}</span>
        </nav>
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery product={product} images={galleryImages} />
          <article className="space-y-6">
            <p className="anvl-display inline-flex items-center gap-2 text-[11px] tracking-[0.28em] text-[var(--color-ember-bright)] before:h-px before:w-6 before:bg-[var(--color-ember)] before:content-['']">
              {product.dropName}
            </p>
            <h1 className="anvl-heading text-4xl font-normal leading-[0.92] sm:text-5xl md:text-6xl">
              {product.name}
            </h1>
            <hr className="anvl-ember-rule max-w-[7rem]" />
            <p className="anvl-micro text-[var(--color-text-muted)]">{product.role}</p>
            <div className="flex flex-wrap items-baseline gap-3">
              {saleActive ? (
                <>
                  <p className="anvl-heading text-3xl font-normal text-[var(--color-accent)]">
                    ${displayPrice}
                  </p>
                  <p className="text-lg text-[var(--color-text-muted)] line-through">
                    ${adminProduct.compareAtPrice}
                  </p>
                  {adminProduct.saleLabel ? (
                    <span className="rounded-full border border-[var(--color-line)] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[var(--color-heading)]">
                      {adminProduct.saleLabel}
                    </span>
                  ) : null}
                </>
              ) : (
                <p className="anvl-heading text-3xl font-normal">${displayPrice}</p>
              )}
            </div>
            {adminProduct.status === 'sale' && !saleActive ? (
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]">
                Sale
              </p>
            ) : null}
            {statusNote ? (
              <p className="text-sm text-[var(--color-text-muted)]">{statusNote}</p>
            ) : null}

            {yt ? (
              <div className="overflow-hidden rounded-xl border border-[var(--color-line)]">
                <div className="aspect-video w-full bg-black">
                  <iframe
                    title={`${product.name} video`}
                    className="h-full w-full"
                    src={`https://www.youtube-nocookie.com/embed/${yt}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            ) : null}

            {modelUrl ? (
              <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm">
                <p className="anvl-micro mb-1">3D / AR</p>
                <p className="text-[var(--color-text-muted)]">
                  Interactive model preview is coming soon.{' '}
                  <SafeLink
                    href={modelUrl}
                    forceExternal
                    className="focus-ring text-[var(--color-accent)] underline"
                  >
                    Open model link
                  </SafeLink>
                </p>
              </div>
            ) : null}

            <div>
              <p className="anvl-micro mb-2">Colorway</p>
              <div className="flex flex-wrap items-center gap-2">
                {product.colorways.map((item, index) => (
                  <ColorSwatch
                    key={item.name}
                    color={item.base}
                    active={index === colorwayIndex}
                    label={item.name}
                    unavailable={colorHasNoStock(product, item.name)}
                    onClick={() => setColorwayIndex(index)}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{colorway.name}</p>
            </div>

            <div>
              <p className="anvl-micro mb-2">Size</p>
              <SizeSelector
                sizes={product.sizes}
                value={size}
                disabledSizes={disabledSizes}
                onChange={setSize}
              />
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                {canPurchase ? 'In stock for this combination.' : 'Not available in this size.'}
              </p>
            </div>

            <div>
              <p className="anvl-micro mb-2">Quantity</p>
              <QuantityStepper value={quantity} onChange={setQuantity} />
            </div>

            <Button
              className="w-full"
              disabled={!canPurchase}
              onClick={() => {
                addLine({
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: displayPrice,
                  colorway: colorway.name,
                  size,
                  quantity,
                  image: heroImageSrc,
                })
                trackAddToCart(product, quantity)
              }}
            >
              {canPurchase ? 'Add to Cart' : 'Unavailable'}
            </Button>

            <div className="space-y-2">
              <AccordionDisclosure title="Material">
                <p>{product.fabric || 'Fabric details will be listed here.'}</p>
              </AccordionDisclosure>
              <AccordionDisclosure title="Fit">
                <p>{product.fit || 'Fit notes will be listed here.'}</p>
              </AccordionDisclosure>
              <AccordionDisclosure title="Care">
                <p>
                  {product.careInstructions.length > 0
                    ? product.careInstructions.join(' ')
                    : 'Follow garment label instructions.'}
                </p>
              </AccordionDisclosure>
              <AccordionDisclosure title="Shipping">
                <p>
                  Domestic orders ship from Lebanon-first fulfillment partners. Tracking is sent
                  when your label is generated.
                </p>
              </AccordionDisclosure>
              <AccordionDisclosure title="Returns">
                <p>
                  Unused items in original condition may be returned within the policy window.
                  Final sale pieces are marked at checkout when applicable.
                </p>
              </AccordionDisclosure>
            </div>

            <Link to="/size-guide" className="text-sm underline">
              Size Guide
            </Link>
          </article>
        </div>

        {product.storytelling || product.designDetails.length > 0 ? (
          <section className="relative mt-16 overflow-hidden rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-8 md:p-12">
            <GrainOverlay />
            <div className="relative z-10 grid gap-10 md:grid-cols-[1.15fr_1fr]">
              {product.storytelling ? (
                <div>
                  <p className="anvl-display text-[11px] tracking-[0.28em] text-[var(--color-ember-bright)]">
                    The piece
                  </p>
                  <p className="anvl-heading mt-4 max-w-2xl text-2xl font-normal leading-snug md:text-3xl">
                    {product.storytelling}
                  </p>
                </div>
              ) : (
                <div />
              )}
              {product.designDetails.length > 0 ? (
                <div>
                  <p className="anvl-display text-[11px] tracking-[0.28em] text-[var(--color-text-muted)]">
                    Forged details
                  </p>
                  <ul className="mt-5 space-y-3">
                    {product.designDetails.map((detail, i) => (
                      <li key={detail} className="flex gap-3 text-sm text-[var(--color-text-muted)]">
                        <span className="anvl-display shrink-0 text-[var(--color-ember-bright)]">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                  {product.gsm ? (
                    <p className="anvl-micro mt-6 border-t border-[var(--color-line)] pt-4 text-[var(--color-text-muted)]">
                      {product.gsm}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        <div className="mt-16">
          <h2 className="anvl-heading text-[clamp(2rem,5vw,3.5rem)] font-normal">
            Related Products
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <RevealOnScroll key={item.id}>
                <ProductCard product={item} />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </Container>
      {/*
        Spacer beneath the article so the mobile sticky purchase bar
        (below) never covers related products / accordion / footer.
        Roughly matches the bar height + safe-area inset (RESP-02).
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none h-[calc(64px+env(safe-area-inset-bottom,0px))] lg:hidden"
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--color-line)] bg-[rgba(11,11,12,0.95)] px-3 pt-3 pb-[max(env(safe-area-inset-bottom,0px),12px)] lg:hidden"
      >
        <Container className="flex items-center justify-between gap-3">
          <p className="anvl-heading min-w-0 truncate text-2xl">{product.name}</p>
          <Button
            disabled={!canPurchase}
            onClick={() => {
              addLine({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                price: displayPrice,
                colorway: colorway.name,
                size,
                quantity: 1,
                image: heroImageSrc,
              })
              trackAddToCart(product, 1)
            }}
          >
            {canPurchase ? 'Add' : '—'}
          </Button>
        </Container>
      </div>
    </Section>
  )
}
