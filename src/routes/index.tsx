import { createFileRoute, Link } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { toast } from 'sonner'
import { buildSeoMeta } from '@/app/seo/meta'
import { runtimeClients } from '@/app/config/runtime'
import { AnvlCrest } from '@/shared/assets/brand'
import { JsonLd } from '@/shared/components/seo/JsonLd'
import { organizationJsonLd } from '@/shared/components/seo/structuredData'
import {
  Badge,
  Button,
  Container,
  FormField,
  Input,
  ProductCard,
  Section,
  Select,
} from '@/shared/components/ui'
import { GrainOverlay } from '@/shared/components/layout/GrainOverlay'
import { IndustrialDivider } from '@/shared/components/layout/IndustrialDivider'
import { AnimatedText } from '@/shared/components/motion/AnimatedText'
import { useLenisScroll } from '@/shared/hooks/useLenisScroll'
import { useWaitlistForm } from '@/features/marketing/hooks/useWaitlistForm'
import { submitWaitlistMock } from '@/features/marketing/data/waitlist.mock'
import { useCartAnalytics } from '@/features/analytics/hooks/useCartAnalytics'

const DropRevealSection = lazy(() =>
  import('@/features/marketing/components/DropRevealSection').then((module) => ({
    default: module.DropRevealSection,
  })),
)

export const Route = createFileRoute('/')({
  loader: async () => {
    const [products, homepage] = await Promise.all([
      runtimeClients.commerce.getProducts(),
      runtimeClients.cms.getHomepageContent(),
    ])
    return { products, homepage }
  },
  head: () =>
    buildSeoMeta({
      title: 'ANVL Athletics | Forged Under Pressure',
      description: 'Premium bodybuilding gymwear built for disciplined lifters.',
      path: '/',
    }),
  component: HomePage,
})

function HomePage() {
  useLenisScroll(true)
  const { products, homepage } = Route.useLoaderData()
  const waitlistForm = useWaitlistForm()
  const { trackWaitlist } = useCartAnalytics()

  const onWaitlistSubmit = waitlistForm.handleSubmit(async (values) => {
    await submitWaitlistMock(values)
    trackWaitlist(values.email, values.preferredProduct)
    toast.success('You are on the waitlist.')
    waitlistForm.reset()
  })

  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <section className="relative min-h-[88vh] overflow-hidden border-b border-[var(--color-line)]">
        <GrainOverlay />
        <Container className="relative z-10 flex min-h-[88vh] flex-col justify-center py-16">
          <Badge>{homepage.hero.subtitle}</Badge>
          <AnimatedText>
            <h1 className="anvl-heading mt-6 max-w-4xl text-7xl leading-[0.9] md:text-9xl">
              {homepage.hero.title}
            </h1>
          </AnimatedText>
          <p className="mt-6 max-w-2xl text-base text-[var(--color-text-muted)] md:text-lg">
            {homepage.hero.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/drop/the-oath" className="focus-ring inline-flex h-10 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 text-sm font-semibold text-[var(--color-bg)] no-underline">
              {homepage.hero.primaryCta.label}
            </Link>
            <a
              href="#waitlist"
              className="focus-ring inline-flex h-10 items-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm font-semibold no-underline"
            >
              {homepage.hero.secondaryCta.label}
            </a>
          </div>
          <AnvlCrest className="mt-12 h-20 w-20 text-[var(--color-accent)] opacity-70" />
        </Container>
      </section>

      <Suspense fallback={<Section><Container>Loading sequence...</Container></Section>}>
        <DropRevealSection products={products} />
      </Suspense>

      <Section>
        <Container>
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="anvl-heading text-5xl">Drop Products</h2>
            <Link to="/shop" className="anvl-micro">
              View all
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </Container>
      </Section>

      <Section className="bg-[var(--color-surface)]">
        <Container className="space-y-8">
          <h2 className="anvl-heading text-5xl">Manifesto</h2>
          <p className="max-w-3xl text-lg text-[var(--color-text-muted)]">{homepage.manifesto.heading}</p>
          <IndustrialDivider />
          <div className="grid gap-3 md:grid-cols-2">
            {homepage.manifesto.lines.map((line) => (
              <p key={line} className="anvl-micro border border-[var(--color-line)] p-4 text-sm">
                {line}
              </p>
            ))}
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <h2 className="anvl-heading text-5xl">Materials & Quality</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {homepage.materials.map((material) => (
              <article key={material.title} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
                <h3 className="anvl-heading text-3xl">{material.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">{material.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </Section>

      <Section id="waitlist" className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
        <Container className="max-w-3xl">
          <h2 className="anvl-heading text-5xl">Join The Oath</h2>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Get notified when Drop 01 opens.
          </p>
          <form className="mt-6 space-y-4" onSubmit={onWaitlistSubmit}>
            <FormField label="Email" error={waitlistForm.formState.errors.email?.message}>
              <Input {...waitlistForm.register('email')} type="email" />
            </FormField>
            <FormField label="First Name (optional)" error={waitlistForm.formState.errors.firstName?.message}>
              <Input {...waitlistForm.register('firstName')} />
            </FormField>
            <FormField
              label="Preferred Product (optional)"
              error={waitlistForm.formState.errors.preferredProduct?.message}
            >
              <Select {...waitlistForm.register('preferredProduct')}>
                <option value="">Select product</option>
                {products.map((item) => (
                  <option value={item.slug} key={item.slug}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <Button type="submit" disabled={waitlistForm.formState.isSubmitting}>
              {waitlistForm.formState.isSubmitting ? 'Submitting...' : 'Join Waitlist'}
            </Button>
          </form>
        </Container>
      </Section>
    </>
  )
}
