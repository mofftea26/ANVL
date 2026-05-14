import type { PropsWithChildren, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type AccordionDisclosureProps = PropsWithChildren<{
  id?: string
  title: ReactNode
  defaultOpen?: boolean
  className?: string
}>

export function AccordionDisclosure({
  id,
  title,
  defaultOpen,
  className,
  children,
}: AccordionDisclosureProps) {
  return (
    <details
      id={id}
      className={cn(
        'group rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3',
        className,
      )}
      open={defaultOpen}
    >
      <summary className="cursor-pointer list-none font-semibold text-[var(--color-heading)] outline-none marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-3">
          <span>{title}</span>
          <span
            aria-hidden="true"
            className="text-xs text-[var(--color-text-muted)] transition group-open:rotate-180"
          >
            ▼
          </span>
        </span>
      </summary>
      <div className="mt-3 border-t border-[var(--color-line)] pt-3 text-sm text-[var(--color-text)]">
        {children}
      </div>
    </details>
  )
}
