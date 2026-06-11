import { Link } from '@tanstack/react-router'
import { AnvlStacked } from '@/shared/assets/brand'
import { Container } from '@/shared/components/ui'
import { ForgeAtmosphere } from '@/shared/components/premium/ForgeAtmosphere'
import { WarBanner } from '@/shared/components/premium/WarBanner'
import { RevealOnScroll } from '@/shared/components/motion/RevealOnScroll'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'

const CTA_FORGE =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-ember)] bg-[var(--color-ember)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-bg)] no-underline transition-opacity hover:opacity-90'
const CTA_STEEL =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] no-underline hover:border-[color-mix(in_oklab,var(--color-ember)_60%,var(--color-line))]'

/**
 * The saga's introduction: frames ANVL as a kingdom forging an army, and the
 * customer as a soldier written into the ongoing story told across drops.
 */
export function StoryHero() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--color-line)]">
        <ForgeAtmosphere />
        <Container className="relative z-10 grid items-center gap-12 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div>
            <p className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.32em] text-[var(--color-ember-bright)] before:h-px before:w-8 before:bg-[var(--color-ember)] before:content-['']">
              The Saga of ANVL
            </p>
            <h1 className="anvl-heading mt-5 max-w-3xl font-normal leading-[0.86] tracking-[-0.01em] text-[clamp(3rem,11vw,8rem)] text-[var(--color-heading)]">
              The Forged Kingdom
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg">
              ANVL is more than a brand — it is a kingdom forging an army. Every drop adds a chapter
              to one unfolding saga, and every soldier who enlists is written into it. The most loyal
              rise from recruits to generals; the newcomers take their oath at the gate.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg">
              Each chapter below is a drop. Open one like an ancient book and read the acts within.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/auth/sign-up" className={CTA_FORGE}>
                Enlist in the saga
              </Link>
              <Link to="/shop" search={defaultShopUrlSearch} className={CTA_STEEL}>
                Explore the armory
              </Link>
            </div>
          </div>

          {/* The war banner is tall — desktop/tablet only to keep mobile short. */}
          <div className="mx-auto hidden w-full max-w-[18rem] md:block md:max-w-[20rem]">
            <WarBanner
              tone="#1b130d"
              label="MMXXVI"
              placeholderMark={
                <AnvlStacked className="h-[60%] w-auto max-w-[72%] text-[var(--anvl-bone)]" />
              }
              sway
            >
              <p className="anvl-display text-center text-[10px] tracking-[0.3em] text-[var(--color-ember-bright)]">
                Forged Under Pressure
              </p>
            </WarBanner>
          </div>
        </Container>
      </section>

      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <Container className="max-w-3xl py-16 text-center md:py-20">
          <RevealOnScroll>
            <p className="anvl-heading text-[clamp(1.75rem,4.5vw,3rem)] font-normal leading-[0.95]">
              The story is written in iron, and you are written into the story.
            </p>
          </RevealOnScroll>
        </Container>
      </section>
    </>
  )
}
