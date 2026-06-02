import { useRef } from 'react'
import { previewManifestoFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { formatTenetLine } from '../shared/actPresetUtils'
import { ActPresetShell } from '../shared/ActPresetShell'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import { useActIdleMotion } from '../shared/useActIdleMotion'
import { CampaignMark } from '@/shared/components/brand/CampaignMark'
import type { ActPresetProps } from '../types'

export function OathTenetLedgerPreset({ landing, row, emblemSrc }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const m = previewManifestoFields(landing.manifesto, row, 'manifesto')

  useActPresetMotion(rootRef, row, {
    staggerSelector: '[data-act-block]',
    words: '[data-act-word]',
  })
  useActIdleMotion(rootRef, row, { pulseSelector: '[data-act-emblem]' })

  return (
    <ActPresetShell rootRef={rootRef} row={row} sectionSize="tall" ariaLabel="Manifesto">
      <div className="grid gap-[var(--act-gap-lg)] lg:grid-cols-[minmax(5rem,auto)_minmax(0,42rem)] lg:items-start lg:gap-10">
        {emblemSrc ? (
          <CampaignMark
            data-act-emblem
            src={emblemSrc}
            onDark
            className="mx-auto size-[var(--act-emblem-size)] opacity-90 lg:mx-0"
          />
        ) : null}
        <div>
          <p data-act-eyebrow className="uppercase tracking-[0.28em] text-[var(--color-muted)]">
            {m.actLabel}
          </p>
          <p data-act-subtitle className="mt-1 text-sm text-[var(--color-muted)]">
            {m.counterLabel}
          </p>
          <h2 data-act-title className="mt-2 font-display uppercase leading-[0.95] text-[var(--color-fg)]">
            <span data-act-word>{m.heading}</span>
          </h2>
          <ul className="mt-[var(--act-gap-lg)] space-y-2 border-t border-[var(--color-line)] pt-4">
            {m.tenets.map((tenet, i) => (
              <li
                key={tenet.id ?? i}
                data-act-block
                className="flex gap-4 border-b border-[var(--color-line)]/60 pb-2.5 last:border-0"
              >
                <span className="shrink-0 font-display text-xl text-[var(--color-accent)] tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p data-act-body className="min-w-0 flex-1 text-[length:var(--act-body-size)] leading-relaxed text-[var(--color-fg)]">
                  {formatTenetLine(tenet)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ActPresetShell>
  )
}
