import { useRef } from 'react'
import { previewSpecialEventFields } from '@/features/cms/landing/landingActPreviewOverlay'
import { formatEventDate, getCountdownParts } from '../shared/actPresetUtils'
import { ActPresetShell } from '../shared/ActPresetShell'
import { useActPresetMotion } from '../shared/useActScrollReveal'
import { useActIdleMotion } from '../shared/useActIdleMotion'
import type { ActPresetProps } from '../types'

export function OathEventPulsePreset({ row }: ActPresetProps) {
  const rootRef = useRef<HTMLElement>(null)
  const e = previewSpecialEventFields(row)
  const countdown = e.startsAtIso ? getCountdownParts(e.startsAtIso) : null

  useActPresetMotion(rootRef, row, {
    staggerSelector: '[data-act-block]',
    words: '[data-act-word]',
  })
  useActIdleMotion(rootRef, row, { pulseSelector: '[data-event-ring]' })

  return (
    <ActPresetShell rootRef={rootRef} row={row} ariaLabel="Special event">
      <div className="grid gap-[var(--act-gap-lg)] lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p data-act-eyebrow className="uppercase tracking-[0.28em] text-[var(--color-muted)]">
            {e.actLabel}
          </p>
          <h2 data-act-title className="mt-3 font-display uppercase leading-[0.95] text-[var(--color-fg)]">
            <span data-act-word>{e.heading}</span>
          </h2>
          {e.intro ? (
            <p data-act-body className="mt-4 max-w-xl text-[var(--color-muted)]">
              {e.intro}
            </p>
          ) : null}
          {e.location ? (
            <p data-act-block className="mt-4 text-sm uppercase tracking-wider text-[var(--color-accent)]">
              {e.location}
            </p>
          ) : null}
          {e.rules ? (
            <p data-act-block className="mt-2 text-sm text-[var(--color-muted)]">
              {e.rules}
            </p>
          ) : null}
          <a
            data-act-micro
            href={e.cta.href}
            className="mt-6 inline-flex rounded border border-[var(--color-accent)] px-6 py-3 text-sm uppercase tracking-[0.2em] text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-[var(--color-bg)]"
          >
            {e.cta.label}
          </a>
        </div>
        <div
          data-event-ring
          data-act-block
          className="flex aspect-square w-full max-w-[280px] flex-col items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]/30 p-8 text-center lg:mx-auto"
        >
          {countdown ? (
            <div className="grid grid-cols-2 gap-3 font-display text-2xl tabular-nums text-[var(--color-fg)] sm:text-3xl">
              <div>
                <span className="block text-4xl">{countdown.days}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  Days
                </span>
              </div>
              <div>
                <span className="block text-4xl">{countdown.hours}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  Hrs
                </span>
              </div>
              <div>
                <span className="block text-4xl">{countdown.minutes}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  Min
                </span>
              </div>
              <div>
                <span className="block text-4xl">{countdown.seconds}</span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  Sec
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">
              {e.startsAtIso ? formatEventDate(e.startsAtIso) : 'Schedule TBA'}
            </p>
          )}
        </div>
      </div>
    </ActPresetShell>
  )
}
