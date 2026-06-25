import { useId, useState } from 'react'
import { cn } from '@/shared/lib/cn'
import type { TmResolvedHotspot } from '../content/theoathModernContent.defaults'

/**
 * A technical callout anchored over the hero product. Implemented as a real
 * `<button>` (never a canvas-only visual), so it is keyboard-operable and
 * announced. The label card opens on hover (fine pointer), focus, or tap, and
 * the connector dot pulses. Positioned by CMS-controlled x/y percentages.
 */
export function TmHotspot({ hotspot }: { hotspot: TmResolvedHotspot }) {
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div
      data-tm-hotspot
      className="absolute z-20"
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          onPointerEnter={(e) => {
            if (e.pointerType === 'mouse') setOpen(true)
          }}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setOpen(false)
          }}
          onBlur={() => setOpen(false)}
          className="focus-ring relative grid h-11 w-11 place-items-center rounded-full"
        >
          <span className="sr-only">{hotspot.label}</span>
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-[var(--color-line)] bg-[var(--color-overlay)] backdrop-blur-sm"
          />
          <span
            aria-hidden="true"
            className="relative h-2 w-2 rounded-full bg-[var(--color-highlight)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-highlight)_22%,transparent)]"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full border border-[color:var(--color-highlight-soft)] motion-reduce:hidden"
          />
        </button>

        <div
          id={panelId}
          role="group"
          aria-label={hotspot.label}
          className={cn(
            'pointer-events-none absolute left-1/2 top-[140%] w-60 -translate-x-1/2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-left shadow-xl transition duration-200',
            open ? 'opacity-100' : 'translate-y-1 opacity-0',
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-text)]">
            {hotspot.label}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--color-text-muted)]">
            {hotspot.line}
          </p>
        </div>
      </div>
    </div>
  )
}
