import { createFileRoute, Link } from '@tanstack/react-router'
import { BRAND } from '@/shared/constants/brand'
import {
  buildSeoHeadForSiteStaticPath,
  buildSeoMetaFromCmsSource,
  seoContentToMetaSource,
} from '@/features/cms/seoMeta'
import { runtimeClients } from '@/app/config/runtime'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'
import { Container, Section } from '@/shared/components/ui'
import { ForgeAtmosphere } from '@/shared/components/premium/ForgeAtmosphere'
import { WarBanner } from '@/shared/components/premium/WarBanner'
import { RevealOnScroll } from '@/shared/components/motion/RevealOnScroll'

const VALUES = [
  {
    label: 'Discipline Builds Freedom',
    body: 'Consistency beats motivation. We design for lifters who keep the oath when no one is watching.',
  },
  {
    label: 'Every Rep Is A Promise',
    body: 'Fabric, fit, and finishing have to survive hard sets — then still read premium when you walk out.',
  },
  {
    label: 'The Oath Never Expires',
    body: 'Drop 01 is only the beginning. Each release stays true to the same standard: training first.',
  },
  {
    label: 'Forged Under Pressure',
    body: 'Pressure reveals weakness — in iron and in design. We refine until the silhouette and hand feel hold up.',
  },
] as const

const CTA_FORGE =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-ember)] bg-[var(--color-ember)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-bg)] no-underline transition-opacity hover:opacity-90'
const CTA_STEEL =
  'focus-ring inline-flex h-11 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] no-underline hover:border-[color-mix(in_oklab,var(--color-ember)_60%,var(--color-line))]'

export const Route = createFileRoute('/about')({
  loader: async () => {
    const [siteSeo, seoDoc] = await Promise.all([
      runtimeClients.seo.getSiteSeo(),
      runtimeClients.seo.getSeoByPath('/about'),
    ])
    return { siteSeo, seoDoc }
  },
  head: ({ loaderData }) => {
    const site = loaderData?.siteSeo
    const doc = loaderData?.seoDoc
    const fb = { defaultShareImage: `${BRAND.canonicalBaseUrl}/brand/og-default.svg` }
    if (!site || !doc) {
      return buildSeoMetaFromCmsSource(
        seoContentToMetaSource(
          {
            title: 'About | ANVL Athletics',
            description:
              'ANVL Athletics is premium bodybuilding gymwear from Lebanon — discipline-first silhouettes forged under pressure, built for serious lifters worldwide.',
            canonicalPath: '/about',
          },
          fb,
        ),
        fb,
      )
    }
    return buildSeoHeadForSiteStaticPath('/about', doc, site)
  },
  component: AboutPage,
})

function AboutPage() {
  return (
    <>
      {/* Forged hero. */}
      <section className="relative overflow-hidden border-b border-[var(--color-line)]">
        <ForgeAtmosphere />
        <Container className="relative z-10 grid items-center gap-12 py-20 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div>
            <p className="anvl-display inline-flex items-center gap-2.5 text-xs tracking-[0.32em] text-[var(--color-ember-bright)] before:h-px before:w-8 before:bg-[var(--color-ember)] before:content-['']">
              The House of ANVL
            </p>
            <h1 className="anvl-heading mt-5 max-w-3xl font-normal leading-[0.88] tracking-[-0.01em] text-[clamp(2.75rem,9vw,6.5rem)] text-[var(--color-heading)]">
              Forged for serious lifters
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--color-text-muted)] md:text-lg">
              ANVL Athletics builds premium bodybuilding gymwear in Lebanon for disciplined lifters —
              from Beirut to the platform abroad. Training comes first; the silhouette stays premium
              when the session ends.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/shop" search={defaultShopUrlSearch} className={CTA_FORGE}>
                Explore Drop 01
              </Link>
              <Link to="/story" className={CTA_STEEL}>
                Read the story
              </Link>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[18rem] md:max-w-[20rem]">
            <WarBanner tone="#16130f" label="EST. LB" sway>
              <p className="anvl-display text-center text-[10px] tracking-[0.3em] text-[var(--color-ember-bright)]">
                Beirut · Lebanon
              </p>
            </WarBanner>
          </div>
        </Container>
      </section>

      <Section>
        <Container className="max-w-3xl space-y-6">
          <RevealOnScroll>
            <h2 className="anvl-heading text-[clamp(2rem,5vw,3.25rem)]">Our foundation</h2>
          </RevealOnScroll>
          <hr className="anvl-ember-rule max-w-[8rem]" />
          <RevealOnScroll>
            <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
              ANVL started from a simple read on culture: lifters deserve gear that respects the work — heavy cotton,
              honest stretch, compression that holds its shape, and details that feel industrial without looking careless.
            </p>
          </RevealOnScroll>
          <RevealOnScroll>
            <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
              We are not chasing noise. Each drop is tight, intentional, and built around silhouettes that survive leg
              day, pull day, and the walk home — so you never have to choose between performing and presenting.
            </p>
          </RevealOnScroll>
        </Container>
      </Section>

      <Section className="bg-[var(--color-surface)]">
        <Container className="max-w-3xl space-y-6">
          <RevealOnScroll>
            <h2 className="anvl-heading text-[clamp(2rem,5vw,3.25rem)]">Why Lebanon</h2>
          </RevealOnScroll>
          <hr className="anvl-ember-rule max-w-[8rem]" />
          <RevealOnScroll>
            <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
              The brand is rooted in Lebanon — a place where pressure is never theoretical. That friction shows up in how
              we edit color, texture, and proportion: dark, disciplined, premium. We ship that standard to lifters
              everywhere who want the same focus in what they wear.
            </p>
          </RevealOnScroll>
          <RevealOnScroll>
            <blockquote className="border-l-2 border-[var(--color-ember)] pl-6">
              <p className="text-lg text-[var(--color-text)]">
                Every release is a promise — to the lifter who shows up anyway.
              </p>
            </blockquote>
          </RevealOnScroll>
        </Container>
      </Section>

      <Section>
        <Container className="space-y-8">
          <RevealOnScroll>
            <h2 className="anvl-heading text-[clamp(2rem,5vw,3.25rem)]">What we stand on</h2>
          </RevealOnScroll>
          <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">
            The same lines that guide Drop 01 — The Oath — guide how we build the house.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {VALUES.map((item, i) => (
              <RevealOnScroll key={item.label}>
                <article className="group relative h-full overflow-hidden border border-[var(--color-line)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[color-mix(in_oklab,var(--color-ember)_45%,var(--color-line))] md:p-6">
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[var(--color-ember)] via-transparent to-transparent opacity-70"
                  />
                  <p className="anvl-display text-[11px] tracking-[0.26em] text-[var(--color-ember-bright)]">
                    {String(i + 1).padStart(2, '0')} · {item.label}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{item.body}</p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </Section>

      <section className="relative overflow-hidden border-t border-[var(--color-line)]">
        <ForgeAtmosphere />
        <Container className="relative z-10 flex flex-col gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <div>
            <h2 className="anvl-heading text-[clamp(1.875rem,5vw,3rem)]">Enter the oath</h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
              Shop Drop 01, read the story, or reach the team directly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/shop" search={defaultShopUrlSearch} className={CTA_FORGE}>
              Shop Drop 01
            </Link>
            <Link to="/story" className={CTA_STEEL}>
              The story
            </Link>
            <Link to="/contact" className={CTA_STEEL}>
              Contact
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
