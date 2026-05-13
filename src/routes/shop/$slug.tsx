import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import {
  effectivePrice,
  variantIsPurchasable,
} from '@/features/admin/products/products.mapper'
import { getAdminProductBySlug } from '@/features/admin/products/products.service'
import { useCart } from '@/features/cart/hooks/useCart'
import { useProductAnalytics } from '@/features/analytics/hooks/useProductAnalytics'
import { useTrackProductView } from '@/features/products/hooks/useTrackProductView'
import { JsonLd } from '@/shared/components/seo/JsonLd'
import { breadcrumbJsonLd, productJsonLd } from '@/shared/components/seo/structuredData'
import {
  Button,
  ColorSwatch,
  Container,
  ProductCard,
  ProductGallery,
  QuantityStepper,
  Section,
  SizeSelector,
} from '@/shared/components/ui'

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
  const [size, setSize] = useState(product.sizes[0] ?? 'M')
  const [colorwayIndex, setColorwayIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const { addLine } = useCart()
  const { trackAddToCart } = useProductAnalytics()

  useTrackProductView(product)

  const colorway = product.colorways[colorwayIndex] ?? product.colorways[0]
  const displayPrice = effectivePrice(adminProduct)
  const canPurchase = variantIsPurchasable(adminProduct, colorwayIndex, size)

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
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <span>{product.name}</span>
        </nav>
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery product={product} />
          <article className="space-y-6">
            <h1 className="anvl-heading text-6xl">{product.name}</h1>
            <p className="text-sm text-[var(--color-text-muted)]">{product.dropName}</p>
            <div className="flex flex-wrap items-baseline gap-3">
              {saleActive ? (
                <>
                  <p className="text-2xl font-semibold text-[var(--color-accent)]">
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
                <p className="text-2xl font-semibold">${displayPrice}</p>
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

            <div>
              <p className="anvl-micro mb-2">Colorway</p>
              <div className="flex items-center gap-2">
                {product.colorways.map((item, index) => (
                  <ColorSwatch
                    key={item.name}
                    color={item.base}
                    active={index === colorwayIndex}
                    label={item.name}
                    onClick={() => setColorwayIndex(index)}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{colorway.name}</p>
            </div>

            <div>
              <p className="anvl-micro mb-2">Size</p>
              <SizeSelector sizes={product.sizes} value={size} onChange={setSize} />
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
                  image: product.images[0]?.src ?? '',
                })
                trackAddToCart(product, quantity)
              }}
            >
              {canPurchase ? 'Add to Cart' : 'Unavailable'}
            </Button>

            <div className="grid gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm">
              <p><strong>Fit:</strong> {product.fit}</p>
              <p><strong>Fabric:</strong> {product.fabric}</p>
              <p><strong>GSM:</strong> {product.gsm}</p>
              <p><strong>Design:</strong> {product.designDetails.join(', ')}</p>
              <p><strong>Care:</strong> {product.careInstructions.join(', ')}</p>
              <Link to="/size-guide" className="underline">
                Size Guide
              </Link>
            </div>
          </article>
        </div>

        <div className="mt-16">
          <h2 className="anvl-heading text-5xl">Related Products</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      </Container>
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--color-line)] bg-[rgba(11,11,12,0.95)] p-3 lg:hidden">
        <Container className="flex items-center justify-between">
          <p className="anvl-heading text-3xl">{product.name}</p>
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
                image: product.images[0]?.src ?? '',
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
