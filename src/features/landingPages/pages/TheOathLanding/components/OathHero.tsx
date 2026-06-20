import { ChevronDown } from 'lucide-react'
import { Container } from '@/shared/components/ui/Container'
import type { OathResolvedContent } from '../content/oathContent.defaults'
import {
  oathHeroDesktopVideo,
  oathHeroImage,
  oathHeroMediaMode,
  oathHeroMobileVideo,
  oathHeroPoster,
  oathHeroRevealMedia,
} from '../theOathAssets'
import { OathCmsMark } from './OathCmsMark'
import { OathCtaLink } from './OathCtaLink'

/** Coordinates-style metadata (Beirut, LB) — code-owned cinematic detail. */
const OATH_META = {
  coords: 'N 33.8886° · E 35.5012°',
  origin: 'Beirut · LB',
  drop: 'DR-01',
} as const

/** Soft circular spotlight falloff (Lithos-style stops), centred on the cursor. */
const SPOTLIGHT_MASK =
  'radial-gradient(circle var(--spotlight-r, 260px) at var(--spotlight-x, 50%) var(--spotlight-y, 50%), #000 0%, #000 38%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.18) 80%, transparent 100%)'

/**
 * Feather mask for the contained video panel: every edge fades into the themed
 * shadow (no hard cut-off). The left edge feathers strongest (it bleeds into the
 * copy column) and the right/outer edges fade out so the panel dissolves into
 * the dark background instead of looking clipped. Intersect of an X + Y fade.
 */
const MEDIA_FEATHER_MASK =
  'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.35) 9%, #000 22%, #000 80%, rgba(0,0,0,0.35) 93%, transparent 100%), linear-gradient(0deg, transparent 0%, #000 8%, #000 92%, transparent 100%)'

/**
 * Scene 01 — Hero. Exactly one screen tall (`--anvl-section-h` = svh − header),
 * so the "Approach" cue sits at the bottom without scrolling. The forge film is
 * a **contained, right-anchored panel** (width-capped so a low-res source isn't
 * stretched) whose every edge **feathers into the themed shadow**
 * (`MEDIA_FEATHER_MASK`) — no hard cut-off. The video itself stays **fully
 * opaque**; legibility comes from a left copy scrim only (which also extends up
 * under the header so there's no seam at rest). It is scroll-scrubbed on desktop
 * and loops on mobile; on desktop/tablet it **drifts from the right toward
 * centre** as the hero scrolls (`buildOathHero`), tracking the 3D monolith (the
 * persistent WebGL layer) which sits small above the eyebrow and **only drifts
 * to centre — staying the same small size until the finale enlarges it**. A
 * cursor spotlight reveals a second "forged" layer over the base film
 * (`heroRevealMedia`, or a themed ember gradient) — a full-bleed layer that does
 * not move. The film + reveal are fixed behind the WebGL canvas on desktop
 * (`md:fixed`, so the monolith renders over them) and absolute within the
 * section on mobile. Markup + `data-*` hooks only — motion lives in
 * `buildOathHero` / `buildOathSpotlight`.
 */
export function OathHero({ hero }: { hero: OathResolvedContent['hero'] }) {
  const heroMode = oathHeroMediaMode()
  const heroImage = oathHeroImage()
  const desktopVideo = oathHeroDesktopVideo()
  const mobileVideo = oathHeroMobileVideo()
  const poster = oathHeroPoster()
  const revealMedia = oathHeroRevealMedia()

  return (
    <section
      data-scene="hero"
      className="relative flex min-h-[var(--anvl-section-h)] w-full items-center"
      aria-labelledby="oath-hero-heading"
    >
      {/* Forge film + spotlight reveal. Fixed behind the WebGL canvas on desktop
          (so the monolith renders over it); absolute within the section on
          mobile (no canvas there). Fades out as the hero ends (buildOathHero). */}
      <div
        data-hero-film
        aria-hidden="true"
        className="absolute inset-0 -z-10 overflow-hidden md:fixed md:-z-20"
      >
        {/* Base film — a contained, right-anchored panel (full-bleed on mobile,
            width-capped on tablet/desktop) that drifts right→centre on scroll
            (buildOathHero translates this element; transform only). Every edge
            feathers into the themed shadow (MEDIA_FEATHER_MASK) so the right/outer
            edges dissolve instead of hard-cutting. Clips its own Ken-Burns scale. */}
        <div
          data-hero-media
          className="absolute inset-0 overflow-hidden will-change-transform md:left-[26%] lg:left-auto lg:right-0 lg:w-[64%] lg:max-w-[980px] 2xl:max-w-[1080px]"
          style={{
            maskImage: MEDIA_FEATHER_MASK,
            WebkitMaskImage: MEDIA_FEATHER_MASK,
            maskComposite: 'intersect',
            WebkitMaskComposite: 'source-in',
          }}
        >
          <div data-hero-kenburns className="absolute inset-0 will-change-transform">
            {heroMode === 'image' && heroImage ? (
              <img
                src={heroImage}
                alt=""
                className="h-full w-full object-cover object-top"
                decoding="async"
              />
            ) : (
              <>
                <video
                  data-hero-video-desktop
                  className="hidden h-full w-full object-cover object-top md:block"
                  src={desktopVideo}
                  poster={poster}
                  muted
                  playsInline
                  preload="auto"
                />
                <video
                  data-hero-video-mobile
                  className="h-full w-full object-cover object-center md:hidden"
                  src={mobileVideo}
                  muted
                  playsInline
                  loop
                  preload="auto"
                />
              </>
            )}
          </div>
        </div>

        {/* Spotlight reveal layer — a second "forged" grade revealed in a soft
            circle under the cursor. Full-bleed and stationary (independent of the
            drifting base panel). Image when assigned, else a themed ember
            gradient. Masked + positioned by buildOathSpotlight (desktop only). */}
        <div
          data-hero-spotlight
          className="absolute inset-0"
          style={{
            maskImage: SPOTLIGHT_MASK,
            WebkitMaskImage: SPOTLIGHT_MASK,
            background: revealMedia
              ? undefined
              : 'radial-gradient(ellipse 80% 80% at 50% 45%, color-mix(in srgb, var(--color-highlight) 55%, transparent) 0%, color-mix(in srgb, var(--color-highlight-bright, var(--color-highlight)) 22%, transparent) 45%, transparent 80%)',
          }}
        >
          {revealMedia ? (
            <img
              src={revealMedia}
              alt=""
              className="h-full w-full object-cover object-center"
              decoding="async"
              style={{ filter: 'saturate(1.25) contrast(1.08)' }}
            />
          ) : null}
        </div>
      </div>

      {/* Copy scrim — a left→right wash that keeps the headline/eyebrow/CTAs
          legible WITHOUT dimming the video itself (the video stays fully opaque;
          the wash clears by ~56% so the right-side film reads at full brightness).
          Extends up under the fixed header (`top: -header`) so there is no
          brightness seam between the nav and the hero at rest. A faint bottom
          wash keeps the scroll cue readable. */}
      <div
        data-hero-vignette
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[calc(-1*var(--anvl-header-h))] -z-[5]"
        style={{
          background:
            'linear-gradient(90deg, color-mix(in srgb, var(--color-bg) 82%, transparent) 0%, color-mix(in srgb, var(--color-bg) 34%, transparent) 30%, transparent 56%), linear-gradient(0deg, color-mix(in srgb, var(--color-bg) 50%, transparent) 0%, transparent 16%)',
        }}
      />

      <Container className="relative z-10">
        <div data-hero-content className="max-w-2xl will-change-transform">
          {/* Small drop emblem above the eyebrow. This static DOM mark is the
              fallback for mobile / reduced-motion / no-WebGL; on the desktop
              WebGL path the 3D monolith renders in this same spot and the root
              gains `data-webgl="on"`, so the static mark fades out (hand-off). */}
          <div
            data-hero-emblem-fallback
            data-reveal-m
            aria-hidden="true"
            className="mb-5 transition-opacity duration-500 group-data-[webgl=on]/oath:opacity-0 md:mb-6"
          >
            <OathCmsMark
              slot="dropLogo"
              className="h-14 w-14 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]"
              width={72}
              height={72}
            />
          </div>

          <p
            data-hero-fade
            data-reveal-m
            className="anvl-display inline-flex items-center gap-2.5 text-[0.65rem] tracking-[0.34em] text-[var(--color-highlight-bright)] before:h-px before:w-10 before:bg-[var(--color-highlight)] before:content-[''] sm:text-xs"
          >
            {hero.eyebrow}
          </p>

          {/* Plain text — the desktop branch splits it into masked words with a
              blur-rise (SplitText); static branches reveal the block whole. */}
          <h1
            id="oath-hero-heading"
            data-hero-headline
            data-reveal-m
            className="anvl-heading mt-5 font-normal leading-[0.9] tracking-[-0.01em] text-[clamp(2.75rem,9vw,7rem)]"
          >
            {hero.headline}
          </h1>

          <div
            data-hero-underline
            className="mt-4 h-px w-[min(20rem,56vw)] origin-left"
            style={{
              background:
                'linear-gradient(90deg, var(--color-highlight-bright, #e08a4a), var(--color-highlight, #c2703d) 55%, transparent)',
            }}
          />

          <p
            data-hero-fade
            data-reveal-m
            className="mt-6 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base"
          >
            {hero.subhead}
          </p>

          <div
            data-hero-fade
            data-hero-cta-row
            data-reveal-m
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <OathCtaLink href={hero.primaryCta.href} variant="primary">
              {hero.primaryCta.label}
            </OathCtaLink>
            <OathCtaLink href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </OathCtaLink>
          </div>

          <div
            data-hero-fade
            data-reveal-m
            className="anvl-display mt-10 hidden flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--color-line)] pt-5 text-[10px] tracking-[0.28em] text-[var(--color-text-muted)] md:flex"
          >
            <span className="text-[var(--color-highlight-bright)]">{OATH_META.drop}</span>
            <span>{OATH_META.coords}</span>
            <span>{OATH_META.origin}</span>
          </div>
        </div>
      </Container>

      {/* Scroll cue. */}
      <div
        data-hero-fade
        className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex flex-col items-center gap-1.5"
      >
        <span className="anvl-display text-[10px] tracking-[0.32em] text-[var(--color-heading)]/85">
          {hero.scrollCue}
        </span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          data-hero-scroll-cue
          className="text-[var(--anvl-bone,#E7E4DF)]/90"
        />
      </div>
    </section>
  )
}
