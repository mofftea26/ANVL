import type { AdminProduct, ProductVariantAvailability } from './products.types'

/** Ensures every color × size pair has an availability row after edits. */
export function rebuildAvailabilityMatrix(product: AdminProduct): AdminProduct {
  const availability: ProductVariantAvailability[] = []
  for (const c of product.colors) {
    for (const s of product.sizes) {
      const existing = product.availability.find(
        (a) => a.colorId === c.id && a.sizeId === s.id,
      )
      availability.push(
        existing ?? {
          colorId: c.id,
          sizeId: s.id,
          stockQuantity: 0,
          isAvailable: false,
        },
      )
    }
  }
  return { ...product, availability }
}
