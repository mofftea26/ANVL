type ProductShowcaseHeaderProps = {
  actLabel: string
  headingLineOne: string
  headingLineTwo: string
  viewAllLabel?: string
  viewAllHref?: string
}

/** Compact header row shared across product showcase presets. */
export function ProductShowcaseHeader({
  actLabel,
  headingLineOne,
  headingLineTwo,
  viewAllLabel,
  viewAllHref,
}: ProductShowcaseHeaderProps) {
  return (
    <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
      <div className="min-w-0">
        <p data-act-eyebrow data-act-float>
          {actLabel}
        </p>
        <h2 data-act-title className="mt-0.5 font-display uppercase leading-[0.94]">
          {headingLineOne}
          <span className="text-[var(--color-muted)]"> {headingLineTwo}</span>
        </h2>
      </div>

      {viewAllHref && viewAllLabel ? (
        <a
          data-act-micro
          href={viewAllHref}
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]/40 px-2.5 py-1 uppercase tracking-[0.14em] text-[var(--color-fg)] no-underline transition-colors hover:border-[color-mix(in_srgb,var(--anvl-bone)_30%,transparent)] hover:bg-[var(--color-surface)]/60 sm:self-end"
          style={{ fontSize: 'var(--act-card-meta-size)' }}
        >
          {viewAllLabel}
          <span aria-hidden="true">→</span>
        </a>
      ) : null}
    </div>
  )
}
