import { Container } from '@/shared/components/ui/Container'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import { OATH_HERO, OATH_META } from '../data'
import { OathCtaLink } from './OathCtaLink'
import { ScrollCue } from './ScrollCue'

/**
 * Scene 01 — Hero. A forge film plays as a full-bleed background at normal
 * playback (smooth — no frame-by-frame scroll seeking, which stuttered). Scroll
 * drives only GPU transforms: the media does a slow Ken-Burns push while the
 * title card drifts up, the veil deepens, and the section releases into the
 * forge. The headline masks in word-by-word with a drawing ember underline and a
 * one-shot light sweep. Mobile loops muted; reduced motion holds a still frame.
 */
export function CinematicHero() {
  return (
    <section
      data-scene="hero"
      className="relative -mt-[var(--anvl-header-h)] flex h-[100svh] w-full items-end overflow-hidden bg-[var(--color-bg)]"
      aria-label="ANVL Athletics — Drop 01, The Oath"
    >
      {/* Media layer extends up behind the transparent header (which sits over
          the hero) while the content below stays clear of it. The video frame
          is driven by scroll progress — see `buildHero`. */}
      <div
        data-hero-media
        className="absolute inset-x-0 bottom-0 top-[calc(-1*var(--anvl-header-h))] z-0 will-change-transform"
      >
        <video
          data-hero-video
          className="h-full w-full object-cover"
          src="/videos/WarriorHero1.mp4"
          muted
          playsInline
          loop
          preload="auto"
          aria-hidden="true"
        />
      </div>

      {/* Legibility veil — deepens as you scroll away. */}
      <div
        data-hero-veil
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(0deg, rgba(11,11,12,0.92) 0%, rgba(11,11,12,0.45) 38%, rgba(11,11,12,0.12) 70%, rgba(11,11,12,0.35) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 100% 90% at 50% 60%, transparent 32%, rgba(0,0,0,0.6) 100%)',
        }}
      />
      {/* Ember floor glow rising from the bottom edge. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[45%]"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 100%, var(--color-ember-soft) 0%, transparent 60%)',
        }}
      />
      <GrainOverlay />

      <Container className="relative z-10 w-full pb-16 md:pb-24">
        <div data-hero-content className="max-w-5xl will-change-transform">
          {/* Eyebrow + side index. */}
          <div data-hero-fade className="flex items-center gap-4">
            <span className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.34em] text-[var(--color-ember-bright)] before:h-px before:w-10 before:bg-[var(--color-ember)] before:content-['']">
              {OATH_HERO.eyebrow}
            </span>
          </div>

          {/* Title — word mask-in. */}
          <h1 className="anvl-heading mt-5 font-normal leading-[0.8] tracking-[-0.01em] text-[clamp(3rem,12vw,10rem)]">
            {OATH_HERO.title.split(' ').map((word, i) => (
              <span key={`${word}-${i}`} data-hero-line className="block overflow-hidden pb-[0.06em]">
                <span data-hero-line-inner className="inline-block will-change-transform">
                  {word}
                </span>
              </span>
            ))}
          </h1>

          {/* Drawing ember underline. */}
          <div className="mt-4 h-[2px] w-full max-w-md origin-left">
            <div
              data-hero-underline
              className="h-full w-full origin-left"
              style={{
                background:
                  'linear-gradient(90deg, var(--color-ember-bright), var(--color-ember) 60%, transparent)',
              }}
            />
          </div>

          <p
            data-hero-fade
            className="mt-7 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-[15px] md:text-base"
          >
            {OATH_HERO.subhead}
          </p>

          <div data-hero-fade className="mt-8 flex flex-wrap items-center gap-3">
            <OathCtaLink href={OATH_HERO.primaryCta.href} variant="primary">
              {OATH_HERO.primaryCta.label}
            </OathCtaLink>
            <OathCtaLink href={OATH_HERO.secondaryCta.href} variant="secondary">
              {OATH_HERO.secondaryCta.label}
            </OathCtaLink>
          </div>

          {/* Technical metadata strip. */}
          <div
            data-hero-fade
            className="anvl-display mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--color-line)] pt-5 text-[10px] tracking-[0.28em] text-[var(--color-text-muted)]"
          >
            <span className="text-[var(--color-ember-bright)]">{OATH_META.drop}</span>
            <span>{OATH_META.coords}</span>
            <span>{OATH_META.origin}</span>
          </div>
        </div>
      </Container>

      <div data-hero-fade className="absolute inset-x-0 bottom-7 z-10 flex justify-center">
        <ScrollCue />
      </div>
    </section>
  )
}
