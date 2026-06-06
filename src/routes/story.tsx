import { createFileRoute, Link } from '@tanstack/react-router'
import { BRAND } from '@/shared/constants/brand'
import {
  buildSeoMetaFromCmsSource,
  seoContentToMetaSource,
} from '@/features/cms/seoMeta'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'
import { Container, Section } from '@/shared/components/ui'
import { WarBanner } from '@/shared/components/premium/WarBanner'
import { ForgeAtmosphere } from '@/shared/components/premium/ForgeAtmosphere'
import { RevealOnScroll } from '@/shared/components/motion/RevealOnScroll'

const CHAPTERS = [
  {
    index: '01',
    title: 'Pressure',
    body: 'It starts under load. The bar bends, the lungs burn, the mind asks to stop. Pressure is not the enemy — it is the instrument. Nothing forged was ever shaped in comfort.',
    tone: '#1a1410',
  },
  {
    index: '02',
    title: 'Repetition',
    body: 'One rep proves nothing. Ten thousand prove everything. The Oath is the same strike, repeated past the point of motivation, until the movement is no longer a choice — it is who you are.',
    tone: '#161719',
  },
  {
    index: '03',
    title: 'Discipline',
    body: 'Discipline is chaos aligned. The early alarm, the logged set, the meal you did not want. Each one a small order imposed on a loud world. Freedom is what that order buys you.',
    tone: '#121417',
  },
  {
    index: '04',
    title: 'Heat',
    body: 'Steel is only honest at temperature. So are we. Heat is the session that breaks the version of you that was comfortable, and tempers the one that remains.',
    tone: '#1b130d',
  },
] as const

const CTA_FORGE =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-ember)] bg-[var(--color-ember)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-bg)] no-underline transition-opacity hover:opacity-90'
const CTA_STEEL =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] no-underline hover:border-[color-mix(in_oklab,var(--color-ember)_60%,var(--color-line))]'

export const Route = createFileRoute('/story')({
  head: () => {
    const fb = { defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.svg` }
    return buildSeoMetaFromCmsSource(
      seoContentToMetaSource(
        {
          title: 'The Oath — Story | ANVL Athletics',
          description:
            'The story of Drop 01 — The Oath. A body built through pressure, repetition, discipline, and heat. Discipline repeated until it becomes identity.',
          canonicalPath: '/story',
        },
        fb,
      ),
      fb,
    )
  },
  component: StoryPage,
})

function StoryPage() {
  return (
    <>
      {/* Forged hero — the oath raised on a war banner. */}
      <section className="relative overflow-hidden border-b border-[var(--color-line)]">
        <ForgeAtmosphere />
        <Container className="relative z-10 grid items-center gap-12 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div>
            <p className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.32em] text-[var(--color-ember-bright)] before:h-px before:w-8 before:bg-[var(--color-ember)] before:content-['']">
              Drop 01 — The Story
            </p>
            <h1 className="anvl-heading mt-5 max-w-3xl font-normal leading-[0.86] tracking-[-0.01em] text-[clamp(3rem,11vw,8rem)] text-[var(--color-heading)]">
              The Oath
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg">
              A body built through pressure, repetition, discipline, and heat. The Oath is not
              motivation — it is discipline repeated until it becomes identity.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/shop" search={defaultShopUrlSearch} className={CTA_FORGE}>
                Explore Drop 01
              </Link>
              <Link to="/about" className={CTA_STEEL}>
                About ANVL
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[18rem] md:max-w-[20rem]">
            <WarBanner tone="#1b130d" label="MMXXVI" sway>
              <p className="anvl-display text-center text-[10px] tracking-[0.3em] text-[var(--color-ember-bright)]">
                Forged Under Pressure
              </p>
            </WarBanner>
          </div>
        </Container>
      </section>

      <Section>
        <Container className="max-w-3xl">
          <RevealOnScroll>
            <p className="anvl-heading max-w-2xl font-normal leading-[0.95] tracking-[-0.01em] text-[clamp(1.75rem,4.5vw,3rem)]">
              The Oath is taken in silence, and kept in repetition.
            </p>
          </RevealOnScroll>
        </Container>
      </Section>

      {CHAPTERS.map((chapter, i) => (
        <Section
          key={chapter.index}
          className={i % 2 === 1 ? 'bg-[var(--color-surface)]' : undefined}
        >
          <Container className="grid gap-8 md:grid-cols-[auto_1fr] md:gap-12">
            <RevealOnScroll>
              <span className="anvl-display block text-[clamp(3rem,9vw,7rem)] leading-none text-[var(--color-ember)] opacity-90">
                {chapter.index}
              </span>
            </RevealOnScroll>
            <div className="max-w-2xl">
              <RevealOnScroll>
                <h2 className="anvl-heading text-[clamp(2rem,6vw,3.75rem)] font-normal leading-[0.92]">
                  {chapter.title}
                </h2>
              </RevealOnScroll>
              <hr className="anvl-ember-rule mt-5 max-w-[8rem]" />
              <RevealOnScroll>
                <p className="mt-5 text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg">
                  {chapter.body}
                </p>
              </RevealOnScroll>
            </div>
          </Container>
        </Section>
      ))}

      <section className="relative overflow-hidden border-t border-[var(--color-line)]">
        <ForgeAtmosphere />
        <Container className="relative z-10 max-w-3xl space-y-6 py-20 text-center md:py-28">
          <RevealOnScroll>
            <h2 className="anvl-heading text-[clamp(2.25rem,7vw,5rem)] font-normal leading-[0.9]">
              The Oath never expires.
            </h2>
          </RevealOnScroll>
          <hr className="anvl-ember-rule mx-auto max-w-[12rem]" />
          <p className="mx-auto max-w-xl text-base leading-relaxed text-[var(--color-text-muted)]">
            Drop 01 is the first vow. Three pieces, built around the tenets, made to honor the work.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/shop" search={defaultShopUrlSearch} className={CTA_FORGE}>
              Shop Drop 01
            </Link>
            <Link to="/auth/sign-up" className={CTA_STEEL}>
              Join the waitlist
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
