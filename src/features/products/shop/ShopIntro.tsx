import { Container } from '@/shared/components/ui'
import { ForgeAtmosphere } from '@/shared/components/premium/ForgeAtmosphere'
import type { ShopConfig } from '@/features/cms/shop/shopExperience.zod'

/**
 * Compact shop introduction. Communicates where the user is and what's
 * available, then gets out of the way so the grid stays near the fold. Reads
 * its copy/visibility from the CMS shop config; colors come from `--shop-*`.
 * The optional armory plate (CMS hero slot) layers above the ember atmosphere
 * and fails silently when unassigned.
 */
export function ShopIntro({
  config,
  heroBg,
  count,
}: {
  config: ShopConfig
  heroBg: string
  count: number
}) {
  if (!config.heroVisible) {
    return (
      <Container className="pt-[calc(var(--anvl-header-h)+2rem)]">
        <p className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.32em] text-[var(--shop-accent)] before:h-px before:w-8 before:bg-[var(--shop-accent)] before:content-['']">
          {config.eyebrow}
        </p>
        <h1 className="anvl-heading mt-3 text-[clamp(1.75rem,5vw,3rem)] font-normal leading-[0.9] text-[var(--shop-text)]">
          {config.heading}
        </h1>
      </Container>
    )
  }

  return (
    <section className="relative overflow-hidden border-b border-[var(--shop-card-border)]">
      <ForgeAtmosphere />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
        style={{ backgroundImage: `url('${heroBg}')` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(100deg, var(--shop-bg) 0%, color-mix(in srgb, var(--shop-bg) 78%, transparent) 42%, color-mix(in srgb, var(--shop-bg) 24%, transparent) 100%)',
        }}
      />
      <Container className="relative z-10 py-8 md:py-11">
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
      </Container>
    </section>
  )
}
