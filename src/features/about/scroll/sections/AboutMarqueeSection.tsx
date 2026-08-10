import { usePreviewTargetProps } from '@/features/cms/preview'
import { AboutMarquee } from '../../components/AboutMarquee'

/**
 * The kinetic ribbon before the finale — the film's rhythm break. The CSS
 * keyframe loop keeps the two rows counter-scrolling; `buildAboutMarquee`
 * scrubs a drift + velocity lean on the wrappers around it.
 */
export function AboutMarqueeSection({ text }: { text: string }) {
  const previewTarget = usePreviewTargetProps('content-field', 'about:marquee')

  return (
    <section
      data-scene="marquee"
      className="relative flex min-h-[55svh] flex-col justify-center overflow-hidden"
    >
      <div {...previewTarget}>
        <div data-marquee-band className="will-change-transform">
          <div data-marquee-shift className="will-change-transform">
            <AboutMarquee text={text} />
          </div>
        </div>
      </div>
    </section>
  )
}
