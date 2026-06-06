import { productsMock } from '@/features/products/data/products.mock'
import type { Product } from '@/features/products/types/product.types'
import { createCmsId } from '@/features/admin/lib/cmsId'
import type { AdminProduct, ProductVariantAvailability } from './products.types'
import { rebuildAvailabilityMatrix } from './products.matrix'

function legacyProductToAdmin(p: Product, nowIso: string): AdminProduct {
  const colors = p.colorways.map((cw, idx) => ({
    id: createCmsId(`color-${p.id}-${idx}`),
    name: cw.name,
    hex: cw.base,
    images: p.images.map((img, imgIdx) => ({
      id: createCmsId(`img-${p.id}-${idx}-${imgIdx}`),
      url: img.src,
      alt: img.alt,
      isPrimary: imgIdx === 0,
      sortOrder: imgIdx,
    })),
  }))

  const sizes = p.sizes.map((label, idx) => ({
    id: createCmsId(`size-${p.id}-${idx}`),
    label,
    sortOrder: idx,
  }))

  const availability: ProductVariantAvailability[] = []
  for (const c of colors) {
    for (const s of sizes) {
      availability.push({
        colorId: c.id,
        sizeId: s.id,
        sku: `${p.slug}-${s.label}-${c.name.slice(0, 3)}`.replace(/\s+/g, ''),
        stockQuantity: 24,
        reservedQuantity: 0,
        isAvailable: true,
      })
    }
  }

  const base: AdminProduct = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.role,
    description: p.storytelling,
    price: p.price,
    compareAtPrice: undefined,
    isOnSale: false,
    saleLabel: undefined,
    status: 'active',
    isActive: true,
    releaseDate: undefined,
    saleStartsAt: undefined,
    saleEndsAt: undefined,
    currency: 'USD',
    sourceType: 'individual',
    category: 'Apparel',
    tags: [],
    colors,
    sizes,
    availability,
    dropIds: [],
    details: {
      fit: p.fit,
      fabric: p.fabric,
      gsm: p.gsm,
      construction: '',
      care: p.careInstructions.join('\n'),
      features: [...p.designDetails],
    },
    videoUrl: undefined,
    model3dUrl: undefined,
    seo: {
      title: `${p.name} | ANVL Athletics`,
      description: p.storytelling,
      ogImage: p.images[0]?.src,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  }
  return rebuildAvailabilityMatrix(base)
}

export function createSeedAdminProductsFromMock(
  nowIso = new Date().toISOString(),
): AdminProduct[] {
  return productsMock.map((p) => legacyProductToAdmin(p, nowIso))
}

export function createEmptyAdminProduct(nowIso = new Date().toISOString()): AdminProduct {
  const id = createCmsId('prod')
  const colorId = createCmsId('color')
  const sizeId = createCmsId('size')
  const base: AdminProduct = {
    id,
    slug: 'new-piece',
    name: 'New piece',
    shortDescription: '',
    description: '',
    price: 0,
    isOnSale: false,
    saleStartsAt: undefined,
    saleEndsAt: undefined,
    status: 'draft',
    isActive: false,
    releaseDate: undefined,
    currency: 'USD',
    sourceType: 'individual',
    category: 'Uncategorized',
    tags: [],
    colors: [
      {
        id: colorId,
        name: 'Black',
        hex: '#0B0B0C',
        images: [
          {
            id: createCmsId('img'),
            url: '/brand/placeholder-product.svg',
            alt: 'Product image',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
    ],
    sizes: [{ id: sizeId, label: 'M', sortOrder: 0 }],
    availability: [
      {
        colorId,
        sizeId,
        stockQuantity: 0,
        reservedQuantity: 0,
        isAvailable: false,
      },
    ],
    dropIds: [],
    details: {},
    videoUrl: undefined,
    model3dUrl: undefined,
    seo: {},
    createdAt: nowIso,
    updatedAt: nowIso,
  }
  return rebuildAvailabilityMatrix(base)
}
