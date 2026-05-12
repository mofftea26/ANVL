import { BRAND } from '@/shared/constants/brand'
import type { Product } from '@/features/products/types/product.types'

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
    image: product.images.map((item) => `${BRAND.canonicalBaseUrl}${item.src}`),
    sku: product.id,
    brand: {
      '@type': 'Brand',
      name: BRAND.name,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: product.price.toFixed(2),
      availability: 'https://schema.org/InStock',
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
