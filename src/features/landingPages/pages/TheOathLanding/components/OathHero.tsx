import { ChevronDown } from '@/shared/icons'

import { Container } from '@/shared/components/ui/Container'

import type { OathResolvedContent } from '../content/oathContent.defaults'

import {

  oathCrestEmblem,

  oathDuotone,

  oathHeroDesktopVideo,

  oathHeroImage,

  oathHeroMediaMode,

  oathHeroMobileVideo,

  oathHeroPoster,

  oathHeroRevealMedia,

  oathProductImage,

} from '../theOathAssets'
import { ICON_SIZE } from '@/shared/lib/iconSize'

import { OathCmsMark } from './OathCmsMark'

import { OathCtaLink } from './OathCtaLink'

import { OathHeroProductStage } from './OathHeroProductStage'

import { OathSceneSeam } from './OathSceneSeam'



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

 * Feather mask for the contained video panel lives in `styles.css` under

 * `[data-scene='hero'] [data-hero-media]`: mobile/tablet keeps a solid right

 * edge; desktop (xl+) dissolves the right panel into the void.

 */



/**

 * Scene 01 — Hero. Exactly one full screen tall (`100svh`) — the landing header

 * is a transparent overlay (reserves no space), so the section runs full-bleed

 * under the bar and the "Approach" cue sits at the bottom. The forge film is

 * a **contained, right-anchored panel** (width-capped so a low-res source isn't

 * stretched) whose every edge **feathers into the themed shadow**

 * (`MEDIA_FEATHER_MASK`) — no hard cut-off. The video itself stays **fully

 * opaque**; legibility comes from a left copy scrim only (which also extends up

 * under the header so there's no seam at rest). It is scroll-scrubbed on desktop;

 * on mobile it autoplays once and pauses at the end. On desktop it **drifts from

 * the right toward centre** as the hero scrolls (`buildOathHero`), tracking the 3D monolith (the

 * persistent WebGL layer) which sits small above the eyebrow and **only drifts

 * to centre — staying the same small size until the finale enlarges it**. A

 * cursor spotlight reveals a second "forged" layer over the base film

 * (`heroRevealMedia`, or a themed ember gradient) — a full-bleed layer that does

 * not move. The film + reveal are fixed behind the WebGL canvas on desktop

 * (`xl:fixed`, so the monolith renders over them) and absolute within the

 * section on mobile/tablet. Markup + `data-*` hooks only — motion lives in

 * `buildOathHero` / `buildOathSpotlight`.

 */

export function OathHero({ hero }: { hero: OathResolvedContent['hero'] }) {

  const heroMode = oathHeroMediaMode()

  const heroImage = oathHeroImage()

  const desktopVideo = oathHeroDesktopVideo()

  const mobileVideo = oathHeroMobileVideo()

  const poster = oathHeroPoster()

  const revealMedia = oathHeroRevealMedia()

  // Products mode's static stand-in (mobile / tablet / reduced motion /
  // no-WebGL); fades out when the canvas is live (`data-webgl="on"`).
  const productsFallback = poster ?? heroImage ?? oathProductImage(1)



  return (

    <section

      data-scene="hero"

      className="relative flex h-[100svh] w-full items-center justify-center overflow-hidden max-xl:pb-[max(3.5rem,env(safe-area-inset-bottom))]"

      aria-labelledby="oath-hero-heading"

    >

      {/* Forge film + spotlight reveal. Fixed behind the WebGL canvas on desktop

          (so the monolith renders over it); absolute within the section on

          mobile/tablet (no canvas there). Fades out as the hero ends (buildOathHero). */}

      <div

        data-hero-film

        aria-hidden="true"

        className="absolute inset-0 -z-10 max-xl:left-1/2 max-xl:w-screen max-xl:min-w-full max-xl:-translate-x-1/2 overflow-hidden xl:fixed xl:-z-20 xl:left-0 xl:w-auto xl:translate-x-0"

      >

        {/* Base film — a contained, right-anchored panel (full-bleed on mobile,

            width-capped on tablet/desktop) that drifts right→centre on scroll

            (buildOathHero translates this element; transform only). Every edge

            feathers into the themed shadow (MEDIA_FEATHER_MASK) so the right/outer

            edges dissolve instead of hard-cutting. Clips its own Ken-Burns scale. */}

        <div

          data-hero-media

          className="absolute inset-0 overflow-hidden will-change-transform max-xl:w-full max-xl:min-w-full xl:inset-y-0 xl:left-auto xl:right-0 xl:w-[64%] xl:min-w-0 xl:max-w-[980px] 2xl:max-w-[1080px]"

        >

          <div data-hero-kenburns className="absolute inset-0 will-change-transform">

            {heroMode === 'products' ? (
              /* Products mode: the forged piece lives on the WebGL canvas
                 (desktop). This static panel is the mobile / tablet /
                 reduced-motion / no-WebGL stand-in — and it hands off
                 (fades out) the moment the canvas is live. */
              productsFallback ? (
                <img
                  src={productsFallback}
                  alt=""
                  className="h-full w-full object-cover object-center transition-opacity duration-700 group-data-[webgl=on]/oath:opacity-0 max-xl:object-center xl:object-top"
                  decoding="async"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-full w-full items-center justify-center transition-opacity duration-700 group-data-[webgl=on]/oath:opacity-0"
                  style={{ background: oathDuotone() }}
                >
                  <img
                    src={oathCrestEmblem()}
                    alt=""
                    width={280}
                    height={280}
                    decoding="async"
                    className="h-[38%] w-auto opacity-25"
                  />
                </div>
              )
            ) : heroMode === 'image' && heroImage ? (

              <img

                src={heroImage}

                alt=""

                className="h-full w-full object-cover object-center max-xl:object-center xl:object-top"

                decoding="async"

              />

            ) : (

              <>

                <video

                  data-hero-video-desktop

                  className="hidden h-full w-full object-cover object-center max-xl:object-center md:block xl:object-top"

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

                  poster={poster}

                  muted

                  playsInline

                  preload="metadata"

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

          className="absolute inset-0 hidden xl:block"

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

          the wash clears by ~56% on desktop so the right-side film reads at full

          brightness). Extends up under the fixed header (`top: -header`) so there

          is no brightness seam between the nav and the hero at rest. A faint bottom

          wash keeps the scroll cue readable. */}

      <div

        data-hero-vignette

        aria-hidden="true"

        className="pointer-events-none absolute inset-x-0 bottom-0 top-[calc(-1*var(--anvl-header-h))] -z-[5] w-full min-w-full max-xl:left-1/2 max-xl:w-screen max-xl:-translate-x-1/2 xl:left-0 xl:w-full xl:translate-x-0"

        style={{

          background:

            'linear-gradient(90deg, color-mix(in srgb, var(--color-bg) 82%, transparent) 0%, color-mix(in srgb, var(--color-bg) 34%, transparent) 30%, transparent 56%), linear-gradient(0deg, color-mix(in srgb, var(--color-bg) 55%, transparent) 0%, color-mix(in srgb, var(--color-bg) 18%, transparent) 22%, transparent 38%)',

        }}

      />



      {/* Mobile/tablet edge shade — the copy scrim clears on the right for desktop

          panel layout; on full-bleed mobile/tablet a subtle right wash keeps the

          film edge-to-edge without a bright uncovered strip. Same stacking context

          as the vignette (absolute within the section, not fixed). */}

      <div

        data-hero-mobile-shade

        aria-hidden="true"

        className="pointer-events-none absolute inset-0 -z-[4] w-full min-w-full max-xl:left-1/2 max-xl:w-screen max-xl:-translate-x-1/2 xl:hidden"

        style={{

          background:

            'linear-gradient(90deg, transparent 40%, color-mix(in srgb, var(--color-bg) 32%, transparent) 68%, color-mix(in srgb, var(--color-bg) 68%, transparent) 88%, var(--color-bg) 100%)',

        }}

      />



      <Container className="pointer-events-none relative z-10 w-full max-xl:py-3 max-md:px-2">

        <div

          data-hero-content

          className="pointer-events-auto max-w-2xl will-change-transform max-xl:mx-auto max-xl:max-w-3xl max-xl:text-center max-md:flex max-md:w-full max-md:flex-col max-md:items-center xl:mb-[var(--anvl-header-h)] xl:text-left"

        >

          {/* Small drop emblem above the eyebrow. This static DOM mark is the

              fallback for mobile / reduced-motion / no-WebGL; on the desktop

              WebGL path the 3D monolith renders in this same spot and the root

              gains `data-webgl="on"`, so the static mark fades out (hand-off). */}

          <div

            data-hero-emblem-fallback

            data-reveal-m

            aria-hidden="true"

            className="mb-4 flex h-28 w-28 shrink-0 items-center justify-center overflow-visible transition-opacity duration-500 group-data-[webgl=on]/oath:opacity-0 max-xl:mx-auto md:mb-6 md:max-xl:mb-6 md:max-xl:h-[clamp(9rem,18vw,12rem)] md:max-xl:w-[clamp(9rem,18vw,12rem)] xl:mx-0 xl:mb-6 xl:h-[4.5rem] xl:w-[4.5rem]"

          >

            <OathCmsMark

              slot="dropLogo"

              className="h-full w-full max-xl:mx-auto xl:mx-0"

              width={192}

              height={192}

            />

          </div>



          <div data-hero-copy-stack className="max-md:mt-5 md:max-xl:mt-2">

          <p

            data-hero-fade

            data-reveal-m

            className="anvl-display inline-flex items-center gap-2.5 text-[0.65rem] tracking-[0.34em] text-[var(--color-highlight-bright)] before:h-px before:w-10 before:bg-[var(--color-highlight)] before:content-[''] after:h-px after:w-10 after:bg-[var(--color-highlight)] after:content-[''] sm:text-xs max-xl:justify-center md:max-xl:gap-3 md:max-xl:text-sm md:max-xl:before:w-12 md:max-xl:after:w-12 md:max-xl:tracking-[0.36em]"

          >

            {hero.eyebrow}

          </p>



          {/* Plain text — the desktop branch splits it into masked words with a

              blur-rise (SplitText); static branches reveal the block whole. */}

          <h1

            id="oath-hero-heading"

            data-hero-headline

            data-reveal-m

            className="anvl-heading mt-3 max-w-[min(100%,18rem)] font-normal leading-[0.9] tracking-[-0.01em] text-[clamp(2rem,7.25vw,2.75rem)] max-xl:mx-auto max-xl:text-center sm:mt-4 sm:max-w-none sm:text-[clamp(2.25rem,8.5vw,3.25rem)] md:max-xl:mt-6 md:max-xl:text-[clamp(3.25rem,10vw,4.75rem)] xl:mx-0 xl:mt-5 xl:text-left xl:text-[clamp(2.75rem,9vw,7rem)]"

          >

            {hero.headline}

          </h1>



          <div

            data-hero-underline

            className="mt-3 h-px w-[min(18rem,52vw)] origin-left max-xl:mx-auto max-xl:origin-center sm:mt-4 md:max-xl:w-[min(26rem,70vw)] xl:mx-0 xl:w-[min(20rem,56vw)] xl:origin-left"

            style={{

              background:

                'linear-gradient(90deg, var(--color-highlight-bright, #e08a4a), var(--color-highlight, #c2703d) 55%, transparent)',

            }}

          />



          <p

            data-hero-fade

            data-reveal-m

            className="mt-3 max-w-[min(100%,18rem)] text-sm leading-relaxed text-[var(--color-text-muted)] max-xl:mx-auto max-xl:text-center sm:mt-5 sm:max-w-xl sm:text-base md:max-xl:mt-7 md:max-xl:max-w-2xl md:max-xl:text-lg xl:mx-0 xl:mt-6 xl:max-w-xl xl:text-left xl:text-base"

          >

            {hero.subhead}

          </p>



          <div

            data-hero-fade

            data-hero-cta-row

            data-reveal-m

            className="mt-5 flex flex-wrap items-center justify-center gap-2.5 sm:mt-7 sm:gap-3 md:max-xl:mt-10 md:max-xl:gap-4 xl:mt-9 xl:justify-start"

          >

            <OathCtaLink

              href={hero.primaryCta.href}

              variant="primary"

              className="md:max-xl:h-14 md:max-xl:px-8 md:max-xl:text-base"

            >

              {hero.primaryCta.label}

            </OathCtaLink>

            <OathCtaLink

              href={hero.secondaryCta.href}

              variant="secondary"

              className="md:max-xl:h-14 md:max-xl:px-8 md:max-xl:text-base"

            >

              {hero.secondaryCta.label}

            </OathCtaLink>

          </div>



          <div

            data-hero-footer-rail

            data-hero-fade

            data-reveal-m

            className="anvl-display mt-8 hidden flex-wrap items-center gap-x-6 gap-y-2 border-t border-[var(--color-line)] pt-4 text-[10px] tracking-[0.28em] text-[var(--color-text-muted)] md:flex max-xl:justify-center md:max-xl:gap-x-8 md:max-xl:pt-6 md:max-xl:text-xs xl:justify-start"

          >

            <span className="text-[var(--color-highlight-bright)]">{OATH_META.drop}</span>

            <span>{OATH_META.coords}</span>

            <span>{OATH_META.origin}</span>

          </div>

          </div>

        </div>

      </Container>



      {/* Hero product forge interaction layer (mode `products`, WebGL on):
          click = re-forge next piece, hover = zoom breathe, plus the active
          piece plate. Renders nothing in other modes / without the canvas. */}

      {heroMode === 'products' ? <OathHeroProductStage /> : null}



      {/* Scroll cue. */}

      <div

        data-hero-fade

        className="pointer-events-none absolute inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-10 flex flex-col items-center gap-1.5"

      >

        <span className="anvl-display text-[10px] tracking-[0.32em] text-[var(--color-heading)]/85">

          {hero.scrollCue}

        </span>

        <ChevronDown

          size={ICON_SIZE.sm}

          aria-hidden="true"

          data-hero-scroll-cue

          className="text-[var(--anvl-bone,#E7E4DF)]/90"

        />

      </div>

      {/* Bottom dissolve — hero film + copy feather into the themed void before
          manifesto (desktop) or products (mobile/tablet). Subtle on small screens
          so the hand-off never reads as a horizontal split line. */}
      <OathSceneSeam edges="bottom" tone="subtle" className="xl:hidden" />
      <OathSceneSeam edges="bottom" className="hidden xl:block" />

    </section>

  )

}


