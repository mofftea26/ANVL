import { Container } from '@/shared/components/ui/Container'
import { OATH_MANIFESTO } from '../data'
import { oathSceneMedia } from '../theOathAssets'
import { MediaPlane } from './MediaPlane'
import { SceneSeamBlend } from './SceneSeamBlend'

/**
 * Scene 02 — Manifesto. A slow media push-in behind two lines that mask up.
 * Pinned + scrubbed on desktop/tablet; a plain reveal on mobile.
 */
export function ManifestoScene() {
  return (
    <section
      data-scene="manifesto"
      className="relative flex min-h-[var(--anvl-section-h)] w-full items-center overflow-hidden bg-transparent"
      aria-label="The ANVL manifesto"
    >
      <SceneSeamBlend edge="top" />
      <SceneSeamBlend edge="bottom" />
      <MediaPlane
        media={oathSceneMedia('manifestoMedia')}
        tone="#101113"
        showLogo={false}
        transparent
        vignette={false}
        mediaAttrs={{ 'data-manifesto-media': 'true' }}
      />

      <Container className="relative z-10 w-full">
        <p data-reveal-m className="anvl-display text-xs tracking-[0.3em] text-[var(--color-ember-bright)]">
          {OATH_MANIFESTO.eyebrow}
        </p>

        <div data-reveal-m className="mt-6 max-w-5xl">
          <span data-manifesto-line className="block overflow-hidden pb-[0.05em]">
            <span
              data-manifesto-inner
              className="anvl-heading block font-normal leading-[0.95] tracking-[-0.01em] text-[clamp(2rem,6vw,4.75rem)] will-change-transform"
            >
              {OATH_MANIFESTO.lead}
            </span>
          </span>
        </div>

        <div data-reveal-m className="mt-8 max-w-2xl">
          <span data-manifesto-line className="block overflow-hidden">
            <span
              data-manifesto-inner
              className="block text-base leading-relaxed text-[var(--color-text-muted)] will-change-transform md:text-lg"
            >
              {OATH_MANIFESTO.intro}
            </span>
          </span>
        </div>
      </Container>
    </section>
  )
}
