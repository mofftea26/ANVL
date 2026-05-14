import { createFileRoute, Link } from '@tanstack/react-router'
import { BRAND } from '@/shared/constants/brand'
import {
  buildSeoMetaFromCmsSource,
  seoContentToMetaSource,
} from '@/features/cms/seoMeta'
import { runtimeClients } from '@/app/config/runtime'
import { defaultShopUrlSearch } from '@/features/products/shop/shopUrlSearch'
import { AnvlCrest } from '@/shared/assets/brand'
import { Container, Section } from '@/shared/components/ui'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import { IndustrialDivider } from '@/shared/components/layout/IndustrialDivider'

const VALUES = [
  {
    label: 'Discipline Builds Freedom',
    body: 'Consistency beats motivation. We design for lifters who keep the oath when no one is watching.',
  },
  {
    label: 'Every Rep Is A Promise',
    body: 'Fabric, fit, and finishing have to survive hard sets—then still read premium when you walk out.',
  },
  {
    label: 'The Oath Never Expires',
    body: 'Drop 01 is only the beginning. Each release stays true to the same standard: training first.',
  },
  {
    label: 'Forged Under Pressure',
    body: 'Pressure reveals weakness— in iron and in design. We refine until the silhouette and hand feel hold up.',
  },
] as const

export const Route = createFileRoute('/about')({
  loader: async () => {
    const [siteSeo, seoDoc] = await Promise.all([
      runtimeClients.cms.getSiteSeo(),
      runtimeClients.cms.getSeoByPath('/about'),
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
              'ANVL Athletics is premium bodybuilding gymwear from Lebanon—discipline-first silhouettes forged under pressure, built for serious lifters worldwide.',
            canonicalPath: '/about',
          },
          fb,
        ),
        fb,
      )
    }
    return buildSeoMetaFromCmsSource(
      seoContentToMetaSource(doc, site.globalDefaults),
      site.globalDefaults,
    )
  },
  component: AboutPage,
})

function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--color-line)]">
        <GrainOverlay />
        <AnvlCrest
          className="pointer-events-none absolute -right-12 top-1/2 z-0 h-[110%] w-auto -translate-y-1/2 text-[var(--color-heading)] opacity-[0.06] md:-right-24 md:opacity-[0.08]"
        />
        <Container className="relative z-10 py-16 md:py-24">
          <p className="anvl-micro">About</p>
          <h1 className="anvl-heading mt-4 max-w-4xl text-6xl leading-[0.95] md:text-8xl">
            Forged for serious lifters
          </h1>
          <p className="mt-6 max-w-2xl text-base text-[var(--color-text-muted)] md:text-lg">
            ANVL Athletics builds premium bodybuilding gymwear in Lebanon for disciplined lifters—from Beirut to the
            platform abroad. Training comes first; the silhouette stays premium when the session ends.
          </p>
        </Container>
      </section>

      <Section>
        <Container className="max-w-3xl space-y-6">
          <h2 className="anvl-heading text-5xl">Our foundation</h2>
          <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
            ANVL started from a simple read on culture: lifters deserve gear that respects the work—heavy cotton,
            honest stretch, compression that holds its shape, and details that feel industrial without looking careless.
          </p>
          <IndustrialDivider />
          <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
            We are not chasing noise. Each drop is tight, intentional, and built around silhouettes that survive leg
            day, pull day, and the walk home—so you never have to choose between performing and presenting.
          </p>
        </Container>
      </Section>

      <Section className="bg-[var(--color-surface)]">
        <Container className="max-w-3xl space-y-6">
          <h2 className="anvl-heading text-5xl">Why Lebanon</h2>
          <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
            The brand is rooted in Lebanon—a place where pressure is never theoretical. That friction shows up in how
            we edit color, texture, and proportion: dark, disciplined, premium. We ship that standard to lifters
            everywhere who want the same focus in what they wear.
          </p>
          <blockquote className="border-l-2 border-[var(--color-accent)] pl-6">
            <p className="text-lg text-[var(--color-text)]">
              Every release is a promise—to the lifter who shows up anyway.
            </p>
          </blockquote>
        </Container>
      </Section>

      <Section>
        <Container className="space-y-8">
          <h2 className="anvl-heading text-5xl">What we stand on</h2>
          <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">
            The same lines that guide Drop 01—The Oath—guide how we build the house.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            {VALUES.map((item) => (
              <article
                key={item.label}
                className="border border-[var(--color-line)] bg-[var(--color-surface)] p-5 md:p-6"
              >
                <p className="anvl-micro text-[var(--color-text-muted)]">{item.label}</p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{item.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
        <Container className="max-w-3xl space-y-6">
          <h2 className="anvl-heading text-5xl">Drop philosophy</h2>
          <p className="text-base leading-relaxed text-[var(--color-text-muted)]">
            We release in drops, not endless SKUs—so every piece earns its place. Heavyweight tees, a disciplined
            stringer, compression that stays honest under load: each pattern is tested against real training, then
            refined for a premium streetwear read when you are off the clock.
          </p>
          <IndustrialDivider />
          <p className="text-sm text-[var(--color-text-muted)]">
            Materials and care notes for Drop 01 live on the product pages and in the{' '}
            <Link to="/care-guide" className="text-[var(--color-text)] underline underline-offset-4 hover:opacity-90">
              care guide
            </Link>
            .
          </p>
        </Container>
      </Section>

      <Section>
        <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="anvl-heading text-4xl md:text-5xl">Enter the oath</h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--color-text-muted)]">
              Shop Drop 01, explore the full line, or reach the team directly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/drop/$slug"
              params={{ slug: 'the-oath' }}
              className="focus-ring inline-flex h-10 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-bg)] no-underline hover:opacity-90"
            >
              Explore Drop 01
            </Link>
            <Link
              to="/shop"
              search={defaultShopUrlSearch}
              className="focus-ring inline-flex h-10 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)] no-underline hover:bg-[var(--color-surface-elevated)]"
            >
              Shop all
            </Link>
            <Link
              to="/contact"
              className="focus-ring inline-flex h-10 items-center rounded-md border border-[var(--color-line)] bg-transparent px-4 text-sm font-semibold text-[var(--color-text)] no-underline hover:bg-[var(--color-chip)]"
            >
              Contact
            </Link>
            <a
              href="/#waitlist"
              className="focus-ring inline-flex h-10 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)] no-underline hover:bg-[var(--color-surface-elevated)]"
            >
              Join waitlist
            </a>
          </div>
        </Container>
      </Section>
    </>
  )
}
