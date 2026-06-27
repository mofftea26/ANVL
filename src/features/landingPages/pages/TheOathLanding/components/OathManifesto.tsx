import { Container } from '@/shared/components/ui/Container'
import type { OathResolvedContent } from '../content/oathContent.defaults'
import { oathManifestoMedia } from '../theOathAssets'
import { OathMediaFallback } from './OathMediaFallback'

/**
 * Scene 02 — The Creed. A pinned push-in: manifesto lines reveal word-by-word
 * through masks while the backdrop dims and the monolith recedes behind it.
 * CMS `manifestoMedia` backdrop; duotone placeholder when unassigned. Markup +
 * `data-*` hooks only.
 */
export function OathManifesto({
  manifesto,
}: {
  manifesto: OathResolvedContent['manifesto']
}) {
  return (
    <section
      data-scene="manifesto"
      className="relative hidden min-h-[100svh] w-full items-center overflow-hidden bg-[var(--color-bg)] xl:flex"
      aria-labelledby="oath-manifesto-heading"
    >
      {/* Solid continuous backdrop — the same themed black as the hero dissolve
          and the tenets stage, so the feathered creed media never reveals the
          void behind the page and the scene flows from one neighbour to the next
          with no division. Its TOP edge feathers in over a small band so the
          creed *starts with a soft fade* into the void above (no hard line under
          the hero "approach" cue); the bottom stays solid so the tenets hand-off
          is never see-through. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[var(--color-bg)] [mask-image:linear-gradient(to_bottom,transparent_0%,#000_18%,#000_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,#000_18%,#000_100%)]"
      />

      <OathMediaFallback
        media={oathManifestoMedia()}
        tone="#101113"
        showLogo={false}
        grain
        feather
        vignette={false}
        mediaAttrs={{ 'data-manifesto-media': 'true' }}
        mediaClassName="opacity-60"
      />

      {/* No seam bands here: the media already feathers into the solid backdrop
          (OathMediaFallback) and the neighbouring hero-bottom / tenets-top
          dissolves carry the hand-off — stacking another band over an identical
          black is what read as a shadow line dividing the scenes. */}

      <Container className="relative z-10 py-24 md:py-32">
        <p
          data-reveal-m
          data-manifesto-eyebrow
          className="anvl-display text-[0.65rem] tracking-[0.34em] text-[var(--color-heading)]/85 sm:text-xs"
        >
          {manifesto.eyebrow}
        </p>

        <h2 id="oath-manifesto-heading" className="sr-only">
          {manifesto.lines.join(' ')}
        </h2>

        <div aria-hidden="true" className="mt-8 max-w-4xl space-y-3 md:space-y-5">
          {manifesto.lines.map((line, i) => (
            <p key={`${i}-${line.slice(0, 12)}`} className="overflow-hidden" data-reveal-m>
              <span
                data-manifesto-line
                className="anvl-heading block font-normal leading-[1.04] text-[var(--color-heading)] text-[clamp(1.5rem,4.6vw,3.5rem)] will-change-transform"
              >
                {line}
              </span>
            </p>
          ))}
        </div>
      </Container>
    </section>
  )
}
