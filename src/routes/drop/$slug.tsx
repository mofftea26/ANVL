import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { buildSeoMeta } from '@/app/seo/meta'
import { getActiveDrop, getDropBySlug } from '@/features/admin/drops/drops.service'
import { getStorefrontProductsForDropSlug } from '@/features/admin/products/products.commerce'
import { DropEmblemDecor } from '@/shared/components/brand/DropEmblemDecor'
import { Container, ProductCard, Section } from '@/shared/components/ui'

export const Route = createFileRoute('/drop/$slug')({
  loader: async ({ params }) => {
    const active = getActiveDrop()
    const drop = getDropBySlug(params.slug)
    if (!active) throw redirect({ to: '/', replace: true })
    if (!drop || drop.id !== active.id) {
      throw redirect({
        to: '/drop/$slug',
        params: { slug: active.slug },
        replace: true,
      })
    }
    const products = getStorefrontProductsForDropSlug(params.slug)
    return { drop, products }
  },
  head: ({ loaderData }) => {
    const d = loaderData?.drop
    return buildSeoMeta({
      title: d?.seo.title ?? 'Drop | ANVL Athletics',
      description: d?.seo.description ?? '',
      path: d ? `/drop/${d.slug}` : '/drop',
      image: d?.seo.ogImage,
    })
  },
  component: DropLandingPage,
})

function DropLandingPage() {
  const { drop, products } = Route.useLoaderData()

  return (
    <Section>
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="anvl-micro text-[var(--color-text-muted)]">
              Drop {drop.dropNumber}
            </p>
            <h1 className="anvl-heading mt-2 text-7xl md:text-8xl">{drop.title}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)] md:text-base">
              {drop.subtitle}
            </p>
            <p className="mt-4 max-w-xl text-sm text-[var(--color-text-muted)] md:text-base">
              {drop.description}
            </p>
            <Link
              to="/shop"
              className="anvl-micro mt-6 inline-flex text-[var(--color-heading)] underline-offset-4 hover:underline"
            >
              Shop the pieces →
            </Link>
          </div>
          <DropEmblemDecor
            src={drop.visuals.emblemImageUrl}
            presentationOnly
            className="mx-auto h-64 w-auto opacity-90 md:h-80 lg:h-96"
          />
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </Section>
  )
}
