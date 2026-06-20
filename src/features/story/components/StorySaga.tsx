import { Link } from '@tanstack/react-router'
import { Container, Section } from '@/shared/components/ui'
import { ForgeAtmosphere } from '@/shared/components/premium/ForgeAtmosphere'
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

/** Composes the Story page: intro → chapter shelf → deep-linkable book overlay. */
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

  return (
    <>
      <StoryHero />

      {chapters.length > 0 ? (
        <StoryShelf chapters={chapters} onOpen={onOpenChapter} />
      ) : (
        <Section>
          <Container className="max-w-2xl text-center">
            <h2 className="anvl-heading text-[clamp(1.75rem,4.5vw,3rem)] font-normal leading-[0.95]">
              The first chapter is still on the anvil.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-text-muted)]">
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

      {/* Closing CTA — desktop/tablet only; mobile keeps the page tight. */}
      <section className="relative hidden overflow-hidden border-t border-[var(--color-line)] md:block">
        <ForgeAtmosphere />
        <Container className="relative z-10 max-w-3xl space-y-6 py-20 text-center md:py-28">
          <h2 className="anvl-heading text-[clamp(2.25rem,7vw,5rem)] font-normal leading-[0.9]">
            The saga never ends.
          </h2>
          <hr className="anvl-highlight-rule mx-auto max-w-[12rem]" />
          <p className="mx-auto max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
            Each drop forges the next chapter. Take the oath, and march with the army that builds it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/shop" search={defaultShopUrlSearch} className={CTA_FORGE}>
              Enter the armory
            </Link>
            <Link to="/auth/sign-up" className={CTA_STEEL}>
              Enlist in the saga
            </Link>
          </div>
        </Container>
      </section>

      {activeChapter ? (
        <ChapterBook chapter={activeChapter} onClose={onCloseChapter} />
      ) : null}
    </>
  )
}
