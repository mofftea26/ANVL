import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

/** Uppercase technical eyebrow label. */
export function TmEyebrow({ children }: { children: string }) {
  return (
    <p
      data-tm-reveal
      className="anvl-micro text-[0.7rem] uppercase tracking-[0.32em] text-[color:var(--color-text-muted)]"
    >
      {children}
    </p>
  )
}

/** Monospaced index marker (e.g. "01 — Knit"). */
export function TmIndexMarker({ children }: { children: string }) {
  return (
    <span className="anvl-micro text-[0.62rem] uppercase tracking-[0.26em] text-[color:var(--color-text-muted)]">
      {children}
    </span>
  )
}

/** Fine technical hairline used between/within sections. */
export function TmAnimatedLine({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block h-px w-full bg-[var(--color-line)]', className)}
    />
  )
}

/**
 * Section shell — consistent gutters, max-width, vertical rhythm, and a top
 * hairline. Heavy children opt into reveals via `[data-tm-reveal]`.
 */
export function TmSectionShell({
  id,
  section,
  className,
  children,
}: {
  id?: string
  section: string
  className?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      data-tm-section={section}
      className={cn(
        'relative border-t border-[var(--color-line)] px-6 py-24 lg:px-12',
        className,
      )}
    >
      <div className="mx-auto max-w-[var(--anvl-content-max)]">{children}</div>
    </section>
  )
}
