import { useRef } from 'react'
import { previewFinalCtaFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { ActPresetShell } from '../shared/ActPresetShell'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import { useActIdleMotion } from '../shared/useActIdleMotion'
import { CampaignMark } from '@/shared/components/brand/CampaignMark'
import type { ActPresetProps } from '../types'

export function OathForgeClosePreset({ row, emblemSrc }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const f = previewFinalCtaFields(row)

  useActPresetMotion(rootRef, row, {
    staggerSelector: '[data-act-block]',
    words: '[data-act-word]',
  })
  useActIdleMotion(rootRef, row, { floatSelector: '[data-act-emblem]' })

  return (
    <ActPresetShell
      rootRef={rootRef}
      row={row}
      sectionSize="content"
      contentImageKey="backgroundImageUrl"
      ariaLabel="Final call to action"
      className="bg-[var(--color-bg)]"
      contentClassName="py-8 sm:py-10"
    >
      <div className="flex flex-col items-center px-2 text-center sm:px-4">
        {emblemSrc ? (
          <CampaignMark
            data-act-emblem
            data-act-float
            src={emblemSrc}
            onDark
            className="mb-3 size-[var(--act-emblem-size)]"
          />
        ) : null}
        <p data-act-eyebrow className="uppercase tracking-[0.32em] text-[var(--color-muted)]">
          {f.actLabel}
        </p>
        <h2 data-act-title className="mt-2 max-w-2xl font-display uppercase leading-[0.92] text-[var(--color-fg)]">
          <span data-act-word>{f.heading}</span>
        </h2>
        {f.intro ? (
          <p data-act-body className="mt-2 max-w-lg text-[length:var(--act-body-size)] text-[var(--color-muted)]">
            {f.intro}
          </p>
        ) : null}
        <div data-act-block className="mt-10 flex flex-wrap items-center justify-center gap-4 pb-2">
          <a
            data-act-micro
            href={f.primaryCta.href}
            className="rounded bg-[var(--color-accent)] px-8 py-3 text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-bg)] transition-opacity hover:opacity-90"
          >
            {f.primaryCta.label}
          </a>
          {f.secondaryCta.label ? (
            <a
              data-act-micro
              href={f.secondaryCta.href}
              className="rounded border border-[var(--color-line)] px-8 py-3 text-sm uppercase tracking-[0.2em] text-[var(--color-fg)] hover:border-[var(--color-accent)]"
            >
              {f.secondaryCta.label}
            </a>
          ) : null}
        </div>
      </div>
    </ActPresetShell>
  )
}
