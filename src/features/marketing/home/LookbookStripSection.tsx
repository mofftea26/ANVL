import type { StorefrontLookbookItem } from '@/features/cms/api/publicStorefrontPublication'
import { Container } from '@/shared/components/ui/Container'

export type LookbookStripSectionProps = {
  items: StorefrontLookbookItem[]
}

export function LookbookStripSection({ items }: LookbookStripSectionProps) {
  const visible = items.filter((item) => item.src.trim().length > 0)
  if (visible.length === 0) return null

  return (
    <section
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16 md:py-20"
      aria-label="Lookbook"
    >
      <Container>
        <p className="anvl-micro mb-6 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          Lookbook
        </p>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {visible.map((item) => (
            <figure
              key={item.id}
              className="w-[min(72vw,16rem)] shrink-0 overflow-hidden rounded-lg border border-[var(--color-line)]"
            >
              <img
                src={item.src}
                alt={item.alt || 'Lookbook image'}
                className="aspect-[3/4] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </figure>
          ))}
        </div>
      </Container>
    </section>
  )
}
