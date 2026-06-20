import { Container } from '@/shared/components/ui/Container'
import type { OathResolvedContent } from '../content/oathContent.defaults'
import { oathManifestoMedia } from '../theOathAssets'
import { OathMediaFallback } from './OathMediaFallback'
import { OathSceneSeam } from './OathSceneSeam'

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
      className="relative flex min-h-[var(--anvl-section-h)] w-full items-center overflow-hidden"
      aria-labelledby="oath-manifesto-heading"
    >
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

      <OathSceneSeam />

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
