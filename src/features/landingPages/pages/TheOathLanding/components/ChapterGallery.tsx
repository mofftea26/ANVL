import { Container } from '@/shared/components/ui/Container'
import { parseColor, rgbaToCss } from '@/shared/lib/color'
import { OATH_CHAPTERS, OATH_MANIFESTO } from '../data'
import { oathChapterMedia } from '../theOathAssets'
import { MediaPlane } from './MediaPlane'

/**
 * Translucent duotone for a mobile tenet card — keeps the chapter's tone but lets
 * the shared `ForgeAtmosphere` (embers + glow) bleed through, so the mobile grid
 * reads as part of the same forge rather than four opaque blocks.
 */
function tenetCardBg(tone: string): string {
  const c = parseColor(tone)
  if (!c) return 'linear-gradient(158deg, rgba(20,22,25,0.6) 0%, rgba(11,11,12,0.42) 100%)'
  return `linear-gradient(158deg, ${rgbaToCss({ ...c, a: 0.62 })} 0%, rgba(11,11,12,0.4) 100%)`
}

/**
 * Scene 03 — The Tenets.
 *
 * **Desktop / tablet:** four chapters cross-fade inside one pinned frame, each
 * entering and exiting with its own motion (zoom / pan / rise / punch — see
 * `buildChapters`), with an ember progress rail and a manifesto line per tenet.
 *
 * **Mobile:** the four tenets collapse into one screen as a compact 2×2 grid of
 * translucent cards (the forge bleeds through), revealed together with a short
 * stagger — no per-tenet full-bleed scroll.
 *
 * The two layouts are rendered as separate trees (`md:hidden` / `hidden md:block`)
 * so the desktop cross-fade markup — and its `data-chapter*` hooks — stays exactly
 * as it was; only one tree carries `data-chapter`, so the pinned timeline still
 * counts four layers.
 */
export function ChapterGallery() {
  const total = OATH_CHAPTERS.length
  return (
    <section
      data-scene="chapters"
      className="relative w-full overflow-hidden bg-transparent md:h-[var(--anvl-section-h)]"
      aria-label="The tenets of The Oath"
    >
      {/* ---- Mobile: one-screen 2×2 tenet grid ---- */}
      <div className="px-5 pb-16 pt-12 md:hidden">
        <p
          data-reveal-m
          className="anvl-display text-xs tracking-[0.3em] text-[var(--color-ember-bright)]"
        >
          {OATH_MANIFESTO.eyebrow}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {OATH_CHAPTERS.map((chapter) => (
            <article
              key={chapter.id}
              data-reveal-m
              className="relative flex min-h-[8.5rem] flex-col justify-between gap-5 overflow-hidden rounded-xl border border-[var(--color-line)] p-4"
              style={{ background: tenetCardBg(chapter.tone) }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="anvl-display text-[clamp(2rem,11vw,2.75rem)] leading-[0.8] text-[var(--color-ember)]">
                  {chapter.index}
                </span>
                <span className="anvl-micro text-[var(--color-ember-bright)]">{chapter.marker}</span>
              </div>
              <h3 className="anvl-heading text-[0.95rem] font-normal leading-[1.02] sm:text-lg">
                {chapter.title}
              </h3>
            </article>
          ))}
        </div>
      </div>

      {/* ---- Desktop / tablet: pinned cross-dissolving frame ---- */}
      <div className="hidden md:block">
        {/* Pinned eyebrow + progress rail. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
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
          <div key={chapter.id} data-chapter className="absolute inset-0 flex w-full items-center">
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
      </div>
    </section>
  )
}
