import { dropSchema } from '@/features/drops/schemas/drop.schema'
import { catalogProductSchema } from '@/features/products/schemas/commerce.schema'
import { BRAND_COLORS } from '@/shared/constants/brand'

import type { Drop } from '@/features/drops/types/drop.types'
import type { CatalogProduct } from '@/features/products/types/commerce.types'
import type { MediaAsset } from '@/shared/types/media.types'

const nowIso = '2026-05-14T12:00:00.000Z'

function img(id: string, alt: string): MediaAsset {
  return {
    id,
    type: 'image',
    url: '/brand/placeholder-product.svg',
    alt,
  }
}

const dropId = 'drop-01-the-oath'

const oathPalette = {
  paletteName: 'The Oath — core ANVL',
  colors: {
    background: BRAND_COLORS.black,
    surface: BRAND_COLORS.darkSteelGrey,
    surfaceMuted: BRAND_COLORS.washedCharcoal,
    text: BRAND_COLORS.bone,
    textMuted: BRAND_COLORS.graphite,
    accent: BRAND_COLORS.bone,
    border: BRAND_COLORS.washedCharcoal,
    glow: BRAND_COLORS.graphite,
  },
  fonts: {
    heading: 'Bebas Neue',
    body: 'Manrope',
  },
} as const

const oathBranding = {
  campaignEmblem: img('drop-oath-emblem', 'ANVL Drop 01 The Oath campaign emblem'),
  loadingEmblem: img('drop-oath-loading', 'ANVL loading emblem for The Oath'),
} as const

const dropSeo = {
  metaTitle: 'ANVL Athletics — Drop 01: The Oath',
  metaDescription:
    'Forged Under Pressure. Drop 01 — The Oath introduces premium Lebanon-first gymwear.',
  canonicalUrl: '/drop/the-oath',
  ogTitle: 'Drop 01 — The Oath',
  ogDescription: 'Premium bodybuilding gymwear. Forged Under Pressure.',
  ogImage: img('drop-oath-og', 'ANVL The Oath campaign visual'),
} as const

const rawDrop: Drop = {
  id: dropId,
  slug: 'the-oath',
  title: 'Drop 01 — The Oath',
  subtitle: 'Forged Under Pressure',
  description:
    'The founding drop establishes ANVL visual language: dark steel, washed charcoal, and bone typography.',
  status: 'active',
  releaseDate: '2026-05-01',
  theme: oathPalette,
  brand: oathBranding,
  heroMedia: img('drop-oath-hero', 'Full-bleed hero for The Oath landing act'),
  dropPage: {
    title: 'The Oath',
    subtitle: 'Drop 01',
    description: 'Campaign overview and release story.',
    body: 'Editorial body placeholder for the public drop page.',
    gallery: [img('drop-oath-gallery-1', 'Campaign still one')],
  },
  acts: [
    {
      id: 'act-hero',
      nature: 'hero',
      preset: 'cinematic-full-screen',
      title: 'The Oath',
      subtitle: 'Forged Under Pressure',
      eyebrow: 'Drop 01',
      content: {
        countdownLabel: 'Launch',
        primaryCtaLabel: 'Shop the drop',
        primaryCtaHref: '/shop',
      },
      animation: {
        enabled: true,
        desktopOnly: true,
        type: 'fadeUp',
        intensity: 'medium',
        duration: 1.1,
      },
      isEnabled: true,
      sortOrder: 0,
    },
    {
      id: 'act-manifesto',
      nature: 'manifesto',
      preset: 'centered-oath-text',
      title: 'We do not negotiate with weakness.',
      body: 'Placeholder manifesto copy for seed data.',
      content: {
        statements: ['Discipline', 'Pressure', 'Forged'],
      },
      isEnabled: true,
      sortOrder: 1,
    },
    {
      id: 'act-product-showcase',
      nature: 'productShowcase',
      preset: 'three-card-editorial-grid',
      title: 'The pieces',
      content: {
        cardStyle: 'editorial',
        ctaLabel: 'View all',
      },
      productIds: ['catalog-oversized-tee', 'catalog-stringer', 'catalog-compression-tee'],
      isEnabled: true,
      sortOrder: 2,
    },
  ],
  productIds: ['catalog-oversized-tee', 'catalog-stringer', 'catalog-compression-tee'],
  seo: dropSeo,
  createdAt: nowIso,
  updatedAt: nowIso,
}

const colorOption = (id: string): CatalogProduct['options'][number] => ({
  id: `${id}-color`,
  name: 'Color',
  values: ['Black', 'Charcoal'],
})

const sizeOption = (id: string, sizes: string[]): CatalogProduct['options'][number] => ({
  id: `${id}-size`,
  name: 'Size',
  values: sizes,
})

function buildVariants(
  productKey: string,
  sizes: string[],
): CatalogProduct['variants'] {
  const colors = ['Black', 'Charcoal'] as const
  const variants: CatalogProduct['variants'] = []
  for (const color of colors) {
    for (const size of sizes) {
      variants.push({
        id: `${productKey}-${color.toLowerCase()}-${size}`,
        sku: `${productKey}-${color}-${size}`.toUpperCase().replace(/\s+/g, '-'),
        color,
        size,
        stockQuantity: 24,
        reservedQuantity: 0,
      })
    }
  }
  return variants
}

function baseProduct(p: {
  id: string
  slug: string
  title: string
  subtitle: string
  description: string
  amount: number
  sizes: string[]
}): CatalogProduct {
  const gallery = [
    img(`${p.id}-front`, `${p.title} front`),
    img(`${p.id}-back`, `${p.title} back`),
  ]
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle,
    description: p.description,
    sourceType: 'drop',
    dropId,
    releaseDate: '2026-05-01',
    basePrice: { amount: p.amount, currencyCode: 'USD' },
    currency: 'USD',
    status: 'available',
    badges: [{ id: `${p.id}-badge-launch`, label: 'Launch', kind: 'launch' }],
    material: 'Seed placeholder — see product editor for GSM and composition.',
    fit: 'True-to-size athletic fit (seed).',
    care: 'Machine wash cold. Hang dry.',
    media: {
      gallery,
      thumbnail: gallery[0],
    },
    options: [colorOption(p.id), sizeOption(p.id, p.sizes)],
    variants: buildVariants(p.id, p.sizes),
    seo: {
      metaTitle: `ANVL — ${p.title}`,
      metaDescription: p.description.slice(0, 155),
      canonicalUrl: `/shop/${p.slug}`,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  }
}

const rawCatalogProducts: CatalogProduct[] = [
  baseProduct({
    id: 'catalog-oversized-tee',
    slug: 'oversized-tee',
    title: 'Oversized Tee',
    subtitle: 'Statement pump-cover',
    description:
      'Heavyweight oversized tee with structured silhouette and Drop 01 oath graphics (seed).',
    amount: 59,
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  }),
  baseProduct({
    id: 'catalog-stringer',
    slug: 'stringer',
    title: 'Stringer',
    subtitle: 'Old-school lifter cut',
    description:
      'Racerback stringer with premium stretch and minimal back branding (seed).',
    amount: 49,
    sizes: ['S', 'M', 'L', 'XL'],
  }),
  baseProduct({
    id: 'catalog-compression-tee',
    slug: 'compression-tee',
    title: 'Compression Tee',
    subtitle: 'Second-skin technical layer',
    description:
      'High-recovery compression mapped for chest, shoulders, and arms (seed).',
    amount: 69,
    sizes: ['S', 'M', 'L', 'XL'],
  }),
]

/** Runtime-validated Drop 01 — The Oath (canonical CMS shape). */
export const seedDrop01TheOath: Drop = dropSchema.parse(rawDrop)

/** Three catalog placeholders aligned with storefront slugs and Drop 01. */
export const seedDrop01CatalogProducts: CatalogProduct[] = rawCatalogProducts.map((p) =>
  catalogProductSchema.parse(p),
)
