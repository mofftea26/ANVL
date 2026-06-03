import { useRef } from 'react'
import type { CmsMaterialItem } from '@/features/cms/landing/landingPageCms.types'
import { previewMaterialsFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { ActPresetShell } from '../shared/ActPresetShell'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'
import type { Product } from '@/features/products/types/product.types'
import { pickFeaturedProducts } from '../productShowcase/oathProductUtils'

type MaterialCard = {
  id: string
  code: string
  title: string
  description: string
  spec?: string
}

function cardsFromCmsMaterials(materials: CmsMaterialItem[]): MaterialCard[] {
  return materials
    .filter((m) => m.isVisible !== false)
    .map((m) => ({
      id: m.id,
      code: m.code,
      title: m.title,
      description: m.description,
    }))
}

function cardsFromProducts(products: Product[]): MaterialCard[] {
  return products.map((product) => ({
    id: product.id,
    code: product.slug.slice(0, 4).toUpperCase(),
    title: product.name,
    description: product.fabric ?? product.role ?? '',
    spec: [product.gsm, product.fit].filter(Boolean).join(' · '),
  }))
}

function cardsFromMaterialProducts(
  content: Record<string, unknown> | undefined,
  products: Product[],
  productIds?: string[],
): MaterialCard[] {
  const raw = content?.materialProducts
  if (Array.isArray(raw) && raw.length) {
    const byId = new Map(products.map((p) => [p.id, p]))
    return raw
      .map((row, index) => {
        if (!row || typeof row !== 'object') return null
        const o = row as Record<string, unknown>
        const productId = typeof o.productId === 'string' ? o.productId : ''
        const product = byId.get(productId)
        if (!product) return null
        return {
          id: productId || `mat-${index}`,
          code:
            (typeof o.frontLabel === 'string' && o.frontLabel.trim()) ||
            `M.${String(index + 1).padStart(2, '0')}`,
          title:
            (typeof o.materialName === 'string' && o.materialName.trim()) || product.name,
          description: product.fabric ?? product.role ?? '',
          spec: [
            typeof o.composition === 'string' ? o.composition : product.fabric,
            typeof o.gsm === 'string' ? o.gsm : product.gsm,
          ]
            .filter(Boolean)
            .join(' · '),
        }
      })
      .filter(Boolean) as MaterialCard[]
  }
  return cardsFromProducts(pickFeaturedProducts(products, productIds, 4))
}

export function OathMaterialFlipPreset({ landing, row, products }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const m = previewMaterialsFields(landing.materials, row)
  const cmsCards = cardsFromCmsMaterials(m.materials)
  const productCards = cardsFromMaterialProducts(
    row?.content as Record<string, unknown>,
    products,
    row?.productIds,
  )
  const cards = cmsCards.length ? cmsCards : productCards

  useActPresetMotion(rootRef, row, { staggerSelector: '[data-act-block]' })

  return (
    <ActPresetShell
      rootRef={rootRef}
      row={row}
      sectionSize="showcase"
      ariaLabel="Materials"
      contentClassName="overflow-x-clip"
    >
      <div className="shrink-0">
        <p data-act-eyebrow>{m.actLabel}</p>
        {m.counterSuffix?.trim() ? (
          <p data-act-subtitle className="mt-0.5 text-[var(--color-muted)]">
            {m.counterSuffix}
          </p>
        ) : null}
        <h2 data-act-title className="mt-1 font-display uppercase leading-[0.94]">
          {m.heading}
        </h2>
        {m.intro?.trim() ? (
          <p data-act-body className="mt-1 line-clamp-2 max-w-prose">{m.intro}</p>
        ) : null}
      </div>

      <div className="anvl-act-showcase-track anvl-act-showcase-track--materials min-h-0 flex-1">
        {cards.map((card) => (
          <article key={card.id} data-act-block className="anvl-material-card">
            <div className="flex items-start justify-between gap-2">
              <span data-act-card-meta>{card.code}</span>
            </div>
            <h3 data-act-card-title className="line-clamp-2">{card.title}</h3>
            <p data-act-card-body className="line-clamp-2">{card.description}</p>
            {card.spec ? (
              <p data-act-card-meta className="line-clamp-1 normal-case tracking-normal">
                {card.spec}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </ActPresetShell>
  )
}
