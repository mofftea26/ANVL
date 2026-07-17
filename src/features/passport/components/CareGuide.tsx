import { useState } from 'react'
import { ChevronDown } from '@/shared/icons'
import { cn } from '@/shared/lib/cn'
import type { ResolvedPassportContent } from '../lib/resolvePassportContent'
import { getCareSymbol } from './careSymbols'

/**
 * The interactive care ritual: the garment's care symbols (tap for the plain
 * meaning) over expandable numbered steps. Icons animate on selection; the
 * whole thing is CSS/DOM (works on every device, respects reduced motion via
 * `motion-safe:` transitions).
 */
export function CareGuide({ care }: { care: ResolvedPassportContent['care'] }) {
  const [openStep, setOpenStep] = useState<number | null>(null)
  const [openSymbol, setOpenSymbol] = useState<string | null>(null)

  const symbols = care.symbols.map((key) => getCareSymbol(key)).filter((s) => s !== null)
  const activeSymbol = symbols.find((s) => s.key === openSymbol) ?? null

  return (
    <div className="space-y-6">
      {care.intro ? (
        <p className="max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)]">
          {care.intro}
        </p>
      ) : null}

      {/* Care symbols */}
      {symbols.length > 0 ? (
        <div>
          <div className="flex flex-wrap gap-2">
            {symbols.map((symbol) => {
              const isOpen = symbol.key === openSymbol
              return (
                <button
                  key={symbol.key}
                  type="button"
                  aria-pressed={isOpen}
                  aria-label={symbol.label}
                  onClick={() => setOpenSymbol(isOpen ? null : symbol.key)}
                  className={cn(
                    'focus-ring flex h-11 w-11 items-center justify-center rounded-lg border motion-safe:transition-all motion-safe:duration-300',
                    isOpen
                      ? 'scale-105 border-[var(--color-highlight)] bg-[color-mix(in_oklab,var(--color-highlight)_14%,transparent)] text-[var(--color-highlight-bright)]'
                      : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[color-mix(in_oklab,var(--color-highlight)_45%,var(--color-line))] hover:text-[var(--color-text)]',
                  )}
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                    <symbol.Icon />
                  </svg>
                </button>
              )
            })}
          </div>
          <p
            aria-live="polite"
            className="mt-3 min-h-[2.5rem] text-xs leading-relaxed text-[var(--color-text-muted)]"
          >
            {activeSymbol ? (
              <>
                <span className="anvl-micro mr-2 text-[var(--color-highlight-bright)]">
                  {activeSymbol.label}
                </span>
                {activeSymbol.meaning}
              </>
            ) : (
              'Tap a symbol for what it means.'
            )}
          </p>
        </div>
      ) : null}

      {/* Steps */}
      <ol className="space-y-2">
        {care.steps.map((step, i) => {
          const note = care.notes[i]?.trim()
          const isOpen = openStep === i
          return (
            <li
              key={step}
              className="rounded-xl border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)]"
            >
              {note ? (
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenStep(isOpen ? null : i)}
                  className="focus-ring flex w-full items-center gap-4 px-4 py-3 text-left"
                >
                  <StepNumber index={i} />
                  <span className="flex-1 text-sm text-[var(--color-text)]">{step}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'h-4 w-4 shrink-0 text-[var(--color-text-muted)] motion-safe:transition-transform motion-safe:duration-300',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
              ) : (
                <div className="flex items-center gap-4 px-4 py-3">
                  <StepNumber index={i} />
                  <span className="flex-1 text-sm text-[var(--color-text)]">{step}</span>
                </div>
              )}
              {note ? (
                <div
                  className={cn(
                    'grid px-4 motion-safe:transition-all motion-safe:duration-300',
                    isOpen ? 'grid-rows-[1fr] pb-3 opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <p className="overflow-hidden pl-10 text-xs leading-relaxed text-[var(--color-text-muted)]">
                    {note}
                  </p>
                </div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function StepNumber({ index }: { index: number }) {
  return (
    <span className="anvl-heading shrink-0 text-base text-[var(--color-highlight-bright)]">
      {String(index + 1).padStart(2, '0')}
    </span>
  )
}
