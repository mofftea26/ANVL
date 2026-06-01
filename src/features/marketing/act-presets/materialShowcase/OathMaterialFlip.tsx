import { useRef, useState } from 'react'
import { previewMaterialsFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { ActPresetShell } from '../shared/ActPresetShell'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'
import type { Product } from '@/features/products/types/product.types'
import { cn } from '@/shared/lib/cn'
import { pickFeaturedProducts } from '../productShowcase/oathProductUtils'

type Characteristic = { id: string; label: string; body?: string; imageUrl?: string }
type MaterialProduct = {
  productId: string
  frontLabel?: string
  materialName?: string
  gsm?: string
  composition?: string
  characteristics: Characteristic[]
}

function parseMaterialProducts(
  content: Record<string, unknown> | undefined,
  products: Product[],
  productIds?: string[],
): Array<MaterialProduct & { product: Product }> {
  const raw = content?.materialProducts
  if (Array.isArray(raw) && raw.length) {
    const byId = new Map(products.map((p) => [p.id, p]))
    return raw
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const o = row as Record<string, unknown>
        const productId = typeof o.productId === 'string' ? o.productId : ''
        const product = byId.get(productId)
        if (!product) return null
        const chars = Array.isArray(o.characteristics)
          ? (o.characteristics as Characteristic[])
          : []
        return {
          productId,
          frontLabel: typeof o.frontLabel === 'string' ? o.frontLabel : undefined,
          materialName: typeof o.materialName === 'string' ? o.materialName : undefined,
          gsm: typeof o.gsm === 'string' ? o.gsm : undefined,
          composition: typeof o.composition === 'string' ? o.composition : undefined,
          characteristics: chars,
          product,
        }
      })
      .filter(Boolean) as Array<MaterialProduct & { product: Product }>
  }
  return pickFeaturedProducts(products, productIds, 4).map((product) => ({
    productId: product.id,
    characteristics: [],
    product,
  }))
}

export function OathMaterialFlipPreset({ landing, row, products }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const m = previewMaterialsFields(landing.materials, row)
  const items = parseMaterialProducts(
    row?.content as Record<string, unknown>,
    products,
    row?.productIds,
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useActPresetMotion(rootRef, row, { staggerSelector: '[data-act-block]' })

  return (
    <ActPresetShell rootRef={rootRef} row={row} ariaLabel="Materials">
      <p data-act-eyebrow className="uppercase tracking-[0.28em] text-[var(--color-muted)]">
        {m.actLabel}
      </p>
      <h2 data-act-title className="mt-2 font-display uppercase text-[var(--color-fg)]">
        {m.heading}
      </h2>
      <p data-act-body className="mt-2 max-w-2xl text-[var(--color-muted)]">{m.intro}</p>
      <div className="mt-[var(--act-gap)] grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const img = item.product.images[0]
          const expanded = expandedId === item.productId
          return (
            <div key={item.productId} data-act-block className="perspective-[1200px]">
              <button
                type="button"
                className={cn(
                  'group relative h-52 w-full text-left [transform-style:preserve-3d] transition-transform duration-700 sm:h-56',
                  expanded && '[transform:rotateY(180deg)]',
                  'hover:[transform:rotateY(180deg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]',
                )}
                onClick={() =>
                  setExpandedId(expanded ? null : item.productId)
                }
              >
                <div className="absolute inset-0 flex flex-col overflow-hidden rounded border border-[var(--color-line)] bg-[var(--color-surface)] backface-hidden">
                  {img ? (
                    <img src={img.src} alt={img.alt} className="h-28 w-full object-cover sm:h-32" />
                  ) : null}
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
                      {item.frontLabel ?? item.product.name}
                    </p>
                    <p className="mt-1 font-display text-lg uppercase">{item.product.name}</p>
                  </div>
                </div>
                <div className="absolute inset-0 flex flex-col justify-center rounded border border-[var(--color-line)] bg-[var(--color-bg)] p-4 [transform:rotateY(180deg)] backface-hidden">
                  <p className="text-xs uppercase tracking-wider text-[var(--color-accent)]">
                    Material
                  </p>
                  <p className="mt-2 font-display text-xl uppercase">
                    {item.materialName ?? item.product.fabric ?? 'Fabric'}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {[item.composition ?? item.product.fabric, item.gsm ?? item.product.gsm]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </ActPresetShell>
  )
}
