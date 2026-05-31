import { useRef } from 'react'
import { previewFinalCtaFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { Container } from '@/shared/components/ui/Container'
import { SafeLink } from '@/shared/components/ui/SafeLink'
import { ActMediaBackdrop } from '../shared/ActMediaBackdrop'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import type { ActPresetProps } from '../types'

/** Centered final CTA with optional background image. */
export function CenteredCtaPreset({ row }: ActPresetProps) {
  const cta = previewFinalCtaFields(row)
  const root = useRef<HTMLElement | null>(null)

  useActPresetMotion(root, row, {
    staggerSelector: '[data-final-cta-line]',
    snapSelectors: ['[data-final-cta-actions]'],
  })

  return (
    <section
      ref={root}
      className="anvl-screen-section relative overflow-hidden border-b border-[var(--color-line)]"
      aria-label="Final call to action"
      style={
        cta.backgroundImageUrl
          ? {
              backgroundImage: `linear-gradient(rgba(11,11,12,0.82), rgba(11,11,12,0.82)), url(${cta.backgroundImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >
      <ActMediaBackdrop row={row} />
      <Container className="anvl-act-content relative z-10 flex flex-col justify-center py-6 text-center sm:py-8">
        <p
          data-final-cta-line
          className="anvl-micro mb-3 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]"
        >
          {cta.actLabel}
        </p>
        <h2
          data-final-cta-line
          className="anvl-display mx-auto max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)] text-[var(--color-heading)]"
        >
          {cta.heading}
        </h2>
        {cta.intro ? (
          <p
            data-final-cta-line
            className="mx-auto mt-4 max-w-lg text-sm text-[var(--color-text-muted)]"
          >
            {cta.intro}
          </p>
        ) : null}
        <div
          data-final-cta-actions
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <SafeLink data-act-micro href={cta.primaryCta.href} className="anvl-btn anvl-btn-primary">
            {cta.primaryCta.label}
          </SafeLink>
          <SafeLink data-act-micro href={cta.secondaryCta.href} className="anvl-btn anvl-btn-ghost">
            {cta.secondaryCta.label}
          </SafeLink>
        </div>
      </Container>
    </section>
  )
}
