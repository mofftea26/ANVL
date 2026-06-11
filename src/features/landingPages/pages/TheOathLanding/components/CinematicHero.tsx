import { Container } from '@/shared/components/ui/Container'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import { oathAsset, oathSceneMedia } from '../theOathAssets'
import { OathCmsMark } from './OathCmsMark'
import { OATH_HERO, OATH_META } from '../data'
import { OathCtaLink } from './OathCtaLink'
import { ScrollCue } from './ScrollCue'

const DEFAULT_HERO_VIDEO = '/videos/WarriorHero1.mp4'

function isVideoSrc(src: string): boolean {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(src)
}

/**
 * Scene 01 — Hero. The forge film is anchored to the **right** of the title and
 * rendered smaller than full-bleed (so a low-res source upscales less and stays
 * crisp), then **blended into the dark title column** by a left→right fade so it
 * still reads as one continuous background rather than a panel. The frame is
 * driven by scroll progress (see `buildHero`); cropping favours the top
 * (`object-top`) so the important upper part is never cut. On mobile it falls
 * back to a full-bleed backdrop with a bottom veil for legibility.
 */
export function CinematicHero() {
  const heroMedia = oathSceneMedia('heroMedia') ?? DEFAULT_HERO_VIDEO
  const heroPoster = oathAsset('heroPoster')
  const heroIsVideo = isVideoSrc(heroMedia)

  return (
    <section
      data-scene="hero"
      className="relative flex h-[var(--anvl-section-h)] w-full items-end bg-[var(--color-bg)]"
      aria-label="ANVL Athletics — Drop 01, The Oath"
    >
      {/* Media: full-bleed on mobile, anchored to the right on tablet/desktop and
          **capped in width** (`lg:max-w-*`) so a low-res source is not stretched
          across large monitors — the smaller the rendered box, the crisper it
          reads. Sized to the hero section (`inset-0`, no header overhang) so its
          height fits exactly; crops from the bottom (`object-top`). Frame driven
          by scroll — see `buildHero`. */}
      <div
        data-hero-media
        className="hero-media-blend absolute inset-0 z-0 will-change-transform md:left-[28%] lg:left-auto lg:right-0 lg:w-[64%] lg:max-w-[980px] 2xl:max-w-[1080px]"
      >
        {heroIsVideo ? (
          <video
            data-hero-video
            className="h-full w-full object-cover object-top"
            src={heroMedia}
            poster={heroPoster}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          />
        ) : (
          <img
            src={heroMedia}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-cover object-top"
            decoding="async"
          />
        )}
      </div>

      {/* Desktop legibility wash under the title (the video itself is masked to
          fade, so this is gentle). Tagged as the veil so the scroll deepen
          still applies. */}
      <div
        data-hero-veil
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[calc(-1*var(--anvl-header-h))] z-[1] hidden md:block"
        style={{
          background:
            'linear-gradient(90deg, rgba(11,11,12,0.92) 0%, rgba(11,11,12,0.55) 34%, rgba(11,11,12,0.12) 58%, transparent 76%)',
        }}
      />
      {/* Mobile legibility veil — bottom-up over the full-bleed video. */}
      <div
        data-hero-veil
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1] md:hidden"
        style={{
          background:
            'linear-gradient(0deg, rgba(11,11,12,0.94) 0%, rgba(11,11,12,0.45) 42%, rgba(11,11,12,0.15) 80%)',
        }}
      />
      {/* Shared vignette + ember floor glow. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[calc(-1*var(--anvl-header-h))] z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 110% 90% at 60% 55%, transparent 38%, rgba(0,0,0,0.5) 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[40%]"
        style={{
          background:
            'radial-gradient(120% 100% at 50% 100%, var(--color-ember-soft) 0%, transparent 60%)',
        }}
      />
      <GrainOverlay />

      <Container className="relative z-10 w-full pb-28 md:pb-24">
        <div data-hero-content className="mx-auto max-w-xl text-center will-change-transform md:mx-0 md:max-w-[62%] md:text-left lg:max-w-[48%]">
          {/* Small ANVL stacked lockup, sitting above the drop tag. */}
          <div data-hero-fade className="flex justify-center md:justify-start">
            <OathCmsMark
              slot="dropLogo"
              className="h-[4.5rem] w-[4.5rem] sm:h-[5.25rem] sm:w-[5.25rem] md:h-[6.75rem] md:w-[6.75rem]"
              width={108}
              height={108}
            />
          </div>

          <div data-hero-fade className="mt-5 flex items-center justify-center gap-4 md:justify-start">
            <span className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.34em] text-[var(--color-ember-bright)] before:h-px before:w-10 before:bg-[var(--color-ember)] before:content-[''] max-md:after:h-px max-md:after:w-10 max-md:after:bg-[var(--color-ember)] max-md:after:content-['']">
              {OATH_HERO.eyebrow}
            </span>
          </div>

          {/* Title — word mask-in. */}
          <h1 className="anvl-heading mt-5 font-normal leading-[0.82] tracking-[-0.01em] text-[clamp(2.75rem,8vw,7rem)]">
            {OATH_HERO.title.split(' ').map((word, i) => (
              <span key={`${word}-${i}`} data-hero-line className="block overflow-hidden pb-[0.06em]">
                <span data-hero-line-inner className="inline-block will-change-transform">
                  {word}
                </span>
              </span>
            ))}
          </h1>

          {/* Drawing ember underline. */}
          <div className="mx-auto mt-4 h-[2px] w-full max-w-sm md:mx-0">
            <div
              data-hero-underline
              className="h-full w-full origin-center md:origin-left"
              style={{
                background:
                  'linear-gradient(90deg, var(--color-ember-bright), var(--color-ember) 60%, transparent)',
              }}
            />
          </div>

          <p
            data-hero-fade
            className="mx-auto mt-7 max-w-md text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-[15px] md:mx-0 md:text-base"
          >
            {OATH_HERO.subhead}
          </p>

          {/* Mobile: buttons sit side by side (each fills half the row), centred.
              They return to natural left-aligned width once there is room at md+. */}
          <div data-hero-fade className="mt-8 flex items-center justify-center gap-3 sm:flex-wrap md:justify-start">
            <OathCtaLink
              href={OATH_HERO.primaryCta.href}
              variant="primary"
              className="flex-1 sm:flex-none"
            >
              {OATH_HERO.primaryCta.label}
            </OathCtaLink>
            <OathCtaLink
              href={OATH_HERO.secondaryCta.href}
              variant="secondary"
              className="flex-1 sm:flex-none"
            >
              {OATH_HERO.secondaryCta.label}
            </OathCtaLink>
          </div>

          {/* Technical metadata strip — desktop/tablet only; on mobile it just
              clutters the frame and collided with the scroll cue. */}
          <div
            data-hero-fade
            className="anvl-display mt-10 hidden flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--color-line)] pt-5 text-[10px] tracking-[0.28em] text-[var(--color-text-muted)] md:flex"
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
