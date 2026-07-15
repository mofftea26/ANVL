import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import type { ResolvedPassportContent } from '../lib/resolvePassportContent'

/**
 * Forge Notes — development facts as expandable cards (time in development,
 * revisions, fabric testing, hidden details…). CMS-authored per product.
 */
export function ForgeNotes({ notes }: { notes: ResolvedPassportContent['forgeNotes'] }) {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <ul className="max-w-xl space-y-2">
      {notes.map((note, i) => {
        const isOpen = open === i
        return (
          <li
            key={`${note.title}-${i}`}
            className={cn(
              'overflow-hidden rounded-xl border motion-safe:transition-colors motion-safe:duration-300',
              isOpen
                ? 'border-[color-mix(in_oklab,var(--color-highlight)_38%,var(--color-line))] bg-[color-mix(in_oklab,var(--color-highlight)_7%,var(--color-surface))]'
                : 'border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)]',
            )}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="focus-ring flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <span className="anvl-heading shrink-0 text-xs text-[var(--color-highlight-bright)]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="flex-1 text-sm font-semibold text-[var(--color-heading)]">
                {note.title}
              </span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  'h-4 w-4 shrink-0 text-[var(--color-text-muted)] motion-safe:transition-transform motion-safe:duration-300',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
            <div
              className={cn(
                'grid px-4 motion-safe:transition-all motion-safe:duration-300',
                isOpen ? 'grid-rows-[1fr] pb-3 opacity-100' : 'grid-rows-[0fr] opacity-0',
              )}
            >
              <p className="overflow-hidden pl-8 text-xs leading-relaxed text-[var(--color-text-muted)]">
                {note.body}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
