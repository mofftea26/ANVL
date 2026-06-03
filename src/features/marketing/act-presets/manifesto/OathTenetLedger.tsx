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
  const showSubtitle =
    Boolean(m.counterLabel?.trim()) &&
    m.counterLabel!.trim() !== m.actLabel.trim()

  useActPresetMotion(rootRef, row, {
    staggerSelector: '[data-act-block]',
    words: '[data-act-word]',
  })
  useActIdleMotion(rootRef, row, { pulseSelector: '[data-act-emblem]' })

  return (
    <ActPresetShell rootRef={rootRef} row={row} sectionSize="content" ariaLabel="Manifesto">
      <div className="grid min-h-0 gap-[var(--act-gap-lg)] lg:grid-cols-[minmax(3.5rem,auto)_minmax(0,1fr)] lg:items-start">
        {emblemSrc ? (
          <CampaignMark
            data-act-emblem
            src={emblemSrc}
            onDark
            className="mx-auto size-[var(--act-emblem-size)] opacity-80 lg:mx-0"
          />
        ) : null}
        <div className="min-w-0">
          <p data-act-eyebrow>{m.actLabel}</p>
          {showSubtitle ? (
            <p data-act-subtitle className="mt-0.5 text-[var(--color-muted)]">
              {m.counterLabel}
            </p>
          ) : null}
          <h2 data-act-title className="mt-1 font-display uppercase leading-[0.95]">
            <span data-act-word>{m.heading}</span>
          </h2>
          {m.intro?.trim() ? (
            <p data-act-body className="mt-2 line-clamp-3 max-w-prose">{m.intro}</p>
          ) : null}
          <ul className="mt-[var(--act-gap)] space-y-1 border-t border-[var(--color-line)] pt-[var(--act-gap)]">
            {m.tenets.map((tenet, i) => (
              <li
                key={tenet.id ?? i}
                data-act-block
                className="flex gap-3 border-b border-[var(--color-line)]/60 pb-1.5 last:border-0"
              >
                <span
                  data-act-card-meta
                  className="shrink-0 font-display tabular-nums text-[var(--color-accent)]"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p data-act-body className="min-w-0 flex-1 leading-snug">
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
