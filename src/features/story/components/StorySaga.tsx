import { useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { Container, Section } from '@/shared/components/ui'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
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
  /** Act id to jump straight to within the opened chapter (from `?act=`). */
  activeAct?: string
  onOpenChapter: (slug: string) => void
  onCloseChapter: () => void
}

const CTA_FORGE =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-highlight)] bg-[var(--color-highlight)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-bg)] no-underline transition-opacity hover:opacity-90'
const CTA_STEEL =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] no-underline hover:border-[color-mix(in_oklab,var(--color-highlight)_60%,var(--color-line))]'

/** Roman numeral for a volume divider (1-indexed, pragmatic range). */
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

/** Deterministic drifting embers — [leftPct, bottomPct, dxPx, durSec, delaySec, sizePx].
 *  Fixed table (no Math.random) → SSR-safe; drift disabled under reduced motion. */
const EMBERS: ReadonlyArray<[number, number, number, number, number, number]> = [
  [6, 3, 16, 10, 0, 3],
  [16, 1, -12, 12, 3, 2],
  [31, 6, 12, 9, 1.4, 3],
  [47, 2, 20, 13, 4.6, 2],
  [59, 5, -16, 11, 0.8, 3],
  [72, 1, 12, 12, 2.6, 2],
  [84, 7, -10, 10, 1.6, 3],
  [93, 2, 18, 11, 5.4, 2],
]

/**
 * The vault the whole page lives in — one continuous backdrop instead of
 * per-section fills: a cold stone ceiling falling to an ember-lit floor, faint
 * shelf-column hairlines at the margins, drifting sparks, grain. Everything is
 * theme tokens, so the archive re-lights with the CMS palette.
 */
function ChronicleAtmosphere() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(140% 55% at 50% 108%, color-mix(in srgb, var(--color-highlight) 9%, transparent) 0%, transparent 60%), linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 45%, var(--color-bg)) 0%, var(--color-bg) 26%, var(--color-bg) 100%)',
        }}
      />
      {/* Shelf columns — hairlines standing at the vault's margins only, so
          nothing competes with the books at centre stage. */}
      <div
        className="absolute inset-y-0 left-0 hidden w-[14%] xl:block"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, color-mix(in srgb, var(--color-heading) 5%, transparent) 0 1px, transparent 1px 72px)',
          maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)',
        }}
      />
      <div
        className="absolute inset-y-0 right-0 hidden w-[14%] xl:block"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, color-mix(in srgb, var(--color-heading) 5%, transparent) 0 1px, transparent 1px 72px)',
          maskImage: 'linear-gradient(270deg, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(270deg, black 0%, transparent 100%)',
        }}
      />
      {/* Drifting sparks rising from the floor of the vault. */}
      <div className="absolute inset-0">
        {EMBERS.map(([left, bottom, dx, dur, delay, size], i) => (
          <span
            key={i}
            className="anvl-spark absolute rounded-full"
            style={{
              left: `${left}%`,
              bottom: `${bottom}%`,
              width: `${size}px`,
              height: `${size}px`,
              background: 'var(--color-highlight-bright)',
              boxShadow: '0 0 6px 1px var(--color-highlight-soft)',
              ['--ember-dx' as string]: `${dx}px`,
              ['--spark-dur' as string]: `${dur}s`,
              animationDelay: `${delay}s`,
            }}
          />
        ))}
      </div>
      <GrainOverlay intensity="subtle" />
    </div>
  )
}

/**
 * Volume divider above each drop's shelf — a chronicle spine, not a plaque:
 * the volume numeral stands colossal and outlined, the drop label ranges
 * beside it, and a heat rule runs off toward the books.
 */
function ChronicleDivider({
  index,
  label,
  count,
}: {
  index: number
  label: string
  count: number
}) {
  const numeral = romanNumeral(index + 1)
  return (
    <Container>
      <RevealOnScroll>
        <div className="flex items-end gap-4 sm:gap-6">
          <span
            aria-hidden="true"
            className="anvl-heading select-none leading-[0.78] text-transparent [font-size:clamp(3.5rem,8vw,7rem)]"
            style={{
              WebkitTextStroke:
                '1.5px color-mix(in srgb, var(--color-highlight) 50%, transparent)',
            }}
          >
            {numeral}
          </span>
          <div className="min-w-0 flex-1 pb-1">
            <p className="anvl-display text-[10px] tracking-[0.32em] text-[var(--color-highlight-bright)]">
              Volume {numeral} · Drop record
            </p>
            <div className="mt-1.5 flex items-baseline gap-4">
              <h2 className="anvl-heading min-w-0 truncate font-normal leading-none text-[clamp(1.75rem,4.5vw,3.25rem)] text-[var(--color-heading)]">
                {label}
              </h2>
            </div>
          </div>
          <span className="anvl-display hidden shrink-0 border border-[color-mix(in_srgb,var(--color-highlight)_30%,var(--color-line))] px-3 py-1.5 pb-1 text-[10px] tracking-[0.26em] text-[var(--color-text-muted)] sm:block">
            {count} {count === 1 ? 'book' : 'books'}
          </span>
        </div>
        {/* Heat rule running off under the spine, toward the shelf. */}
        <div
          aria-hidden="true"
          className="mt-3 h-px w-full bg-[linear-gradient(90deg,var(--color-highlight-bright)_0%,color-mix(in_srgb,var(--color-highlight)_50%,transparent)_30%,color-mix(in_srgb,var(--color-line)_60%,transparent)_70%,transparent_100%)]"
        />
      </RevealOnScroll>
    </Container>
  )
}

/**
 * Composes the Story page — the War Chronicle: frontispiece spread → per-drop
 * volume shelves (the 3D bookshelf, untouched) → the closing plate → the
 * deep-linkable book overlay. One continuous atmosphere sits behind it all.
 */
export function StorySaga({
  chapters,
  activeChapterSlug,
  activeAct,
  onOpenChapter,
  onCloseChapter,
}: StorySagaProps) {
  const activeChapter =
    activeChapterSlug != null
      ? (chapters.find((c) => c.slug === activeChapterSlug) ?? null)
      : null

  // Record the read for the Chronicle challenges. A partial unique index makes
  // a re-read a no-op, so "read every chapter" cannot be satisfied by
  // reopening one book. Lazy-imported to keep supabase-js off the story
  // route's eager graph, and fire-and-forget — a missed count must never
  // interfere with opening a book.
  useEffect(() => {
    if (!activeChapterSlug) return
    void import('@/features/passport/api/armoryEventsClient')
      .then((m) => m.recordArmoryEvent({ type: 'chapter_read', targetId: activeChapterSlug }))
      .catch(() => {})
  }, [activeChapterSlug])

  const dropGroups = groupByDrop(chapters)
  const actCount = chapters.reduce((sum, c) => sum + c.acts.length, 0)

  return (
    <div className="relative">
      <ChronicleAtmosphere />

      <div className="relative z-10">
        <StoryHero
          stats={{ volumes: dropGroups.length, books: chapters.length, acts: actCount }}
        />

        {chapters.length > 0 ? (
          <div className="space-y-14 pt-12">
            {dropGroups.map((group, i) => (
              <section key={group.key} aria-label={group.label}>
                <ChronicleDivider index={i} label={group.label} count={group.chapters.length} />
                <StoryShelf chapters={group.chapters} onOpen={onOpenChapter} />
              </section>
            ))}
          </div>
        ) : (
          <Section>
            <Container className="max-w-2xl py-6 text-center">
              <p
                aria-hidden="true"
                className="anvl-heading text-transparent [font-size:clamp(3rem,8vw,5rem)] leading-none"
                style={{
                  WebkitTextStroke:
                    '1.5px color-mix(in srgb, var(--color-highlight) 50%, transparent)',
                }}
              >
                I
              </p>
              <h2 className="anvl-heading mt-5 text-[clamp(1.75rem,4.5vw,3rem)] font-normal leading-[0.95]">
                The first volume is still on the anvil.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-[var(--color-text-muted)]">
                The saga is being forged. Enlist now and your name may be written into what
                comes next.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link to="/auth/sign-up" className={CTA_FORGE}>
                  Enlist now
                </Link>
              </div>
            </Container>
          </Section>
        )}

        {/* The closing plate — the chronicle's final inscription, framed. */}
        <section className="relative mt-20 pb-20 md:mt-24 md:pb-24">
          <Container className="max-w-3xl">
            <RevealOnScroll>
              <div className="relative px-6 py-14 text-center md:px-12 md:py-16">
                {/* Corner ticks — the plate's engraved frame. */}
                {(
                  [
                    'left-0 top-0 border-l border-t',
                    'right-0 top-0 border-r border-t',
                    'bottom-0 left-0 border-b border-l',
                    'bottom-0 right-0 border-b border-r',
                  ] as const
                ).map((corner) => (
                  <span
                    key={corner}
                    aria-hidden="true"
                    className={`absolute h-8 w-8 border-[color-mix(in_srgb,var(--color-highlight)_45%,var(--color-line))] ${corner}`}
                  />
                ))}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse 70% 80% at 50% 100%, color-mix(in srgb, var(--color-highlight) 8%, transparent) 0%, transparent 70%)',
                  }}
                />
                <span
                  aria-hidden="true"
                  className="anvl-display block text-lg leading-none text-[var(--color-highlight)]"
                >
                  ⚒
                </span>
                <h2 className="anvl-heading mt-5 font-normal leading-[0.9] text-[clamp(2rem,5.5vw,3.75rem)]">
                  The saga never ends.
                </h2>
                <p className="anvl-display mx-auto mt-5 max-w-xl text-[11px] leading-loose tracking-[0.26em] text-[var(--color-text-muted)]">
                  Each drop binds the next volume. Take the oath, and march with the army
                  that writes it.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Link to="/shop" search={defaultShopUrlSearch} className={CTA_FORGE}>
                    Enter the armory
                  </Link>
                  <Link to="/auth/sign-up" className={CTA_STEEL}>
                    Enlist in the saga
                  </Link>
                </div>
              </div>
            </RevealOnScroll>
          </Container>
        </section>
      </div>

      {activeChapter ? (
        <ChapterBook chapter={activeChapter} initialAct={activeAct} onClose={onCloseChapter} />
      ) : null}
    </div>
  )
}
