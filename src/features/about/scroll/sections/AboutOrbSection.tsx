import { usePreviewTargetProps } from '@/features/cms/preview'
import { Container } from '@/shared/components/ui/Container'
import { cn } from '@/shared/lib/cn'
import type { AboutResolvedOrb } from '../../content/aboutContent.defaults'
import { AboutOrbContent } from '../../components/AboutOrbContent'

/**
 * One orb as a full-screen film chapter. The orb's image IS the frame — a
 * full-bleed faded backdrop under a legibility wash — and the copy sits over
 * it (alternating left/right per chapter for rhythm), with the chapter's
 * ordinal as an oversized outlined ghost numeral. Markup + `data-*` hooks
 * only; `buildAboutOrbChapter` owns the materialize → hold → dissolve scrub.
 *
 * Contracts carried by this element:
 * - `id="about-orb-<orb.id>"` — the search corpus + deep-link anchor
 * - `data-anvl-preview-target="about:orb-<1-based>"` — admin live-preview
 *   hover/locate (the old desktop altar exposed none; the film closes that)
 * - `data-scene="orb"` — the timeline hook's chapter query, in DOM order
 */
export function AboutOrbSection({
  orb,
  image,
  index,
}: {
  orb: AboutResolvedOrb
  image?: string
  index: number
}) {
  const anchorId = `about-orb-${orb.id}`
  // Index-based target — matches the admin orbs editor, which only knows
  // positions (resolved ids are semantic for the designed defaults).
  const previewTarget = usePreviewTargetProps('content-field', `about:orb-${index + 1}`)
  const alignEnd = index % 2 === 1

  return (
    <section
      id={anchorId}
      data-scene="orb"
      data-orb-index={index}
      aria-labelledby={`${anchorId}-title`}
      className="relative h-[100svh] overflow-hidden"
      {...previewTarget}
    >
      <div
        data-chapter-media
        aria-hidden="true"
        className="about-edge-fade absolute inset-0 will-change-transform"
      >
        {image ? (
          <img
            src={image}
            alt=""
            width={2560}
            height={1440}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover opacity-60"
          />
        ) : (
          // No image — the orb's own colour breathes in the void.
          <div
            className="h-full w-full"
            style={{
              background: `radial-gradient(ellipse 90% 70% at ${alignEnd ? '30%' : '70%'} 45%, color-mix(in srgb, ${orb.color} 14%, transparent) 0%, transparent 60%)`,
            }}
          />
        )}
        {/* Legibility wash — heavier over the copy column, open elsewhere. */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(${alignEnd ? '270deg' : '90deg'}, color-mix(in srgb, var(--color-bg) 78%, transparent) 0%, color-mix(in srgb, var(--color-bg) 45%, transparent) 42%, transparent 72%), linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 45%, transparent) 0%, transparent 26%, transparent 70%, var(--color-bg) 100%)`,
          }}
        />
      </div>

      {/* Ghost ordinal — the chapter's number as set dressing. */}
      <span
        aria-hidden="true"
        data-chapter-num
        className={cn(
          'about-outline-text anvl-heading pointer-events-none absolute bottom-[4vh] select-none leading-none text-transparent opacity-50 text-[clamp(9rem,22vh,16rem)]',
          alignEnd ? 'left-[3vw]' : 'right-[3vw]',
        )}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      <div data-chapter-frame className="relative z-10 flex h-full items-center">
        <Container>
          <div className={cn('max-w-2xl', alignEnd && 'ml-auto')}>
            <AboutOrbContent
              orb={orb}
              headingId={`${anchorId}-title`}
              variant="chapter"
              reveal
            />
          </div>
        </Container>
      </div>
    </section>
  )
}
