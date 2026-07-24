/**
 * CMS editorial strip for the shop listing — a forged plate that stands clearly
 * apart from the toolbar above and the grid below. Treatment: copper hairline
 * seams top + bottom, a vertical accent seam on the leading edge, display-type
 * title over muted body copy, and a soft ember glow bleeding from the seam.
 * Colors come exclusively from `--shop-*` tokens so it adapts to every theme.
 */
export function ShopEditorialBanner({
  eyebrow,
  title,
  body,
}: {
  /** Small display-type kicker above the title (CMS hero eyebrow reused). */
  eyebrow?: string
  title: string
  body?: string
}) {
  return (
    <aside
      aria-label={title}
      className="relative my-10 overflow-hidden rounded-2xl border border-[var(--shop-card-border)] md:my-14"
    >
      {/* Forged plate backdrop. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(115deg, var(--shop-card-bg) 0%, var(--shop-card-bg-2) 55%, var(--shop-card-bg) 100%)',
        }}
      />
      {/* Ember glow bleeding from the leading seam. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(80% 140% at 0% 50%, var(--shop-card-glow) 0%, transparent 55%)',
        }}
      />
      {/* Copper hairline seams — top and bottom edges. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px opacity-70"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--shop-accent) 18%, transparent 85%)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px opacity-40"
        style={{
          background:
            'linear-gradient(90deg, transparent 8%, var(--shop-accent) 55%, transparent 100%)',
        }}
      />
      {/* Vertical accent seam on the leading edge. */}
      <div
        aria-hidden="true"
        className="absolute bottom-4 left-0 top-4 w-[3px] rounded-full bg-[var(--shop-accent)] opacity-80"
      />

      <div className="relative px-6 py-8 sm:px-8 md:px-12 md:py-10">
        {eyebrow ? (
          <p className="anvl-display inline-flex items-center gap-2.5 text-[10px] tracking-[0.32em] text-[var(--shop-accent)] before:h-px before:w-6 before:bg-[var(--shop-accent)] before:content-['']">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="anvl-heading mt-3 max-w-3xl text-[clamp(1.35rem,3.2vw,2rem)] font-normal leading-[1.02] text-[var(--shop-text)]">
          {title}
        </h2>
        {body ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--shop-text-muted)] md:text-base">
            {body}
          </p>
        ) : null}
      </div>
    </aside>
  )
}
