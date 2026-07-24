import type { ShopConfig } from '@/features/cms/shop/shopExperience.zod'

/**
 * Shop introduction content — heading, eyebrow, intro copy, piece count.
 * Content-only: the hero BACKDROP (image, atmosphere, scrims) is owned by the
 * `ShopHeroShell` section in `ShopPage`, which stretches the same backdrop down
 * behind the toolbar so hero + toolbar read as one continuous plate ending at
 * the separator. Reads copy/visibility from the CMS shop config; colors come
 * from `--shop-*` only.
 */
export function ShopIntro({ config, count }: { config: ShopConfig; count: number }) {
  if (!config.heroVisible) {
    return (
      <div className="pt-8 md:pt-10">
        <p className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.32em] text-[var(--shop-accent)] before:h-px before:w-8 before:bg-[var(--shop-accent)] before:content-['']">
          {config.eyebrow}
        </p>
        <h1 className="anvl-heading mt-3 text-[clamp(1.75rem,5vw,3rem)] font-normal leading-[0.9] text-[var(--shop-text)]">
          {config.heading}
        </h1>
      </div>
    )
  }

  return (
    <div className="pt-8 md:pt-11">
      <p className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.32em] text-[var(--shop-accent)] before:h-px before:w-8 before:bg-[var(--shop-accent)] before:content-['']">
        {config.eyebrow}
      </p>
      <h1 className="anvl-heading mt-3 max-w-2xl font-normal leading-[0.9] tracking-[-0.01em] text-[clamp(2rem,5.5vw,3.5rem)] text-[var(--shop-text)]">
        {config.heading}
      </h1>
      {config.intro ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--shop-text-muted)] md:text-base">
          {config.intro}
        </p>
      ) : null}
      <div className="anvl-display mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] tracking-[0.28em] text-[var(--shop-text-muted)]">
        <span className="text-[var(--shop-accent)]">
          {String(count).padStart(2, '0')} {count === 1 ? 'piece' : 'pieces'}
        </span>
        {config.editorialCopy ? <span>{config.editorialCopy}</span> : null}
      </div>
    </div>
  )
}
