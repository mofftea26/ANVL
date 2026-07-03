import { Link } from '@tanstack/react-router'
import { Container, Section } from '@/shared/components/ui'
import { RevealOnScroll } from '@/shared/components/motion/RevealOnScroll'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'
import type { StoryChapter } from '@/features/story/schemas/story.schema'
import { StoryHero } from '@/features/story/components/StoryHero'
import { StoryShelf } from '@/features/story/components/StoryShelf'
import { ChapterBook } from '@/features/story/components/ChapterBook'

interface StorySagaProps {
  chapters: StoryChapter[]
  /** Slug of the chapter to open as a book overlay (from `?chapter=`). */
  activeChapterSlug: string | null
  onOpenChapter: (slug: string) => void
  onCloseChapter: () => void
}

const CTA_FORGE =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-highlight)] bg-[var(--color-highlight)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-bg)] no-underline transition-opacity hover:opacity-90'
const CTA_STEEL =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] no-underline hover:border-[color-mix(in_oklab,var(--color-highlight)_60%,var(--color-line))]'

/** Roman numeral for a volume plaque (1-indexed, pragmatic range). */
function romanNumeral(n: number): string {
  const table: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ]
  let v = Math.max(1, Math.trunc(n))
  let out = ''
  for (const [value, glyph] of table) {
    while (v >= value) {
      out += glyph
      v -= value
    }
  }
  return out
}

/** Group chapters into per-drop shelves (preserving order). */
function groupByDrop(
  chapters: StoryChapter[],
): { key: string; label: string; chapters: StoryChapter[] }[] {
  const groups = new Map<string, { key: string; label: string; chapters: StoryChapter[] }>()
  for (const c of chapters) {
    const key = c.dropSlug || c.dropLabel || c.subtitle || 'saga'
    const label = c.dropLabel || c.subtitle || 'The Saga'
    const group = groups.get(key) ?? { key, label, chapters: [] }
    group.chapters.push(c)
    groups.set(key, group)
  }
  return [...groups.values()]
}

/** Volume plaque above each drop's shelf — numeral, drop label, book count. */
function VolumePlaque({
  index,
  label,
  count,
}: {
  index: number
  label: string
  count: number
}) {
  return (
    <Container>
      <RevealOnScroll>
        <div className="flex items-end justify-between gap-6 border-b border-[color-mix(in_srgb,#c8a45a_22%,var(--color-line))] pb-4">
          <div className="flex items-baseline gap-4">
            <span className="anvl-display text-xs tracking-[0.34em] text-[#c8a45a]/90">
              Vol. {romanNumeral(index + 1)}
            </span>
            <h2 className="anvl-heading font-normal leading-none text-[clamp(1.5rem,3.5vw,2.5rem)] text-[var(--color-heading)]">
              {label}
            </h2>
          </div>
          <span className="anvl-display hidden shrink-0 text-[11px] tracking-[0.26em] text-[var(--color-text-muted)] sm:block">
            {count} {count === 1 ? 'book' : 'books'}
          </span>
        </div>
      </RevealOnScroll>
    </Container>
  )
}

/**
 * Composes the Story page — the Athenaeum: frontispiece hero → per-drop
 * volume shelves (the 3D bookshelf, untouched) → the colophon → the
 * deep-linkable book overlay.
 */
export function StorySaga({
  chapters,
  activeChapterSlug,
  onOpenChapter,
  onCloseChapter,
}: StorySagaProps) {
  const activeChapter =
    activeChapterSlug != null
      ? (chapters.find((c) => c.slug === activeChapterSlug) ?? null)
      : null

  const dropGroups = groupByDrop(chapters)

  return (
    <>
      <StoryHero />

      {chapters.length > 0 ? (
        <div className="space-y-10 pt-10">
          {dropGroups.map((group, i) => (
            <section key={group.key} aria-label={group.label}>
              <VolumePlaque index={i} label={group.label} count={group.chapters.length} />
              <StoryShelf chapters={group.chapters} onOpen={onOpenChapter} />
            </section>
          ))}
        </div>
      ) : (
        <Section>
          <Container className="max-w-2xl py-6 text-center">
            <p aria-hidden="true" className="anvl-display text-xs tracking-[0.4em] text-[#c8a45a]/80">
              Vol. I
            </p>
            <h2 className="anvl-heading mt-4 text-[clamp(1.75rem,4.5vw,3rem)] font-normal leading-[0.95]">
              The first volume is still on the anvil.
            </h2>
            <div className="mx-auto mt-6 flex items-center justify-center gap-3" aria-hidden="true">
              <span className="h-px w-20 bg-gradient-to-r from-transparent to-[#c8a45a]/70" />
              <span className="block h-1.5 w-1.5 rotate-45 border border-[#c8a45a]/80" />
              <span className="h-px w-20 bg-gradient-to-l from-transparent to-[#c8a45a]/70" />
            </div>
            <p className="mt-6 text-base leading-relaxed text-[var(--color-text-muted)]">
              The saga is being forged. Enlist now and your name may be written into what comes next.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/auth/sign-up" className={CTA_FORGE}>
                Enlist now
              </Link>
            </div>
          </Container>
        </Section>
      )}

      {/* The colophon — the archive's closing inscription. */}
      <section className="relative mt-10 overflow-hidden border-t border-[color-mix(in_srgb,#c8a45a_18%,var(--color-line))]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 70% at 50% 100%, color-mix(in srgb, var(--color-highlight) 10%, transparent) 0%, transparent 72%)',
          }}
        />
        <Container className="relative z-10 flex flex-col items-center gap-6 py-20 text-center md:py-24">
          <RevealOnScroll>
            <span aria-hidden="true" className="anvl-display block text-lg leading-none text-[#c8a45a]">
              ⚒
            </span>
          </RevealOnScroll>
          <RevealOnScroll>
            <h2 className="anvl-heading max-w-3xl font-normal leading-[0.9] text-[clamp(2rem,6vw,4.25rem)]">
              The saga never ends.
            </h2>
          </RevealOnScroll>
          <RevealOnScroll>
            <p className="anvl-display max-w-xl text-[11px] leading-loose tracking-[0.26em] text-[var(--color-text-muted)]">
              Each drop binds the next volume. Take the oath, and march with the army that writes it.
            </p>
          </RevealOnScroll>
          <RevealOnScroll>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/shop" search={defaultShopUrlSearch} className={CTA_FORGE}>
                Enter the armory
              </Link>
              <Link to="/auth/sign-up" className={CTA_STEEL}>
                Enlist in the saga
              </Link>
            </div>
          </RevealOnScroll>
        </Container>
      </section>

      {activeChapter ? (
        <ChapterBook chapter={activeChapter} onClose={onCloseChapter} />
      ) : null}
    </>
  )
}
