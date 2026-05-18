import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import { rebuildAvailabilityMatrix } from '@/features/admin/products/products.matrix'
import { uniqueProductSlug } from '@/features/admin/products/products.slug'
import type { AdminProduct } from '@/features/admin/products/products.types'
import type {
  ProductSourceType,
  ProductStatus,
} from '@/features/products/types/catalogProduct.types'

/** Parses comma / semicolon / newline-separated size labels for quick-create. */
export function parseQuickProductSizeLabels(raw: string): string[] {
  return raw
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function buildSkuForVariant(opts: {
  skuBase: string
  colorName: string
  sizeLabel: string
}): string | undefined {
  const base = opts.skuBase.trim()
  if (!base) return undefined
  const color = opts.colorName.replace(/\s+/g, '')
  const size = opts.sizeLabel.replace(/\s+/g, '')
  return `${base}-${color}-${size}`.replace(/-+/g, '-')
}

export type QuickCreateAdminProductInput = {
  /** Existing catalog rows — used for slug collision detection. */
  catalog: AdminProduct[]
  /** Target drop to link when `linkToDropId` is set. */
  linkToDropId: string | null
  /** Base for `uniqueProductSlug` when `explicitSlug` is empty. */
  name: string
  explicitSlug: string
  price: number
  currency: string
  category: string
  shortDescription: string
  description: string
  status: ProductStatus
  isActive: boolean
  sourceType: ProductSourceType
  tags: string[]
  primaryImageUrl: string
  colorName: string
  colorHex: string
  sizesRaw: string
  skuBase: string
  /** Maps to persisted `stockQuantity` on each variant row. */
  quantity: number
  details: {
    fit: string
    fabric: string
    gsm: string
  }
  template: AdminProduct
}

/**
 * Builds a full `AdminProduct` from quick-create modal fields and normalizes
 * the availability matrix (SKU + quantity on every color × size).
 */
export function buildQuickCreateAdminProduct(
  input: QuickCreateAdminProductInput,
): AdminProduct {
  const {
    template,
    catalog,
    name,
    explicitSlug,
    linkToDropId,
    price,
    currency,
    category,
    shortDescription,
    description,
    status,
    isActive,
    sourceType,
    tags,
    primaryImageUrl,
    colorName,
    colorHex,
    sizesRaw,
    skuBase,
    quantity,
    details,
  } = input

  const trimmedName = name.trim() || 'New piece'
  const slugDesired = explicitSlug.trim() || trimmedName
  const slug = uniqueProductSlug(slugDesired, catalog)

  const labels = parseQuickProductSizeLabels(sizesRaw)
  const sizeRows =
    labels.length > 0
      ? labels.map((label, idx) => ({
          id: createCmsId(`qc-size-${idx}`),
          label,
          sortOrder: idx,
        }))
      : [{ id: createCmsId('qc-size'), label: 'M', sortOrder: 0 }]

  const colorId = createCmsId('qc-color')
  const trimmedColor = colorName.trim() || 'Black'
  const hex = colorHex.trim() || '#0B0B0C'
  const imgUrl =
    primaryImageUrl.trim() || '/brand/placeholder-product.svg'

  const imgId = createCmsId('qc-img')
  const colors: AdminProduct['colors'] = [
    {
      id: colorId,
      name: trimmedColor,
      hex,
      images: [
        {
          id: imgId,
          url: imgUrl,
          alt: `${trimmedName} — ${trimmedColor}`,
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    },
  ]

  let next: AdminProduct = {
    ...template,
    slug,
    name: trimmedName,
    shortDescription,
    description,
    price,
    currency: currency.trim() || 'USD',
    category: category.trim() || 'Uncategorized',
    status,
    isActive,
    sourceType,
    tags,
    colors,
    sizes: sizeRows,
    dropIds: linkToDropId ? [linkToDropId] : [],
    details: {
      fit: details.fit.trim() || undefined,
      fabric: details.fabric.trim() || undefined,
      gsm: details.gsm.trim() || undefined,
    },
    seo: {
      ...template.seo,
      title: template.seo.title ?? `${trimmedName} | ANVL Athletics`,
      description:
        template.seo.description ?? (description.trim() || shortDescription.trim() || undefined),
      ogImage: imgUrl,
    },
  }

  next = rebuildAvailabilityMatrix(next)

  const qty = Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0

  next = {
    ...next,
    availability: next.availability.map((row) => {
      const color = next.colors.find((c) => c.id === row.colorId)
      const size = next.sizes.find((s) => s.id === row.sizeId)
      return {
        ...row,
        stockQuantity: qty,
        reservedQuantity: 0,
        sku: buildSkuForVariant({
          skuBase,
          colorName: color?.name ?? '',
          sizeLabel: size?.label ?? '',
        }),
      }
    }),
  }

  return rebuildAvailabilityMatrix(next)
}
