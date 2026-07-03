import { Link } from '@tanstack/react-router'
import { Container } from '@/shared/components/ui'
import { RevealOnScroll } from '@/shared/components/motion/RevealOnScroll'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'

const CTA_FORGE =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-highlight)] bg-[var(--color-highlight)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-bg)] no-underline transition-opacity hover:opacity-90'
const CTA_STEEL =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] no-underline hover:border-[color-mix(in_oklab,var(--color-highlight)_60%,var(--color-line))]'

/** Gilded foil gradient for display accents — the athenaeum's leaf. */
const FOIL_TEXT: React.CSSProperties = {
  background: 'linear-gradient(100deg, #c8a45a 0%, #f3e3b3 45%, #c8a45a 70%, #8f7439 100%)',
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
}

/**
 * The saga's introduction — the Athenaeum of the Forge. A candlelit hall of
 * records: centred gilded frontispiece typography over pooled ember light,
 * framing the shelves of chapter-books below. Copy is code-owned (the saga's
 * chapters are the CMS content; the hall itself is designed).
 */
export function StoryHero() {
  return (
    <section
      className="relative overflow-hidden border-b border-[var(--color-line)]"
      aria-labelledby="story-hero-heading"
    >
      {/* Candlelit hall: two warm pools low in the frame + a cold fall-off up top. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 42% 34% at 22% 88%, color-mix(in srgb, var(--color-highlight) 13%, transparent) 0%, transparent 70%), radial-gradient(ellipse 42% 34% at 78% 88%, color-mix(in srgb, var(--color-highlight) 13%, transparent) 0%, transparent 70%), radial-gradient(ellipse 120% 80% at 50% 0%, color-mix(in srgb, var(--color-surface) 65%, transparent) 0%, transparent 60%)',
        }}
      />
      {/* Hall columns — thin gilded hairlines framing the frontispiece. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-10 left-[6%] hidden w-px bg-gradient-to-b from-transparent via-[color-mix(in_srgb,#c8a45a_35%,transparent)] to-transparent lg:block" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-10 right-[6%] hidden w-px bg-gradient-to-b from-transparent via-[color-mix(in_srgb,#c8a45a_35%,transparent)] to-transparent lg:block" />

      <Container className="relative z-10 flex flex-col items-center py-10 text-center md:py-14">
        <RevealOnScroll>
          <p className="anvl-display inline-flex items-center gap-2.5 text-[11px] tracking-[0.36em] text-[var(--color-highlight-bright)] before:h-px before:w-7 before:bg-[color-mix(in_srgb,#c8a45a_60%,transparent)] before:content-[''] after:h-px after:w-7 after:bg-[color-mix(in_srgb,#c8a45a_60%,transparent)] after:content-['']">
            The Saga of ANVL
          </p>
        </RevealOnScroll>

        <RevealOnScroll>
          <h1
            id="story-hero-heading"
            className="anvl-heading mt-4 max-w-2xl font-normal leading-[0.9] tracking-[-0.01em] text-[clamp(2rem,6vw,4.25rem)] text-[var(--color-heading)]"
          >
            The Forged <span style={FOIL_TEXT}>Kingdom</span>
          </h1>
        </RevealOnScroll>

        {/* Frontispiece ornament — rule · diamond · rule. */}
        <RevealOnScroll>
          <div className="mt-4 flex items-center gap-2.5" aria-hidden="true">
            <span className="h-px w-14 bg-gradient-to-r from-transparent to-[#c8a45a]/70 sm:w-20" />
            <span className="block h-1.5 w-1.5 rotate-45 border border-[#c8a45a]/80" />
            <span className="h-px w-14 bg-gradient-to-l from-transparent to-[#c8a45a]/70 sm:w-20" />
          </div>
        </RevealOnScroll>

        <RevealOnScroll>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--color-text-muted)] md:text-base">
            ANVL is a kingdom forging an army, and this is its hall of records. Pull a book from
            the shelf and read the acts within.
          </p>
        </RevealOnScroll>

        <RevealOnScroll>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/auth/sign-up" className={CTA_FORGE}>
              Enlist in the saga
            </Link>
            <Link to="/shop" search={defaultShopUrlSearch} className={CTA_STEEL}>
              Explore the armory
            </Link>
          </div>
        </RevealOnScroll>

        {/* Epigraph — small caps, the archive's inscription. */}
        <RevealOnScroll>
          <p className="anvl-display mt-7 max-w-xl text-[10px] leading-loose tracking-[0.24em] text-[var(--color-heading)]/60">
            “The story is written in iron — and you are written into the story.”
          </p>
        </RevealOnScroll>
      </Container>
    </section>
  )
}
