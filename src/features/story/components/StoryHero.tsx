import { Link } from '@tanstack/react-router'
import { Container } from '@/shared/components/ui'
import { RevealOnScroll } from '@/shared/components/motion/RevealOnScroll'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'

const CTA_FORGE =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-highlight)] bg-[var(--color-highlight)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-bg)] no-underline transition-opacity hover:opacity-90'
const CTA_STEEL =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] no-underline hover:border-[color-mix(in_oklab,var(--color-highlight)_60%,var(--color-line))]'

/** Forged foil for display accents — champagne drawn from the theme tokens,
 *  so the chronicle re-tempers with every CMS palette (never a hardcoded gold). */
const FOIL_TEXT: React.CSSProperties = {
  background:
    'linear-gradient(100deg, var(--color-highlight) 0%, var(--color-highlight-bright) 45%, var(--color-highlight) 70%, color-mix(in srgb, var(--color-highlight) 55%, black) 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
}

export interface StoryHeroStats {
  /** Drop groups on the shelf. */
  volumes: number
  /** Chapter books across every volume. */
  books: number
  /** Acts (pages) across every book. */
  acts: number
}

/**
 * The chronicle's opening spread — an asymmetric war-record frontispiece.
 * A colossal ghost inscription bleeds off the right edge, the title block
 * stands hard-left like a stamped cover, and the archive's ledger (volumes /
 * books / acts) hangs off a hairline rail. Copy is code-owned; the chapters
 * beneath are the CMS content.
 */
export function StoryHero({ stats }: { stats: StoryHeroStats }) {
  const ledger: Array<[number, string, string]> = [
    [stats.volumes, stats.volumes === 1 ? 'Volume' : 'Volumes', 'One per drop'],
    [stats.books, stats.books === 1 ? 'Book' : 'Books', 'One per piece'],
    [stats.acts, stats.acts === 1 ? 'Act' : 'Acts', 'The pages within'],
  ]

  return (
    <section className="relative overflow-hidden" aria-labelledby="story-hero-heading">
      {/* Ghost inscription — outlined, colossal, bleeding off the right edge. */}
      <span
        aria-hidden="true"
        className="anvl-heading pointer-events-none absolute -right-6 top-1/2 -translate-y-[46%] select-none leading-[0.8] text-transparent [font-size:clamp(9rem,26vw,22rem)]"
        style={{
          WebkitTextStroke:
            '1px color-mix(in srgb, var(--color-heading) 11%, transparent)',
        }}
      >
        SAGA
      </span>
      {/* A single ember shaft rising behind the title block. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 34% 60% at 18% 100%, color-mix(in srgb, var(--color-highlight) 12%, transparent) 0%, transparent 70%)',
        }}
      />

      <Container className="relative z-10 pb-12 pt-14 md:pb-16 md:pt-20">
        <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_auto]">
          {/* The stamped cover block — everything ranged hard left. */}
          <div className="max-w-2xl">
            <RevealOnScroll>
              <p className="anvl-display flex items-center gap-3 text-[11px] tracking-[0.36em] text-[var(--color-highlight-bright)]">
                <span aria-hidden="true" className="h-px w-10 bg-[var(--color-highlight)]/70" />
                The Saga of ANVL
              </p>
            </RevealOnScroll>

            <RevealOnScroll>
              <h1
                id="story-hero-heading"
                className="anvl-heading mt-5 font-normal leading-[0.85] tracking-[-0.01em] text-[clamp(2.75rem,8vw,6rem)] text-[var(--color-heading)]"
              >
                The Forged
                <br />
                <span style={FOIL_TEXT}>Kingdom</span>
              </h1>
            </RevealOnScroll>

            <RevealOnScroll>
              <p className="mt-6 max-w-md border-l-2 border-[color-mix(in_srgb,var(--color-highlight)_55%,var(--color-line))] pl-4 text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
                A kingdom forging an army — its record kept in iron. Every drop binds a
                volume, every piece a book. Pull one from the shelf and read the acts within.
              </p>
            </RevealOnScroll>

            <RevealOnScroll>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth/sign-up" className={CTA_FORGE}>
                  Enlist in the saga
                </Link>
                <Link to="/shop" search={defaultShopUrlSearch} className={CTA_STEEL}>
                  Explore the armory
                </Link>
              </div>
            </RevealOnScroll>
          </div>

          {/* The ledger — the archive's running tally on a hairline rail.
              Values wear the champagne foil so they separate from the bone
              ghost inscription standing behind them. */}
          <RevealOnScroll>
            <dl className="relative flex gap-10 border-l border-[color-mix(in_srgb,var(--color-highlight)_35%,var(--color-line))] bg-[color-mix(in_srgb,var(--color-bg)_72%,transparent)] py-2 pl-6 pr-2 lg:flex-col lg:gap-7 lg:pb-3">
              {ledger.map(([value, label, note]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd
                    className="anvl-heading leading-none text-[clamp(2rem,4vw,3rem)]"
                    style={FOIL_TEXT}
                  >
                    {String(value).padStart(2, '0')}
                  </dd>
                  <dd className="anvl-display mt-1 text-[10px] tracking-[0.26em] text-[var(--color-heading)]">
                    {label}
                  </dd>
                  <dd className="anvl-micro mt-0.5 hidden text-[9px] lg:block">{note}</dd>
                </div>
              ))}
            </dl>
          </RevealOnScroll>
        </div>

        {/* The spread's bottom rule — a heat hairline with the shelf direction. */}
        <RevealOnScroll>
          <div className="mt-12 flex items-center gap-4 md:mt-16">
            <span
              aria-hidden="true"
              className="h-px flex-1 bg-[linear-gradient(90deg,var(--color-highlight-bright)_0%,color-mix(in_srgb,var(--color-highlight)_45%,transparent)_35%,transparent_100%)]"
            />
            <p className="anvl-display shrink-0 text-[10px] tracking-[0.3em] text-[var(--color-heading)]/60">
              “The story is written in iron — and you are written into the story.”
            </p>
          </div>
        </RevealOnScroll>
      </Container>
    </section>
  )
}
