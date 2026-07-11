import { Container } from '@/shared/components/ui/Container'
import { RevealOnScroll } from '@/shared/components/motion/RevealOnScroll'
import { useHighlightOnArrival } from '@/shared/hooks/useHighlightOnArrival'
import { BRAND } from '@/shared/constants/brand'
import type { AboutResolvedContent, AboutResolvedOrb } from '../content/aboutContent.defaults'
import { orbImage } from '../content/resolveAboutContent'
import type { AboutPageAssets } from '../index'
import { AboutCtaLink } from '../components/AboutCtaLink'
import { AboutMediaFallback } from '../components/AboutMediaFallback'
import { AboutMarquee } from '../components/AboutMarquee'

/**
 * One orb rendered as a normal page section — the orbs ARE the About
 * sections on mobile. Renders whichever fields the orb carries (orbs are
 * free-form CMS sections) with the orb's own color as the section accent.
 */
function OrbSection({ orb, image }: { orb: AboutResolvedOrb; image?: string }) {
  const anchorId = `about-orb-${orb.id}`
  useHighlightOnArrival(anchorId)

  return (
    <section
      id={anchorId}
      className="scroll-mt-[var(--anvl-header-h)] py-12 md:py-16"
      aria-labelledby={`${anchorId}-title`}
    >
      <Container className="max-w-3xl">
        <RevealOnScroll>
          <div className="overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
            {image ? (
              <div className="relative aspect-[16/9]">
                <AboutMediaFallback media={image} vignette={false} />
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, transparent 40%, color-mix(in srgb, var(--color-surface) 92%, transparent) 100%)',
                  }}
                />
              </div>
            ) : null}
            {/* Orb-colored hairline — the section's identity, like its orb. */}
            <span
              aria-hidden="true"
              className="block h-px w-full"
              style={{
                background: `linear-gradient(90deg, ${orb.color}, color-mix(in srgb, ${orb.color} 30%, transparent) 70%, transparent)`,
              }}
            />
            <div className="p-6 md:p-8">
              <p className="anvl-display inline-flex items-center gap-2 text-[11px] tracking-[0.28em]" style={{ color: orb.color }}>
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: orb.color, boxShadow: `0 0 6px ${orb.color}` }}
                />
                {orb.eyebrow}
              </p>
              <h2
                id={`about-orb-${orb.id}-title`}
                className="anvl-heading mt-3 font-normal leading-[0.95] text-[clamp(1.6rem,5.5vw,2.4rem)] text-[var(--color-heading)]"
              >
                {orb.title}
              </h2>

              {orb.lines.length > 0 ? (
                <div className="mt-5 space-y-2">
                  {orb.lines.map((line, i) => (
                    <p
                      key={`${i}-${line}`}
                      className="anvl-heading font-normal leading-[1.1] text-[clamp(1.2rem,4.5vw,1.75rem)] text-[var(--color-heading)]/90"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}

              {orb.body ? (
                <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">{orb.body}</p>
              ) : null}

              {orb.detail ? (
                <p
                  className="mt-4 border-l-2 pl-3 font-sans text-[11px] uppercase tracking-[0.2em] text-[var(--color-heading)]/80"
                  style={{ borderColor: orb.color }}
                >
                  {orb.detail}
                </p>
              ) : null}

              {orb.points.length > 0 ? (
                <ul className="mt-5 space-y-2.5">
                  {orb.points.map((p) => (
                    <li key={p.label} className="flex gap-3">
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
                <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3">
                  {orb.stats.map((stat) => (
                    <div key={stat.id} className="border-l border-[var(--color-line)] pl-4">
                      <p className="anvl-heading font-normal leading-none text-[clamp(1.75rem,6vw,2.5rem)] text-[var(--color-heading)]">
                        {stat.value}
                        <span style={{ color: orb.color }}>{stat.suffix}</span>
                      </p>
                      <p className="mt-2 text-xs leading-snug text-[var(--color-text-muted)]">{stat.label}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {orb.primaryCta || orb.secondaryCta ? (
                <div className="mt-7 flex flex-wrap gap-3">
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
                <p className="anvl-display mt-7 text-xs tracking-[0.3em]" style={{ color: orb.color }}>
                  {orb.tagline}
                </p>
              ) : null}
            </div>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  )
}

/**
 * The normal About page — mobile, tablet, reduced-motion, and no-WebGL
 * desktop all land here. A clean scrolling page: full-bleed hero under the
 * transparent header, then **one section per orb** (the same CMS orbs that
 * orbit the desktop altar), the marquee band, and the closing brand block.
 * Light once-only reveals (IntersectionObserver + CSS), native scroll, no pins, no WebGL.
 */
export function AboutMobilePage({
  content,
  assets,
}: {
  content: AboutResolvedContent
  assets: AboutPageAssets
}) {
  return (
    <div className="relative">
      {/* Hero — full-bleed under the transparent header. */}
      <section
        className="relative flex min-h-[86svh] items-end overflow-hidden pb-14 pt-[calc(var(--anvl-header-h)+3rem)]"
        aria-labelledby="about-hero-heading"
      >
        <div className="absolute inset-0 -z-10">
          {assets.heroImage ? (
            <img
              src={assets.heroImage}
              alt=""
              width={2560}
              height={1440}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="h-full w-full"
              style={{
                background:
                  'radial-gradient(ellipse 120% 90% at 55% 35%, var(--color-surface-elevated,#1D1F21) 0%, var(--color-bg,#0B0B0C) 70%)',
              }}
            />
          )}
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 42%, transparent) 0%, transparent 34%, color-mix(in srgb, var(--color-bg) 88%, transparent) 88%, var(--color-bg) 100%)',
            }}
          />
        </div>
        <Container>
          <p className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.32em] text-[var(--color-highlight-bright)] before:h-px before:w-8 before:bg-[var(--color-highlight)] before:content-['']">
            {content.hero.eyebrow}
          </p>
          <h1
            id="about-hero-heading"
            className="anvl-heading mt-4 max-w-3xl font-normal leading-[0.9] tracking-[-0.01em] text-[clamp(2.5rem,10vw,5rem)] text-[var(--color-heading)]"
          >
            {content.hero.headline}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
            {content.hero.subhead}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AboutCtaLink href={content.hero.primaryCta.href} variant="primary">
              {content.hero.primaryCta.label}
            </AboutCtaLink>
            <AboutCtaLink href={content.hero.secondaryCta.href} variant="secondary">
              {content.hero.secondaryCta.label}
            </AboutCtaLink>
          </div>
        </Container>
        {/* CMS scroll cue — invites the reader down into the orb sections. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
          <span className="anvl-display text-[10px] tracking-[0.32em] text-[var(--color-heading)]/70">
            {content.hero.scrollCue} ↓
          </span>
        </div>
      </section>

      {/* The orbs — one section each. */}
      {content.orbs.map((orb) => (
        <OrbSection key={orb.id} orb={orb} image={orbImage(orb, assets)} />
      ))}

      <AboutMarquee text={content.marquee.text} />

      {/* Closing brand block. */}
      <section className="py-16 text-center md:py-20">
        <Container>
          <RevealOnScroll>
            <div className="border-t border-[var(--color-line)] pt-10">
              <p className="anvl-heading font-normal leading-none text-[clamp(1.75rem,6vw,3.5rem)] text-[var(--color-heading)]">
                {BRAND.name}
              </p>
              <p className="anvl-display mt-2 text-xs tracking-[0.3em] text-[var(--color-highlight-bright)]">
                {BRAND.tagline}
              </p>
            </div>
          </RevealOnScroll>
        </Container>
      </section>
    </div>
  )
}
