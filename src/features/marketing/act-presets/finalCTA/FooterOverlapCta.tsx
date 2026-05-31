import { useRef } from 'react'
import { previewFinalCtaFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { gsap } from '@/shared/lib/gsap'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Footer-overlap CTA band with negative margin lift. */
export function FooterOverlapCtaPreset({ row }: ActPresetProps) {
  const cta = previewFinalCtaFields(row)
  const root = useRef<HTMLElement | null>(null)

  useActPresetMotion(root, row, {
    snapSelectors: ['[data-footer-overlap-panel]'],
    onAnimate: (host) => {
      const panel = host.querySelector('[data-footer-overlap-panel]')
      gsap.fromTo(
        panel,
        { opacity: 0, y: 48 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: host, start: 'top 85%', toggleActions: 'play none none reverse' },
        },
      )
    },
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative z-[2] -mb-16 overflow-hidden border-b border-[var(--color-line)] md:-mb-20"
      aria-label="Final call to action"
    >
      <ActMediaBackdrop row={row} />
      <Container className="anvl-act-content relative z-10 flex flex-col justify-center py-6 sm:py-8">
        <div
          data-footer-overlap-panel
          className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:px-10 md:py-12"
          style={
            cta.backgroundImageUrl
              ? {
                  backgroundImage: `linear-gradient(rgba(11,11,12,0.88), rgba(11,11,12,0.88)), url(${cta.backgroundImageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          <p className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {cta.actLabel}
          </p>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="anvl-display text-[clamp(1.75rem,3.5vw,2.5rem)] text-[var(--color-heading)]">
                {cta.heading}
              </h2>
              {cta.intro ? (
                <p className="mt-3 text-sm text-[var(--color-text-muted)]">{cta.intro}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <SafeLink data-act-micro href={cta.primaryCta.href} className="anvl-btn anvl-btn-primary">
                {cta.primaryCta.label}
              </SafeLink>
              {cta.secondaryCta.label.trim() ? (
                <SafeLink data-act-micro href={cta.secondaryCta.href} className="anvl-btn anvl-btn-ghost">
                  {cta.secondaryCta.label}
                </SafeLink>
              ) : null}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
