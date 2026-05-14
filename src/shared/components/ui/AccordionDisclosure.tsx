import type { ReactNode } from 'react'

/** Lightweight accessible accordion using native `<details>`. */
export function AccordionDisclosure({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <details className="group rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
      <summary className="cursor-pointer list-none font-semibold text-[var(--color-heading)] marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          {title}
          <span className="text-xs text-[var(--color-text-muted)] group-open:rotate-180">▼</span>
        </span>
      </summary>
      <div className="mt-3 text-sm text-[var(--color-text-muted)]">{children}</div>
    </details>
  )
}
