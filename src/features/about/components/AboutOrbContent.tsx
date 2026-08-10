import { cn } from '@/shared/lib/cn'
import type { AboutResolvedOrb } from '../content/aboutContent.defaults'
import { AboutCtaLink } from './AboutCtaLink'
import { AboutMediaFallback } from './AboutMediaFallback'
import {
  AboutOrbMapLayout,
  AboutOrbStatsLayout,
  AboutOrbTextLayout,
  AboutOrbTimelineLayout,
} from './AboutOrbLayouts'

/**
 * ONE orb content presentation shared by the desktop scroll chapters and the
 * static page's stacked sections (finding 6 — the two surfaces previously
 * duplicated slightly-divergent markup). Each orb carries a **layout preset**
 * (`orb.layout`): 'classic' is the original free-form render (every field
 * renders only when it carries content — unchanged below), while
 * 'text' / 'stats' / 'map' / 'timeline' compose designed arrangements
 * ({@link AboutOrbLayouts}). All presets keep the orb's own color as the
 * accent and carry the shared reveal/count-up markers
 * (`data-orb-reveal` / `data-orb-stat-value`), so scroll choreography works
 * for every layout.
 */

interface AboutOrbHeroBandProps {
  orb: AboutResolvedOrb
  image: string
  /** Adds the staggered-reveal marker for the chapter GSAP pass. */
  reveal?: boolean
  className?: string
}

/**
 * Hero image band — object-cover media under a bottom scrim, with the orb's
 * label riding the image on its color chip (the Arsenal hotspot-card
 * language). Only rendered when the orb has an image; the no-image variant
 * simply starts at the eyebrow.
 */
export function AboutOrbHeroBand({ orb, image, reveal = false, className }: AboutOrbHeroBandProps) {
  return (
    <div
      {...(reveal ? { 'data-orb-reveal': '' } : {})}
      className={cn('relative aspect-[16/8] w-full overflow-hidden', className)}
    >
      <AboutMediaFallback media={image} vignette={false} />
      {/* Scrim — keeps the label legible and grounds the band into the panel. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 18%, transparent) 0%, transparent 32%, color-mix(in srgb, var(--color-surface) 88%, transparent) 92%, var(--color-surface) 100%)',
        }}
      />
      {/* Orb-colored hairline along the band's base — its identity line. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px"
        style={{
          background: `linear-gradient(90deg, ${orb.color}, color-mix(in srgb, ${orb.color} 30%, transparent) 70%, transparent)`,
        }}
      />
      <p className="anvl-display absolute bottom-4 left-6 inline-flex items-center gap-2 text-[11px] tracking-[0.3em] md:left-8">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: orb.color, boxShadow: `0 0 8px ${orb.color}` }}
        />
        <span style={{ color: orb.color }}>{orb.label}</span>
      </p>
    </div>
  )
}

interface AboutOrbContentProps {
  orb: AboutResolvedOrb
  /** `id` for the visible heading (aria-labelledby wiring stays caller-side). */
  headingId: string
  /**
   * `chapter` — the desktop scroll chapter's larger scale; `section` — the
   * static page's in-flow scale. Same structure, tuned clamps.
   */
  variant: 'chapter' | 'section'
  /** Adds `data-orb-reveal` / stat count-up markers for the chapter GSAP pass. */
  reveal?: boolean
}

export function AboutOrbContent({ orb, headingId, variant, reveal = false }: AboutOrbContentProps) {
  const wide = variant === 'chapter'
  const r = reveal ? { 'data-orb-reveal': '' } : {}

  // Layout presets — 'classic' falls through to the original free-form render.
  if (orb.layout === 'text')
    return <AboutOrbTextLayout orb={orb} headingId={headingId} wide={wide} r={r} reveal={reveal} />
  if (orb.layout === 'stats')
    return (
      <AboutOrbStatsLayout orb={orb} headingId={headingId} wide={wide} r={r} reveal={reveal} />
    )
  if (orb.layout === 'map')
    return <AboutOrbMapLayout orb={orb} headingId={headingId} wide={wide} r={r} reveal={reveal} />
  if (orb.layout === 'timeline')
    return (
      <AboutOrbTimelineLayout orb={orb} headingId={headingId} wide={wide} r={r} reveal={reveal} />
    )

  return (
    <>
      <p
        {...r}
        className={cn(
          'anvl-display inline-flex items-center gap-2',
          wide ? 'text-xs tracking-[0.32em]' : 'text-[11px] tracking-[0.28em]',
        )}
        style={{ color: orb.color }}
      >
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: orb.color, boxShadow: `0 0 6px ${orb.color}` }}
        />
        {orb.eyebrow}
      </p>
      <h2
        id={headingId}
        {...r}
        className={cn(
          'anvl-heading mt-3 font-normal leading-[0.95] text-[var(--color-heading)]',
          wide
            ? 'max-w-md text-[clamp(1.75rem,3vw,2.75rem)]'
            : 'text-[clamp(1.6rem,5.5vw,2.4rem)]',
        )}
      >
        {orb.title}
      </h2>

      {orb.lines.length > 0 ? (
        <div className={cn(wide ? 'mt-6 space-y-2.5' : 'mt-5 space-y-2')}>
          {orb.lines.map((line, i) => (
            <p
              key={`${i}-${line}`}
              {...r}
              className={cn(
                'anvl-heading font-normal text-[var(--color-heading)]/90',
                wide
                  ? 'leading-tight text-[clamp(1.15rem,1.8vw,1.6rem)]'
                  : 'leading-[1.1] text-[clamp(1.2rem,4.5vw,1.75rem)]',
              )}
            >
              {line}
            </p>
          ))}
        </div>
      ) : null}

      {orb.body ? (
        <p
          {...r}
          className={cn(
            'leading-relaxed text-[var(--color-text-muted)]',
            wide ? 'mt-5 max-w-lg text-base' : 'mt-4 text-sm md:text-base',
          )}
        >
          {orb.body}
        </p>
      ) : null}

      {orb.detail ? (
        <p
          {...r}
          className={cn(
            'border-l-2 pl-3 font-sans uppercase text-[var(--color-heading)]/80',
            wide
              ? 'mt-5 text-xs tracking-[0.22em]'
              : 'mt-4 text-[11px] tracking-[0.2em]',
          )}
          style={{ borderColor: orb.color }}
        >
          {orb.detail}
        </p>
      ) : null}

      {orb.points.length > 0 ? (
        <ul className={cn(wide ? 'mt-6 space-y-3' : 'mt-5 space-y-2.5')}>
          {orb.points.map((p) => (
            <li key={p.label} {...r} className="flex gap-3">
              <span
                aria-hidden="true"
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: orb.color }}
              />
              <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
                <span className="anvl-display mr-2 text-[11px] tracking-[0.18em] text-[var(--color-heading)]">
                  {p.label}
                </span>
                {p.description}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {orb.stats.length > 0 ? (
        <div
          className={cn(
            'grid grid-cols-2 gap-x-6 sm:grid-cols-3',
            wide ? 'mt-7 gap-y-7' : 'mt-6 gap-y-6',
          )}
        >
          {orb.stats.map((stat) => {
            const numeric = Number(stat.value)
            const countUp =
              reveal && stat.value.trim().length > 0 && Number.isFinite(numeric)
            return (
              <div
                key={stat.id}
                {...r}
                className={wide ? undefined : 'border-l border-[var(--color-line)] pl-4'}
              >
                <p className="anvl-heading font-normal leading-none text-[clamp(1.75rem,2.6vw,2.5rem)] text-[var(--color-heading)]">
                  {countUp ? (
                    <>
                      <span data-orb-stat-value data-stat-target={numeric}>
                        {stat.value}
                      </span>
                      <span style={{ color: orb.color }}>{stat.suffix}</span>
                    </>
                  ) : (
                    <>
                      {stat.value}
                      <span style={{ color: orb.color }}>{stat.suffix}</span>
                    </>
                  )}
                </p>
                <p className="mt-1.5 text-xs leading-snug text-[var(--color-text-muted)]">
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>
      ) : null}

      {orb.primaryCta || orb.secondaryCta ? (
        <div {...r} className={cn('flex flex-wrap gap-3', wide ? 'mt-8' : 'mt-7')}>
          {orb.primaryCta ? (
            <AboutCtaLink href={orb.primaryCta.href} variant="primary">
              {orb.primaryCta.label}
            </AboutCtaLink>
          ) : null}
          {orb.secondaryCta ? (
            <AboutCtaLink href={orb.secondaryCta.href} variant="secondary">
              {orb.secondaryCta.label}
            </AboutCtaLink>
          ) : null}
        </div>
      ) : null}

      {orb.tagline ? (
        <p
          {...r}
          className={cn('anvl-display text-xs tracking-[0.3em]', wide ? 'mt-8' : 'mt-7')}
          style={{ color: orb.color }}
        >
          {orb.tagline}
        </p>
      ) : null}
    </>
  )
}
