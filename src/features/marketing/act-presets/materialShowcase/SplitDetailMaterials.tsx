import { useMemo, useRef } from 'react'
import { previewMaterialsFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { gsap } from '@/shared/lib/gsap'
import { useActScrollReveal } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

const SWATCH =
  'linear-gradient(135deg, var(--color-surface-soft) 0%, var(--color-line) 100%)'

/** Split detail — featured swatch left, specs right. */
export function SplitDetailMaterialsPreset({ landing, row }: ActPresetProps) {
  const mat = previewMaterialsFields(landing.materials, row)
  const root = useRef<HTMLElement | null>(null)
  const featured = useMemo(() => {
    const visible = mat.materials.filter((m) => m.isVisible !== false)
    return visible.find((m) => m.isFeatured) ?? visible[0] ?? null
  }, [mat.materials])

  useActScrollReveal(root, {
    snapSelectors: ['[data-split-mat-visual]', '[data-split-mat-copy]', '[data-split-mat-row]'],
    onAnimate: (host) => {
      const visual = host.querySelector('[data-split-mat-visual]')
      const copy = host.querySelector('[data-split-mat-copy]')
      const rows = gsap.utils.toArray<HTMLElement>('[data-split-mat-row]', host)
      gsap.set([visual, copy], { opacity: 0, y: 28 })
      gsap.set(rows, { opacity: 0, x: 20 })
      gsap
        .timeline({
          scrollTrigger: { trigger: host, start: 'top 78%', toggleActions: 'play none none reverse' },
        })
        .to(visual, { opacity: 1, y: 0, duration: 0.8 }, 0)
        .to(copy, { opacity: 1, y: 0, duration: 0.8 }, 0.1)
        .to(rows, { opacity: 1, x: 0, stagger: 0.08, duration: 0.65 }, 0.2)
    },
  })

  return (
    <section
      ref={root}
      className="border-b border-[var(--color-line)] bg-[var(--color-bg)] py-16 md:py-24"
      aria-label="Materials"
    >
      <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div
          data-split-mat-visual
          className="aspect-[4/3] rounded-lg border border-[var(--color-line)]"
          style={{ background: SWATCH }}
          aria-hidden
        />
        <div data-split-mat-copy>
          <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {mat.actLabel}
          </p>
          <h2 className="anvl-display mb-4 text-[clamp(1.75rem,3.5vw,2.5rem)]">{mat.heading}</h2>
          <p className="mb-8 text-sm text-[var(--color-text-muted)]">{mat.intro}</p>
          <ul className="space-y-4">
            {(featured ? [featured] : mat.materials.slice(0, 3)).map((material) => (
              <li
                key={material.id}
                data-split-mat-row
                className="border-b border-[var(--color-line)] pb-4 last:border-b-0"
              >
                <p className="font-medium">{material.title}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {material.code} · {material.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  )
}
