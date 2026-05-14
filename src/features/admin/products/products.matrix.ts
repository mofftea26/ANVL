import type { AdminProduct, ProductVariantAvailability } from './products.types'

export function effectiveSellableUnits(
  row: Pick<ProductVariantAvailability, 'stockQuantity' | 'reservedQuantity'>,
): number {
  const reserved = Math.max(0, row.reservedQuantity ?? 0)
  return Math.max(0, row.stockQuantity - reserved)
}

/** Ensures every color × size pair exists and recomputes `isAvailable` from stock − reserved. */
export function rebuildAvailabilityMatrix(product: AdminProduct): AdminProduct {
  const availability: ProductVariantAvailability[] = []
  for (const c of product.colors) {
    for (const s of product.sizes) {
      const existing = product.availability.find(
        (a) => a.colorId === c.id && a.sizeId === s.id,
      )
      const stockQuantity = existing?.stockQuantity ?? 0
      const reservedQuantity = Math.max(0, existing?.reservedQuantity ?? 0)
      const sellable = effectiveSellableUnits({ stockQuantity, reservedQuantity })
      availability.push({
        colorId: c.id,
        sizeId: s.id,
        sku: existing?.sku,
        stockQuantity,
        reservedQuantity,
        isAvailable: sellable > 0,
      })
    }
  }
  return { ...product, availability }
}
