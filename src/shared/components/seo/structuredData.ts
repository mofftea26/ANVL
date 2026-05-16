import { BRAND } from '@/shared/constants/brand'
import type { Product } from '@/features/products/types/product.types'

function absoluteImageUrl(src: string): string {
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  return `${BRAND.canonicalBaseUrl}${src.startsWith('/') ? '' : '/'}${src}`
}

function productOfferAvailability(product: Product): string {
  const shop = product.shop
  const anyInStock =
    shop &&
    Object.values(shop.availabilityByColorAndSize).some((row) =>
      Object.values(row).some((n) => n > 0),
    )
  const status = shop?.storefrontStatus
  if (status === 'comingSoon') return 'https://schema.org/PreOrder'
  if (status === 'outOfStock' || (shop && !anyInStock)) {
    return 'https://schema.org/OutOfStock'
  }
  return 'https://schema.org/InStock'
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BRAND.name,
    url: BRAND.canonicalBaseUrl,
    slogan: BRAND.tagline,
    logo: {
      '@type': 'ImageObject',
      url: `${BRAND.canonicalBaseUrl}/brand/logo-stacked-dark.png`,
      contentUrl: `${BRAND.canonicalBaseUrl}/brand/stacked.svg`,
    },
    image: `${BRAND.canonicalBaseUrl}/brand/og-default.svg`,
  }
}

export function productJsonLd(product: Product) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${BRAND.shortMark} ${product.name}`,
    description: product.storytelling,
    image: product.images.map((item) => absoluteImageUrl(item.src)),
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: BRAND.name,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: product.shop?.currency ?? 'USD',
      price: product.price.toFixed(2),
      availability: productOfferAvailability(product),
      url: `${BRAND.canonicalBaseUrl}/shop/${product.slug}`,
    },
  }
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${BRAND.canonicalBaseUrl}${item.path}`,
    })),
  }
}
