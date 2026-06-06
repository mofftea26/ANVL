import { Container } from '@/shared/components/ui/Container'
import { OATH_CHAPTERS, OATH_MANIFESTO } from '../data'
import { oathChapterMedia } from '../theOathAssets'
import { MediaPlane } from './MediaPlane'

/**
 * Scene 03 — The Tenets. Four chapters cross-fade inside one pinned frame, but
 * each enters and exits with its **own** motion (zoom / pan / rise / punch — see
 * `buildChapters`), with an ember progress rail and a manifesto line per tenet so
 * the section breathes instead of repeating one fade. On mobile they fall into a
 * vertical sequence of full-bleed blocks that reveal on scroll.
 */
export function ChapterGallery() {
  const total = OATH_CHAPTERS.length
  return (
    <section
      data-scene="chapters"
      className="relative w-full overflow-hidden bg-transparent md:h-[var(--anvl-section-h)]"
      aria-label="The tenets of The Oath"
    >
      {/* Pinned eyebrow + progress rail (desktop). */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden md:block">
        <Container className="flex items-center justify-between pt-[calc(var(--anvl-header-h)+1.5rem)]">
          <span className="anvl-display text-xs tracking-[0.3em] text-[var(--color-ember-bright)]">
            {OATH_MANIFESTO.eyebrow}
          </span>
          <div className="flex items-center gap-2" aria-hidden="true">
            {OATH_CHAPTERS.map((c) => (
              <span
                key={c.id}
                data-chapter-tick
                className="h-px w-10 origin-left bg-[var(--color-ember)]"
              />
            ))}
          </div>
        </Container>
      </div>

      {OATH_CHAPTERS.map((chapter) => (
        <div
          key={chapter.id}
          data-chapter
          data-reveal-m
          className="relative flex min-h-[var(--anvl-section-h)] w-full items-center md:absolute md:inset-0 md:min-h-0"
        >
          <MediaPlane
            media={oathChapterMedia(chapter.id)}
            tone={chapter.tone}
            showLogo={false}
            grain
            mediaAttrs={{ 'data-chapter-media': 'true' }}
          />

          <Container className="relative z-10 w-full">
            <div data-chapter-text className="max-w-3xl will-change-transform">
              <div className="flex items-end gap-4">
                <span className="anvl-display text-[clamp(3rem,9vw,7rem)] leading-[0.8] text-[var(--color-ember)]">
                  {chapter.index}
                </span>
                <span className="anvl-display mb-2 inline-flex items-center gap-2 text-[11px] tracking-[0.28em] text-[var(--color-ember-bright)] before:h-px before:w-6 before:bg-[var(--color-ember)] before:content-['']">
                  {chapter.marker} · {chapter.index}/{String(total).padStart(2, '0')}
                </span>
              </div>
              <h2 className="anvl-heading mt-4 font-normal leading-[0.9] tracking-[-0.01em] text-[clamp(2.25rem,7vw,5.5rem)]">
                {chapter.title}
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg">
                {chapter.line}
              </p>
            </div>
          </Container>
        </div>
      ))}
    </section>
  )
}
