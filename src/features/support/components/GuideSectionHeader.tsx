import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { ProseBody } from './ProseBody'

/**
 * The masthead every section of the two guide pages sits under — a drafting
 * sheet's title block: a rule across the top, the title on the left, and a
 * `meta` slot on the right for the one fact that qualifies the section (the
 * unit system, a live result count).
 *
 * The meta slot borrows the same caption type as the schematic's own caption in
 * `MeasurementFigure`, so page and drawing read as one document.
 */
export function GuideSectionHeader({
  title,
  titleId,
  meta,
  intro,
  className,
}: {
  title: string
  /** Set when a `tablist`/`region` elsewhere needs to reference the heading. */
  titleId?: string
  /** Right-aligned qualifier: units, a standard, a live count. */
  meta?: ReactNode
  /** Plain-text intro; blank lines start new paragraphs. */
  intro?: string
  className?: string
}) {
  return (
    <div className={cn('border-t border-[var(--color-line)] pt-5', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2
          id={titleId}
          className="anvl-heading text-2xl text-[var(--color-heading)] md:text-3xl"
        >
          {title}
        </h2>
        {meta ? (
          <p className="text-[0.6875rem] tracking-[0.18em] text-[var(--color-text-muted)] uppercase">
            {meta}
          </p>
        ) : null}
      </div>
      <hr className="anvl-highlight-rule mt-4 max-w-[6rem]" />
      {intro?.trim() ? <ProseBody body={intro} className="mt-5 max-w-2xl" /> : null}
    </div>
  )
}
