import { cn } from '@/shared/lib/cn'
import type { AboutResolvedOrb } from '../content/aboutContent.defaults'
import { AboutCtaLink } from './AboutCtaLink'
import {
  ABOUT_WORLD_MAP_HEIGHT,
  ABOUT_WORLD_MAP_SRC,
  ABOUT_WORLD_MAP_WIDTH,
} from './aboutWorldMap'

/**
 * The four non-classic orb layout presets ('text' / 'stats' / 'map' /
 * 'timeline') composed by {@link AboutOrbContent}. Each preset is a designed
 * arrangement of the orb's fields — the orb's own color stays the accent, the
 * shared staggered-reveal + stat count-up markers are carried so scroll
 * choreography works unchanged, and every block renders only when it carries
 * content (empty stats → no grid, no pins → no map).
 */

interface LayoutProps {
  orb: AboutResolvedOrb
  headingId: string
  /** true = desktop chapter scale, false = static section scale. */
  wide: boolean
  /** Marks an element with its reveal ROLE — the chapter builder gives every
   *  role its own entrance. Returns `{}` outside reveal mode. */
  mark: (role: string) => Record<string, string>
  reveal: boolean
}

/** Shared eyebrow + title header — every preset opens with the orb identity. */
function OrbHeader({ orb, headingId, wide, mark }: Omit<LayoutProps, 'reveal'>) {
  return (
    <>
      <p
        {...mark('eyebrow')}
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
        {...mark('title')}
        className={cn(
          'anvl-heading mt-3 font-normal leading-[0.95] text-[var(--color-heading)]',
          wide ? 'max-w-md text-[clamp(1.75rem,3vw,2.75rem)]' : 'text-[clamp(1.6rem,5.5vw,2.4rem)]',
        )}
      >
        {orb.title}
      </h2>
    </>
  )
}

/** Shared CTA row + tagline tail (renders only when the orb carries them). */
function OrbFooter({ orb, wide, mark }: Pick<LayoutProps, 'orb' | 'wide' | 'mark'>) {
  return (
    <>
      {orb.primaryCta || orb.secondaryCta ? (
        <div {...mark('cta')} className={cn('flex flex-wrap gap-3', wide ? 'mt-8' : 'mt-7')}>
          {/* Tinted to the orb so a chapter's buttons belong to that section
              rather than reading as generic site chrome. */}
          {orb.primaryCta ? (
            <AboutCtaLink href={orb.primaryCta.href} variant="primary" accent={orb.color}>
              {orb.primaryCta.label}
            </AboutCtaLink>
          ) : null}
          {orb.secondaryCta ? (
            <AboutCtaLink href={orb.secondaryCta.href} variant="secondary" accent={orb.color}>
              {orb.secondaryCta.label}
            </AboutCtaLink>
          ) : null}
        </div>
      ) : null}
      {orb.tagline ? (
        <p
          {...mark('tagline')}
          className={cn('anvl-display text-xs tracking-[0.3em]', wide ? 'mt-8' : 'mt-7')}
          style={{ color: orb.color }}
        >
          {orb.tagline}
        </p>
      ) : null}
    </>
  )
}

function OrbBody({ orb, wide, mark }: Pick<LayoutProps, 'orb' | 'wide' | 'mark'>) {
  if (!orb.body) return null
  return (
    <p
      {...mark('body')}
      className={cn(
        'leading-relaxed text-[var(--color-text-muted)]',
        wide ? 'mt-5 max-w-lg text-base' : 'mt-4 text-sm md:text-base',
      )}
    >
      {orb.body}
    </p>
  )
}

/** 'text' — clean editorial: header, lead subhead, body, spec detail line. */
export function AboutOrbTextLayout({ orb, headingId, wide, mark }: LayoutProps) {
  return (
    <div data-orb-layout="text">
      <OrbHeader orb={orb} headingId={headingId} wide={wide} mark={mark} />
      {orb.subhead ? (
        <p
          {...mark('body')}
          className={cn(
            'font-medium leading-snug text-[var(--color-heading)]/90',
            wide ? 'mt-5 max-w-lg text-lg md:text-xl' : 'mt-4 text-base md:text-lg',
          )}
        >
          {orb.subhead}
        </p>
      ) : null}
      <OrbBody orb={orb} wide={wide} mark={mark} />
      {orb.detail ? (
        <p
          {...mark('detail')}
          className={cn(
            'border-l-2 pl-3 font-sans uppercase text-[var(--color-heading)]/80',
            wide ? 'mt-5 text-xs tracking-[0.22em]' : 'mt-4 text-[11px] tracking-[0.2em]',
          )}
          style={{ borderColor: orb.color }}
        >
          {orb.detail}
        </p>
      ) : null}
      <OrbFooter orb={orb} wide={wide} mark={mark} />
    </div>
  )
}

/** 'stats' — the stats array is the star: big forged numerals over an intro. */
export function AboutOrbStatsLayout({ orb, headingId, wide, mark, reveal }: LayoutProps) {
  return (
    <div data-orb-layout="stats">
      <OrbHeader orb={orb} headingId={headingId} wide={wide} mark={mark} />
      <OrbBody orb={orb} wide={wide} mark={mark} />
      {orb.stats.length > 0 ? (
        <div
          className={cn(
            'grid grid-cols-2 sm:grid-cols-3',
            wide ? 'mt-8 gap-x-7 gap-y-8' : 'mt-6 gap-x-5 gap-y-6',
          )}
        >
          {orb.stats.map((stat) => {
            const numeric = Number(stat.value)
            const countUp = reveal && stat.value.trim().length > 0 && Number.isFinite(numeric)
            return (
              <div
                key={stat.id}
                {...mark('stat')}
                className="border-t pt-3"
                style={{ borderColor: `color-mix(in srgb, ${orb.color} 35%, var(--color-line))` }}
              >
                <p
                  className={cn(
                    'anvl-heading font-normal leading-none text-[var(--color-heading)]',
                    wide
                      ? 'text-[clamp(2.25rem,3.6vw,3.25rem)]'
                      : 'text-[clamp(1.9rem,7vw,2.6rem)]',
                  )}
                >
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
                <p className="mt-2 text-xs leading-snug text-[var(--color-text-muted)]">
                  {stat.label}
                </p>
              </div>
            )
          })}
        </div>
      ) : null}
      <OrbFooter orb={orb} wide={wide} mark={mark} />
    </div>
  )
}

/** 'map' — the world map with the orb's percent-positioned, glowing pins. */
export function AboutOrbMapLayout({ orb, headingId, wide, mark }: LayoutProps) {
  return (
    <div data-orb-layout="map">
      <OrbHeader orb={orb} headingId={headingId} wide={wide} mark={mark} />
      <OrbBody orb={orb} wide={wide} mark={mark} />
      {orb.mapPins.length > 0 ? (
        <div
          {...mark('block')}
          data-about-map
          className={cn(
            'relative w-full overflow-hidden rounded-lg border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_45%,transparent)]',
            wide ? 'mt-6' : 'mt-5',
          )}
        >
          <img
            src={ABOUT_WORLD_MAP_SRC}
            alt=""
            width={ABOUT_WORLD_MAP_WIDTH}
            height={ABOUT_WORLD_MAP_HEIGHT}
            loading="lazy"
            decoding="async"
            className="h-auto w-full select-none"
          />
          {orb.mapPins.map((pin) => (
            <span
              key={pin.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            >
              <span
                aria-hidden="true"
                className="block h-2 w-2 rounded-full"
                style={{
                  backgroundColor: orb.color,
                  boxShadow: `0 0 8px ${orb.color}, 0 0 18px color-mix(in srgb, ${orb.color} 55%, transparent)`,
                }}
              />
              {pin.label ? (
                <span
                  className="anvl-display absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-full border border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_78%,transparent)] px-2 py-0.5 text-[9px] tracking-[0.18em] text-[var(--color-heading)]/90"
                >
                  {pin.label}
                </span>
              ) : null}
            </span>
          ))}
        </div>
      ) : null}
      <OrbFooter orb={orb} wide={wide} mark={mark} />
    </div>
  )
}

/** 'timeline' — vertical milestones down a connecting hairline. */
export function AboutOrbTimelineLayout({ orb, headingId, wide, mark }: LayoutProps) {
  return (
    <div data-orb-layout="timeline">
      <OrbHeader orb={orb} headingId={headingId} wide={wide} mark={mark} />
      <OrbBody orb={orb} wide={wide} mark={mark} />
      {orb.timeline.length > 0 ? (
        <ol
          data-about-timeline
          className={cn('border-l pl-6', wide ? 'mt-7 space-y-7' : 'mt-6 space-y-6')}
          style={{ borderColor: `color-mix(in srgb, ${orb.color} 35%, var(--color-line))` }}
        >
          {orb.timeline.map((entry) => (
            <li key={entry.id} {...mark('point')} className="relative">
              {/* Milestone dot riding the connecting hairline. */}
              <span
                aria-hidden="true"
                className="absolute -left-[1.87rem] top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-bg)]"
                style={{ backgroundColor: orb.color, boxShadow: `0 0 8px ${orb.color}` }}
              />
              {entry.marker ? (
                <p
                  className="anvl-display text-[11px] tracking-[0.24em]"
                  style={{ color: orb.color }}
                >
                  {entry.marker}
                </p>
              ) : null}
              {entry.title ? (
                <p
                  className={cn(
                    'anvl-heading font-normal text-[var(--color-heading)]',
                    entry.marker ? 'mt-1.5' : '',
                    wide ? 'text-xl' : 'text-lg',
                  )}
                >
                  {entry.title}
                </p>
              ) : null}
              {entry.body ? (
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {entry.body}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}
      <OrbFooter orb={orb} wide={wide} mark={mark} />
    </div>
  )
}
